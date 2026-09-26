-- 007_payment_prompt_and_shipped_type.sql
--
-- Fixes two defects found by the second automated end-to-end run.
--
-- 1. notifications_type_check did not include the 'order_shipped' type added in
--    006, so every "shipped" transition died with 23514 check_violation. The
--    order_items UPDATE rolled back, so sellers could never mark an item
--    shipped and buyers never saw the alert. DDL alone does not surface this;
--    it only fails at the first INSERT that uses the new value.
--
-- 2. payment_submitted still never reached sellers. place_order() writes
--    buyer_transaction_last5 and payment_status = 'pending_verification' in the
--    initial INSERT, and on_order_update_notify is AFTER UPDATE only, so the
--    prompt was never generated for the real checkout flow. Added an
--    AFTER INSERT trigger on orders so the seller is asked to verify as soon as
--    the order lands. The dedupe key now includes the UTR, so a corrected
--    submission re-alerts while a replayed one does not.
--
-- Safe to re-run: constraint and functions are replaced in place.

-- ---------------------------------------------------------------------------
-- 1. Allow the order_shipped notification type.
-- ---------------------------------------------------------------------------
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (type in (
    'order_placed',
    'order_accepted',
    'order_declined',
    'payment_submitted',
    'payment_verified',
    'payment_failed',
    'order_shipped',
    'out_for_delivery',
    'delivered',
    'dispute_raised',
    'dispute_resolved',
    'chat_message',
    'seller_new_product',
    'collab_proposal',
    'collab_accepted',
    'collab_declined',
    'referral_click',
    'referral_order',
    'referral_delivered'
  ));

-- ---------------------------------------------------------------------------
-- 2a. Payment prompt on order creation.
-- ---------------------------------------------------------------------------
create or replace function public.trg_order_notify_payment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller record;
  v_last5 text;
begin
  v_last5 := coalesce(new.buyer_transaction_last5, '');

  if new.payment_status <> 'pending_verification' or v_last5 = '' then
    return new;
  end if;

  for v_seller in
    select distinct s.user_id
    from public.order_items oi
    join public.stalls s on s.id = oi.stall_id
    where oi.order_id = new.id
  loop
    perform public.notify_recipient(
      v_seller.user_id, new.buyer_id, 'payment_submitted', 'orders',
      'Payment verification needed',
      format('%s submitted payment proof (UTR ...%s). Verify it in your UPI app.', new.buyer_name, v_last5),
      '/dashboard?tab=orders&order=' || new.id,
      jsonb_build_object('order_id', new.id, 'buyer_name', new.buyer_name, 'last5', v_last5),
      'payment_submitted:' || new.id || ':' || v_seller.user_id::text || ':' || v_last5
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists on_order_insert_notify on public.orders;
create trigger on_order_insert_notify
after insert on public.orders
for each row execute function public.trg_order_notify_payment_insert();

-- ---------------------------------------------------------------------------
-- 2b. Keep the AFTER UPDATE path for proof submitted after checkout, and let a
--     UTR-only update through the early-return guard.
-- ---------------------------------------------------------------------------
create or replace function public.trg_order_notify_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text;
  v_seller record;
  v_utr_submitted boolean;
begin
  if new.payment_status is not distinct from old.payment_status
     and new.dispute_status is not distinct from old.dispute_status
     and new.buyer_transaction_last5 is not distinct from old.buyer_transaction_last5 then
    return new;
  end if;

  v_first := coalesce(new.buyer_transaction_last5, '');

  v_utr_submitted := new.payment_status = 'pending_verification'
                     and v_first <> ''
                     and new.buyer_transaction_last5 is distinct from old.buyer_transaction_last5;

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

  -- Dispute changes are checked first so a combined update cannot be swallowed
  -- by the payment branch below.
  for v_seller in
    select distinct s.user_id
    from public.order_items oi
    join public.stalls s on s.id = oi.stall_id
    where oi.order_id = new.id
  loop
    if new.dispute_status = 'reported'
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
    elsif v_utr_submitted then
      perform public.notify_recipient(
        v_seller.user_id, new.buyer_id, 'payment_submitted', 'orders',
        'Payment verification needed',
        format('%s submitted payment proof (UTR ...%s). Verify it in your UPI app.', new.buyer_name, v_first),
        '/dashboard?tab=orders&order=' || new.id,
        jsonb_build_object('order_id', new.id, 'buyer_name', new.buyer_name, 'last5', v_first),
        'payment_submitted:' || new.id || ':' || v_seller.user_id::text || ':' || v_first
      );
    elsif new.payment_status = 'pending_verification'
       and old.payment_status is distinct from new.payment_status then
      perform public.notify_recipient(
        v_seller.user_id, new.buyer_id, 'payment_submitted', 'orders',
        'Payment verification needed',
        format('%s has an order awaiting payment. Check the order for payment proof.', new.buyer_name),
        '/dashboard?tab=orders&order=' || new.id,
        jsonb_build_object('order_id', new.id, 'buyer_name', new.buyer_name, 'last5', v_first),
        'payment_submitted:' || new.id || ':' || v_seller.user_id::text
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
