create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  category text not null,
  title text not null,
  body text not null default '',
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_category_check
    check (category in ('orders', 'messages', 'sellers', 'collabs', 'referrals')),
  constraint notifications_type_check check (type in (
    'order_placed',
    'order_accepted',
    'order_declined',
    'payment_submitted',
    'payment_verified',
    'payment_failed',
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
  ))
);

create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, category),
  constraint notification_preferences_category_check
    check (category in ('orders', 'messages', 'sellers', 'collabs', 'referrals'))
);

create table if not exists public.seller_subscriptions (
  buyer_id uuid not null references auth.users(id) on delete cascade,
  stall_id uuid not null references public.stalls(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (buyer_id, stall_id)
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;
create unique index if not exists notifications_dedupe_uniq
  on public.notifications (recipient_id, dedupe_key);
create index if not exists seller_subscriptions_stall_id_idx
  on public.seller_subscriptions (stall_id);

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.seller_subscriptions enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications for select
to authenticated
using (recipient_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

revoke insert on public.notifications from anon, authenticated;
revoke delete on public.notifications from anon, authenticated;

drop policy if exists notification_preferences_select_own on public.notification_preferences;
create policy notification_preferences_select_own
on public.notification_preferences for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_update_own
on public.notification_preferences for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists notification_preferences_insert_own on public.notification_preferences;
create policy notification_preferences_insert_own
on public.notification_preferences for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists seller_subscriptions_select_own on public.seller_subscriptions;
create policy seller_subscriptions_select_own
on public.seller_subscriptions for select
to authenticated
using (buyer_id = auth.uid());

drop policy if exists seller_subscriptions_insert_buyer on public.seller_subscriptions;
create policy seller_subscriptions_insert_buyer
on public.seller_subscriptions for insert
to authenticated
with check (
  buyer_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'buyer'
  )
);

drop policy if exists seller_subscriptions_delete_own on public.seller_subscriptions;
create policy seller_subscriptions_delete_own
on public.seller_subscriptions for delete
to authenticated
using (buyer_id = auth.uid());

create or replace function public.notifications_enabled(p_user uuid, p_category text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select enabled from public.notification_preferences where user_id = p_user and category = p_category),
    true
  );
$$;

create or replace function public.stall_follower_count(p_stall_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.seller_subscriptions
  where stall_id = p_stall_id;
$$;

revoke all on function public.stall_follower_count(uuid) from public;
grant execute on function public.stall_follower_count(uuid) to anon, authenticated;

create or replace function public.notify_recipient(
  p_recipient uuid,
  p_actor uuid,
  p_type text,
  p_category text,
  p_title text,
  p_body text,
  p_action_url text,
  p_metadata jsonb,
  p_dedupe_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient is null then
    return;
  end if;

  if not public.notifications_enabled(p_recipient, p_category) then
    return;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    category,
    title,
    body,
    action_url,
    metadata,
    dedupe_key
  )
  values (
    p_recipient,
    p_actor,
    p_type,
    p_category,
    p_title,
    coalesce(p_body, ''),
    p_action_url,
    coalesce(p_metadata, '{}'::jsonb),
    p_dedupe_key
  )
  on conflict (recipient_id, dedupe_key) do nothing;
end;
$$;

create or replace function public.trg_order_item_notify_seller()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_stall_name text;
  v_buyer_id uuid;
  v_buyer_name text;
begin
  select s.user_id, s.name into v_seller, v_stall_name
  from public.stalls s where s.id = new.stall_id;

  select o.buyer_id, o.buyer_name into v_buyer_id, v_buyer_name
  from public.orders o where o.id = new.order_id;

  perform public.notify_recipient(
    v_seller,
    v_buyer_id,
    'order_placed',
    'orders',
    'New order received',
    format('%s ordered %s (x%s) from %s', coalesce(v_buyer_name, 'A buyer'), new.title, new.quantity, coalesce(v_stall_name, 'your stall')),
    '/dashboard?tab=orders&order=' || new.order_id,
    jsonb_build_object(
      'order_id', new.order_id,
      'order_item_id', new.id,
      'product_id', new.product_id,
      'stall_id', new.stall_id
    ),
    'order_placed:' || new.order_id || ':' || new.stall_id::text
  );

  return new;
end;
$$;

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
  elsif new.status in ('shipped', 'out_for_delivery') then
    perform public.notify_recipient(
      v_buyer_id, v_seller, 'out_for_delivery', 'orders',
      'Your order is on the way',
      format(
        '%s is %s. Track %s in your orders.',
        coalesce(new.stall_name, 'The artisan'),
        case when new.status = 'shipped' then 'shipping your order' else 'out for delivery' end,
        new.title
      ),
      v_url,
      jsonb_build_object('order_id', new.order_id, 'order_item_id', new.id, 'status', new.status, 'tracking_number', new.tracking_number, 'carrier', new.carrier),
      'out_for_delivery:' || new.id::text || ':' || new.status
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

create or replace function public.trg_order_notify_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_first text;
begin
  if new.payment_status is not distinct from old.payment_status
     and new.dispute_status is not distinct from old.dispute_status then
    return new;
  end if;

  select s.user_id into v_seller
  from public.order_items oi
  join public.stalls s on s.id = oi.stall_id
  where oi.order_id = new.id
  limit 1;

  v_first := coalesce(new.buyer_transaction_last5, '');

  if new.payment_status = 'pending_verification'
     and old.payment_status is distinct from new.payment_status then
    perform public.notify_recipient(
      v_seller, new.buyer_id, 'payment_submitted', 'orders',
      'Payment verification needed',
      format('%s submitted payment proof (UTR ...%s). Verify it in your UPI app.', new.buyer_name, v_first),
      '/dashboard?tab=orders&order=' || new.id,
      jsonb_build_object('order_id', new.id, 'buyer_name', new.buyer_name, 'last5', v_first),
      'payment_submitted:' || new.id
    );
  elsif new.payment_status = 'confirmed'
     and old.payment_status is distinct from new.payment_status then
    perform public.notify_recipient(
      new.buyer_id, v_seller, 'payment_verified', 'orders',
      'Payment verified',
      format('Payment for order %s was verified. Your artisan will pack it next.', new.id),
      '/orders?order=' || new.id,
      jsonb_build_object('order_id', new.id, 'verified_last5', new.seller_confirmed_last5),
      'payment_verified:' || new.id
    );
  elsif new.payment_status = 'failed'
     and old.payment_status is distinct from new.payment_status then
    perform public.notify_recipient(
      new.buyer_id, v_seller, 'payment_failed', 'orders',
      'Payment could not be verified',
      format('We could not verify the payment for order %s. Please contact the artisan.', new.id),
      '/orders?order=' || new.id,
      jsonb_build_object('order_id', new.id),
      'payment_failed:' || new.id
    );
  end if;

  if new.dispute_status = 'reported'
     and old.dispute_status is distinct from new.dispute_status then
    perform public.notify_recipient(
      v_seller, new.buyer_id, 'dispute_raised', 'orders',
      'Dispute raised',
      format('%s raised a dispute on order %s: %s', new.buyer_name, new.id, coalesce(new.dispute_issue, 'No details provided')),
      '/dashboard?tab=orders&order=' || new.id,
      jsonb_build_object('order_id', new.id, 'issue', new.dispute_issue),
      'dispute_raised:' || new.id
    );
  elsif new.dispute_status = 'resolved'
     and old.dispute_status is distinct from new.dispute_status then
    perform public.notify_recipient(
      new.buyer_id, v_seller, 'dispute_resolved', 'orders',
      'Dispute resolved',
      format('The dispute on order %s has been resolved.', new.id),
      '/orders?order=' || new.id,
      jsonb_build_object('order_id', new.id),
      'dispute_resolved:' || new.id
    );
  end if;

  return new;
end;
$$;

create or replace function public.trg_order_message_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_sender_is_buyer boolean;
  v_url text;
begin
  if new.sender_role = 'system' then
    return new;
  end if;

  select o.buyer_id into v_buyer_id from public.orders o where o.id = new.order_id;
  v_sender_is_buyer := new.sender_id is not null and v_buyer_id = new.sender_id;
  v_url := '/orders?order=' || new.order_id || '&tab=chat';

  if v_sender_is_buyer then
    perform public.notify_recipient(
      s.user_id, new.sender_id, 'chat_message', 'messages',
      'New message from ' || new.sender_name,
      left(new.message, 140),
      v_url,
      jsonb_build_object('order_id', new.order_id, 'message_id', new.id),
      'chat_message:' || new.order_id || ':' || new.id::text
    );
  else
    perform public.notify_recipient(
      v_buyer_id, new.sender_id, 'chat_message', 'messages',
      'New message from ' || new.sender_name,
      left(new.message, 140),
      v_url,
      jsonb_build_object('order_id', new.order_id, 'message_id', new.id),
      'chat_message:' || new.order_id || ':' || new.id::text
    );
  end if;

  return new;
end;
$$;

create or replace function public.trg_product_notify_subscribers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stall_name text;
begin
  select s.name into v_stall_name from public.stalls s where s.id = new.stall_id;

  if v_stall_name is null then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    category,
    title,
    body,
    action_url,
    metadata,
    dedupe_key
  )
  select
    ss.buyer_id,
    s.user_id,
    'seller_new_product',
    'sellers',
    'New from ' || v_stall_name,
    format('%s just added %s (%s).', v_stall_name, new.title, format('INR %s', coalesce(new.price, 0))),
    '/stall/' || s.slug,
    jsonb_build_object('product_id', new.id, 'stall_id', new.stall_id, 'stall_slug', s.slug),
    'seller_new_product:' || new.id::text || ':' || ss.buyer_id::text
  from public.seller_subscriptions ss
  join public.stalls s on s.id = ss.stall_id
  where ss.stall_id = new.stall_id
    and public.notifications_enabled(ss.buyer_id, 'sellers')
  on conflict (recipient_id, dedupe_key) do nothing;

  return new;
end;
$$;

create or replace function public.trg_collab_notify_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_recipient(
    new.seller_id, new.influencer_id, 'collab_proposal', 'collabs',
    'New collaboration pitch',
    format('%s (%s) wants to promote %s. Commission: %s%%.', new.influencer_name, new.influencer_handle, coalesce(new.product_title, 'your stall'), coalesce(new.commission_pct, 0)),
    '/dashboard?tab=collabs&collab=' || new.id::text,
    jsonb_build_object('collab_id', new.id, 'product_id', new.product_id, 'tracking_code', new.tracking_code),
    'collab_proposal:' || new.id::text
  );

  return new;
end;
$$;

create or replace function public.trg_collab_notify_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'accepted' then
    perform public.notify_recipient(
      new.influencer_id, new.seller_id, 'collab_accepted', 'collabs',
      'Collaboration accepted',
      format('%s accepted your pitch for %s. Your tracking link is live.', coalesce(new.stall_name, 'The seller'), coalesce(new.product_title, 'the product')),
      '/influencer?collab=' || new.id::text,
      jsonb_build_object('collab_id', new.id, 'tracking_code', new.tracking_code, 'tracking_url', new.tracking_url),
      'collab_accepted:' || new.id::text
    );
  elsif new.status = 'declined' then
    perform public.notify_recipient(
      new.influencer_id, new.seller_id, 'collab_declined', 'collabs',
      'Collaboration declined',
      format('%s declined your pitch for %s.', coalesce(new.stall_name, 'The seller'), coalesce(new.product_title, 'the product')),
      '/influencer?collab=' || new.id::text,
      jsonb_build_object('collab_id', new.id),
      'collab_declined:' || new.id::text
    );
  end if;

  return new;
end;
$$;

create or replace function public.trg_referral_click_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_recipient(
    new.influencer_id, null, 'referral_click', 'referrals',
    'Someone used your link',
    format('A new visitor tapped your link for %s. Share it to grow your earnings.', coalesce(new.ref_code, 'your collaboration')),
    '/influencer?collab=' || new.collab_id::text,
    jsonb_build_object('collab_id', new.collab_id, 'product_id', new.product_id, 'visitor_id', new.visitor_id),
    'referral_click:' || new.collab_id::text || ':' || coalesce(new.visitor_id::text, new.id::text)
  );

  update public.collab_proposals
  set clicks = clicks + 1, updated_at = now()
  where id = new.collab_id;

  return new;
end;
$$;

create or replace function public.trg_referral_order_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_recipient(
    new.influencer_id, new.buyer_id, 'referral_order', 'referrals',
    'You made a sale',
    format('An order worth INR %s came through your link. Commission earned: INR %s.', new.gmv, new.commission_amount),
    '/influencer?collab=' || new.collab_id::text,
    jsonb_build_object('collab_id', new.collab_id, 'order_id', new.order_id, 'gmv', new.gmv, 'commission_amount', new.commission_amount),
    'referral_order:' || new.order_id || ':' || new.collab_id::text
  );

  return new;
end;
$$;

create or replace function public.trg_referral_order_delivered_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status or new.status <> 'delivered' then
    return new;
  end if;

  perform public.notify_recipient(
    new.influencer_id, null, 'referral_delivered', 'referrals',
    'Commission confirmed',
    format('Order %s was delivered. Your commission of INR %s is confirmed.', new.order_id, new.commission_amount),
    '/influencer?collab=' || new.collab_id::text,
    jsonb_build_object('collab_id', new.collab_id, 'order_id', new.order_id, 'commission_amount', new.commission_amount),
    'referral_delivered:' || new.order_id || ':' || new.collab_id::text
  );

  return new;
end;
$$;

drop trigger if exists on_order_item_insert_notify on public.order_items;
create trigger on_order_item_insert_notify
after insert on public.order_items
for each row execute function public.trg_order_item_notify_seller();

drop trigger if exists on_order_item_status_notify on public.order_items;
create trigger on_order_item_status_notify
after update on public.order_items
for each row execute function public.trg_order_item_notify_status();

drop trigger if exists on_order_update_notify on public.orders;
create trigger on_order_update_notify
after update on public.orders
for each row execute function public.trg_order_notify_payment();

drop trigger if exists on_order_message_insert_notify on public.order_messages;
create trigger on_order_message_insert_notify
after insert on public.order_messages
for each row execute function public.trg_order_message_notify();

drop trigger if exists on_product_insert_notify on public.products;
create trigger on_product_insert_notify
after insert on public.products
for each row execute function public.trg_product_notify_subscribers();

drop trigger if exists on_collab_insert_notify on public.collab_proposals;
create trigger on_collab_insert_notify
after insert on public.collab_proposals
for each row execute function public.trg_collab_notify_insert();

drop trigger if exists on_collab_status_notify on public.collab_proposals;
create trigger on_collab_status_notify
after update on public.collab_proposals
for each row execute function public.trg_collab_notify_status();

drop trigger if exists on_referral_click_notify on public.referral_clicks;
create trigger on_referral_click_notify
after insert on public.referral_clicks
for each row execute function public.trg_referral_click_notify();

drop trigger if exists on_referral_order_notify on public.referral_orders;
create trigger on_referral_order_notify
after insert on public.referral_orders
for each row execute function public.trg_referral_order_notify();

drop trigger if exists on_referral_order_delivered_notify on public.referral_orders;
create trigger on_referral_order_delivered_notify
after update on public.referral_orders
for each row execute function public.trg_referral_order_delivered_notify();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category text;
begin
  insert into public.profiles (id, email, name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'buyer'
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
