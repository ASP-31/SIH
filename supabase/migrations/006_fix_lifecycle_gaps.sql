-- 006_fix_lifecycle_gaps.sql
--
-- Fixes five defects found by an automated end-to-end run against the live project.
--
-- 1. trg_order_message_notify() referenced an undefined alias `s`, so every
--    buyer -> seller chat message raised 42P01 and the whole INSERT rolled back.
--    Order chat was completely non-functional.
-- 2. payment_submitted never fired. place_order() already stores
--    payment_status = 'pending_verification' for UPI at INSERT time, and
--    submit_order_payment() re-writes that same value, so the trigger's
--    "status changed" guard was always false and sellers were never asked to
--    verify payment. Keyed off the UTR appearing instead.
-- 3. verify_order_payment() accepted any p_last5, so a seller could confirm an
--    order without matching the buyer's UTR. Now validated.
-- 4. Both `shipped` and `out_for_delivery` emitted type `out_for_delivery`,
--    so the buyer saw two near-identical "on the way" alerts. Split them.
-- 5. handle_new_user() hardcoded role = 'buyer', so a seller registering with
--    role 'seller' in signup metadata still got a buyer profile.
--
-- Safe to re-run: functions are replaced in place, triggers are recreated.

-- ---------------------------------------------------------------------------
-- 1. Chat notifications: resolve the sellers from order_items -> stalls.
-- ---------------------------------------------------------------------------
create or replace function public.trg_order_message_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_sender_is_buyer boolean;
  v_seller record;
  v_url text;
  v_meta jsonb;
