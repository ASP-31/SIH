-- 005_order_payment_fanout.sql
--
-- Fix: trg_order_notify_payment() resolved a single seller with `limit 1`, so on a
-- multi-stall order (a cart containing items from more than one artisan) only one
-- seller was ever told to verify payment, and disputes only reached one of them.
--
-- A single order can span several stalls, so payment-proof and dispute alerts must
-- fan out to every distinct seller on the order. Buyer-directed alerts are
-- unaffected (they have exactly one recipient).
--
-- Safe to re-run: the function is replaced in place and the trigger is recreated.

create or replace function public.trg_order_notify_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text;
  v_seller record;
begin
  if new.payment_status is not distinct from old.payment_status
     and new.dispute_status is not distinct from old.dispute_status then
    return new;
  end if;

  v_first := coalesce(new.buyer_transaction_last5, '');

  -- Buyer-facing alerts: one recipient, sent once.
  if new.payment_status = 'confirmed'
     and old.payment_status is distinct from new.payment_status then
    perform public.notify_recipient(
      new.buyer_id, null, 'payment_verified', 'orders',
      'Payment verified',
      format('Payment for order %s was verified. Your artisan will pack it next.', new.id),
      '/orders?order=' || new.id,
      jsonb_build_object('order_id', new.id, 'verified_last5', new.seller_confirmed_last5),
      'payment_verified:' || new.id
    );
  elsif new.payment_status = 'failed'
     and old.payment_status is distinct from new.payment_status then
    perform public.notify_recipient(
      new.buyer_id, null, 'payment_failed', 'orders',
      'Payment could not be verified',
      format('We could not verify the payment for order %s. Please contact the artisan.', new.id),
      '/orders?order=' || new.id,
      jsonb_build_object('order_id', new.id),
      'payment_failed:' || new.id
    );
  end if;

  -- Seller-facing alerts: every distinct stall on the order, deduped by seller so a
  -- seller with several items in one order is still only notified once.
  for v_seller in
    select distinct s.user_id
    from public.order_items oi
    join public.stalls s on s.id = oi.stall_id
    where oi.order_id = new.id
  loop
    if new.payment_status = 'pending_verification'
       and old.payment_status is distinct from new.payment_status then
      perform public.notify_recipient(
        v_seller.user_id, new.buyer_id, 'payment_submitted', 'orders',
        'Payment verification needed',
        format('%s submitted payment proof (UTR ...%s). Verify it in your UPI app.', new.buyer_name, v_first),
        '/dashboard?tab=orders&order=' || new.id,
        jsonb_build_object('order_id', new.id, 'buyer_name', new.buyer_name, 'last5', v_first),
        'payment_submitted:' || new.id || ':' || v_seller.user_id::text
      );
    elsif new.dispute_status = 'reported'
       and old.dispute_status is distinct from new.dispute_status then
      perform public.notify_recipient(
        v_seller.user_id, new.buyer_id, 'dispute_raised', 'orders',
        'Dispute raised',
        format('%s raised a dispute on order %s: %s', new.buyer_name, new.id, coalesce(new.dispute_issue, 'No details provided')),
        '/dashboard?tab=orders&order=' || new.id,
        jsonb_build_object('order_id', new.id, 'issue', new.dispute_issue),
        'dispute_raised:' || new.id || ':' || v_seller.user_id::text
      );
    elsif new.dispute_status = 'resolved'
       and old.dispute_status is distinct from new.dispute_status then
      perform public.notify_recipient(
        v_seller.user_id, new.buyer_id, 'dispute_resolved', 'orders',
        'Dispute resolved',
        format('The dispute on order %s has been resolved.', new.id),
        '/dashboard?tab=orders&order=' || new.id,
        jsonb_build_object('order_id', new.id),
        'dispute_resolved:' || new.id || ':' || v_seller.user_id::text
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_order_update_notify on public.orders;
create trigger on_order_update_notify
after update on public.orders
for each row execute function public.trg_order_notify_payment();