begin
  if new.sender_role = 'system' then
    return new;
  end if;

  select o.buyer_id into v_buyer_id from public.orders o where o.id = new.order_id;
  v_sender_is_buyer := new.sender_id is not null and v_buyer_id = new.sender_id;
  v_url := '/orders?order=' || new.order_id || '&tab=chat';
  v_meta := jsonb_build_object('order_id', new.order_id, 'message_id', new.id);

  -- Buyer wrote: every distinct seller on the order is a recipient.
  if v_sender_is_buyer then
    for v_seller in
      select distinct s.user_id
      from public.order_items oi
      join public.stalls s on s.id = oi.stall_id
      where oi.order_id = new.order_id
    loop
      perform public.notify_recipient(
        v_seller.user_id, new.sender_id, 'chat_message', 'messages',
        'New message from ' || new.sender_name,
        left(new.message, 140),
        v_url,
        v_meta,
        'chat_message:' || new.order_id || ':' || new.id::text
      );
    end loop;
  else
    -- Seller wrote: the buyer is the single recipient.
    perform public.notify_recipient(
      v_buyer_id, new.sender_id, 'chat_message', 'messages',
      'New message from ' || new.sender_name,
      left(new.message, 140),
      v_url,
      v_meta,
      'chat_message:' || new.order_id || ':' || new.id::text
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2 + 4. Order status alerts: split shipped from out_for_delivery.
-- ---------------------------------------------------------------------------
create or replace function public.trg_order_item_notify_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller uuid;
  v_url text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select o.buyer_id into v_buyer_id from public.orders o where o.id = new.order_id;
  select s.user_id into v_seller from public.stalls s where s.id = new.stall_id;
  v_url := '/orders?order=' || new.order_id;

  if new.status = 'ready_to_pack' then
    perform public.notify_recipient(
      v_buyer_id, v_seller, 'order_accepted', 'orders',
      'Order accepted',
      format('%s accepted your order for %s', coalesce(new.stall_name, 'The artisan'), new.title),
      v_url,
      jsonb_build_object('order_id', new.order_id, 'order_item_id', new.id, 'status', new.status),
      'order_accepted:' || new.id::text
    );
  elsif new.status = 'cancelled' then
    perform public.notify_recipient(
      v_buyer_id, v_seller, 'order_declined', 'orders',
      'Order declined',
      format('%s could not fulfil %s. Your payment will be refunded.', coalesce(new.stall_name, 'The artisan'), new.title),
      v_url,
      jsonb_build_object('order_id', new.order_id, 'order_item_id', new.id, 'status', new.status),
      'order_declined:' || new.id::text
    );
  elsif new.status = 'shipped' then
    perform public.notify_recipient(
      v_buyer_id, v_seller, 'order_shipped', 'orders',
      'Your order has shipped',
      format(
        '%s has shipped %s. Track %s in your orders.',
        coalesce(new.stall_name, 'The artisan'),
        new.title,
        coalesce(new.carrier, 'the courier')
      ),
      v_url,
      jsonb_build_object('order_id', new.order_id, 'order_item_id', new.id, 'status', new.status, 'tracking_number', new.tracking_number, 'carrier', new.carrier),
      'order_shipped:' || new.id::text
    );
  elsif new.status = 'out_for_delivery' then
    perform public.notify_recipient(
      v_buyer_id, v_seller, 'out_for_delivery', 'orders',
      'Out for delivery',
      format(
        '%s is out for delivery with %s.',
        coalesce(new.stall_name, 'The artisan'),
        new.title
      ),
      v_url,
      jsonb_build_object('order_id', new.order_id, 'order_item_id', new.id, 'status', new.status, 'tracking_number', new.tracking_number, 'carrier', new.carrier),
      'out_for_delivery:' || new.id::text
    );
  elsif new.status = 'delivered' then
    perform public.notify_recipient(
      v_seller, v_buyer_id, 'delivered', 'orders',
      'Order delivered',
      format('Delivery of %s was confirmed by the buyer. Payment is released.', new.title),
      '/dashboard?tab=orders&order=' || new.order_id,
      jsonb_build_object('order_id', new.order_id, 'order_item_id', new.id, 'status', new.status),
      'delivered:' || new.id::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_order_item_status_notify on public.order_items;
create trigger on_order_item_status_notify
after update on public.order_items
for each row execute function public.trg_order_item_notify_status();

-- ---------------------------------------------------------------------------
-- 2. payment_submitted: key off the buyer submitting a UTR.
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
     and new.dispute_status is not distinct from old.dispute_status then
    return new;
  end if;

  v_first := coalesce(new.buyer_transaction_last5, '');

  -- True when this update is the buyer handing over payment proof: the UTR
  -- went from empty to a value while the order still awaits verification.
  v_utr_submitted := new.buyer_transaction_last5 is not null
                     and new.buyer_transaction_last5 is distinct from old.buyer_transaction_last5
                     and new.payment_status = 'pending_verification';

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
    if v_utr_submitted then
      perform public.notify_recipient(
        v_seller.user_id, new.buyer_id, 'payment_submitted', 'orders',
        'Payment verification needed',
        format('%s submitted payment proof (UTR ...%s). Verify it in your UPI app.', new.buyer_name, v_first),
        '/dashboard?tab=orders&order=' || new.id,
        jsonb_build_object('order_id', new.id, 'buyer_name', new.buyer_name, 'last5', v_first),
        'payment_submitted:' || new.id || ':' || v_seller.user_id::text
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

-- ---------------------------------------------------------------------------
-- 3. verify_order_payment must match the UTR the buyer submitted.
-- ---------------------------------------------------------------------------
create or replace function public.verify_order_payment(p_order_id text, p_last5 text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.orders;
begin
  if v_actor is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_order_seller(p_order_id, v_actor) then
    raise exception 'Only the seller can verify payment';
  end if;

  select * into v_order from public.orders where id = p_order_id;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.payment_status = 'confirmed' then
    raise exception 'Payment for this order was already verified';
  end if;

  if v_order.buyer_transaction_last5 is null or v_order.buyer_transaction_last5 = '' then
    raise exception 'The buyer has not submitted payment proof yet';
  end if;

  if p_last5 is null or btrim(p_last5) = '' then
    raise exception 'Enter the last 5 digits of the UTR you received';
  end if;

  if right(btrim(p_last5), 5) <> right(btrim(v_order.buyer_transaction_last5), 5) then
    raise exception 'UTR does not match the reference the buyer submitted';
  end if;

  update public.orders
  set payment_status = 'confirmed',
      seller_confirmed_last5 = p_last5,
      payment_verified_at = now(),
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Respect the role supplied at signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category text;
  v_role text;
begin
  v_role := case lower(coalesce(new.raw_user_meta_data->>'role', 'buyer'))
              when 'seller' then 'seller'
              when 'admin' then 'admin'
              else 'buyer'
            end;

  insert into public.profiles (id, email, name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    v_role
  )
  on conflict (id) do nothing;

  foreach v_category in array array['orders', 'messages', 'sellers', 'collabs', 'referrals'] loop
    insert into public.notification_preferences (user_id, category, enabled)
    values (new.id, v_category, true)
    on conflict (user_id, category) do nothing;
  end loop;

  return new;
end;
$$;
