create sequence if not exists public.order_number_seq;

create table if not exists public.orders (
  id text primary key default ('TOT-' || lpad(nextval('public.order_number_seq')::text, 8, '0')),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  shipping_address jsonb not null default '{}'::jsonb,
  delivery_method text not null default 'standard',
  payment_method text not null default 'upi',
  payment_status text not null default 'pending',
  buyer_transaction_last5 text,
  seller_confirmed_last5 text,
  payment_verified_at timestamptz,
  delivery_scheduled_date text,
  carrier text,
  tracking_number text,
  dispute_status text not null default 'none',
  dispute_issue text,
  dispute_created_at timestamptz,
  subtotal numeric not null default 0,
  shipping_total numeric not null default 0,
  total_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_delivery_method_check check (delivery_method in ('standard', 'express')),
  constraint orders_payment_method_check check (payment_method in ('card', 'upi', 'apple_pay')),
  constraint orders_payment_status_check
    check (payment_status in ('paid', 'pending', 'failed', 'pending_verification', 'confirmed')),
  constraint orders_dispute_status_check check (dispute_status in ('none', 'reported', 'resolved'))
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  stall_id uuid not null references public.stalls(id) on delete restrict,
  stall_name text,
  title text not null,
  price_at_purchase numeric not null,
  quantity integer not null,
  image_url text,
  status text not null default 'pending',
  tracking_number text,
  carrier text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_status_check
    check (status in ('pending', 'ready_to_pack', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'))
);

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_name text not null,
  sender_role text not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint order_messages_sender_role_check check (sender_role in ('buyer', 'seller', 'system'))
);

create table if not exists public.artist_reviews (
  id uuid primary key default gen_random_uuid(),
  stall_id uuid not null references public.stalls(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  user_name text not null,
  buyer_name text,
  user_location text,
  rating integer not null,
  title text,
  comment text not null,
  craft_purchased text,
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  constraint artist_reviews_rating_check check (rating between 1 and 5)
);

create table if not exists public.collab_proposals (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references auth.users(id) on delete cascade,
  influencer_name text not null,
  influencer_handle text not null,
  influencer_avatar text,
  influencer_followers text,
  influencer_niche text,
  seller_id uuid not null references auth.users(id) on delete cascade,
  stall_id uuid references public.stalls(id) on delete set null,
  stall_name text,
  product_id uuid references public.products(id) on delete set null,
  product_title text,
  product_image text,
  product_price numeric,
  promo_format text not null,
  pitch_message text,
  sample_requested boolean not null default false,
  commission_pct numeric not null default 0,
  tracking_code text,
  tracking_url text,
  status text not null default 'pending',
  clicks integer not null default 0,
  orders_count integer not null default 0,
  revenue_generated numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collab_proposals_status_check
    check (status in ('pending', 'accepted', 'declined', 'in_discussion'))
);

create table if not exists public.collab_messages (
  id uuid primary key default gen_random_uuid(),
  collab_id uuid not null references public.collab_proposals(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_role text not null,
  sender_name text not null,
  text text not null,
  created_at timestamptz not null default now(),
  constraint collab_messages_sender_role_check check (sender_role in ('influencer', 'seller'))
);

create table if not exists public.referral_clicks (
  id uuid primary key default gen_random_uuid(),
  collab_id uuid not null references public.collab_proposals(id) on delete cascade,
  influencer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  visitor_id uuid,
  ref_code text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_orders (
  id uuid primary key default gen_random_uuid(),
  collab_id uuid not null references public.collab_proposals(id) on delete cascade,
  influencer_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  buyer_id uuid references auth.users(id) on delete set null,
  gmv numeric not null default 0,
  commission_amount numeric not null default 0,
  status text not null default 'placed',
  attributed_at timestamptz not null default now(),
  delivered_at timestamptz,
  constraint referral_orders_status_check check (status in ('placed', 'delivered', 'refunded')),
  constraint referral_orders_order_collab_uniq unique (order_id, collab_id)
);

create index if not exists orders_buyer_id_idx on public.orders (buyer_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_stall_id_idx on public.order_items (stall_id);
create index if not exists order_items_status_idx on public.order_items (status);
create index if not exists order_messages_order_id_idx on public.order_messages (order_id);
create index if not exists collab_proposals_seller_id_idx on public.collab_proposals (seller_id);
create index if not exists collab_proposals_influencer_id_idx on public.collab_proposals (influencer_id);
create index if not exists collab_proposals_tracking_code_idx on public.collab_proposals (tracking_code);
create index if not exists collab_messages_collab_id_idx on public.collab_messages (collab_id);
create index if not exists referral_clicks_influencer_id_idx on public.referral_clicks (influencer_id);
create index if not exists referral_orders_influencer_id_idx on public.referral_orders (influencer_id);
create unique index if not exists referral_clicks_first_visit_uniq
  on public.referral_clicks (collab_id, visitor_id);

create or replace function public.is_order_buyer(p_order_id text, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id and o.buyer_id = p_user
  );
$$;

create or replace function public.is_order_seller(p_order_id text, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.stalls s on s.id = oi.stall_id
    where oi.order_id = p_order_id
      and s.user_id = p_user
  );
$$;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_messages enable row level security;
alter table public.artist_reviews enable row level security;
alter table public.collab_proposals enable row level security;
alter table public.collab_messages enable row level security;
alter table public.referral_clicks enable row level security;
alter table public.referral_orders enable row level security;

drop policy if exists orders_select_participant on public.orders;
create policy orders_select_participant
on public.orders for select
to authenticated
using (buyer_id = auth.uid() or public.is_order_seller(id, auth.uid()));

revoke update on public.orders from authenticated;
grant update (buyer_transaction_last5, dispute_status, dispute_issue, dispute_created_at)
  on public.orders to authenticated;

revoke insert on public.orders from authenticated, anon;
revoke insert on public.order_items from authenticated, anon;

drop policy if exists order_items_select_participant on public.order_items;
create policy order_items_select_participant
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.buyer_id = auth.uid()
  )
  or public.is_order_seller(order_id, auth.uid())
);

drop policy if exists order_items_update_seller on public.order_items;
create policy order_items_update_seller
on public.order_items for update
to authenticated
using (public.is_order_seller(order_id, auth.uid()))
with check (public.is_order_seller(order_id, auth.uid()));

drop policy if exists order_messages_select_participant on public.order_messages;
create policy order_messages_select_participant
on public.order_messages for select
to authenticated
using (public.is_order_seller(order_id, auth.uid()) or public.is_order_buyer(order_id, auth.uid()));

drop policy if exists order_messages_insert_participant on public.order_messages;
create policy order_messages_insert_participant
on public.order_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and (
    public.is_order_seller(order_id, auth.uid())
    or public.is_order_buyer(order_id, auth.uid())
  )
);

drop policy if exists artist_reviews_select_public on public.artist_reviews;
create policy artist_reviews_select_public
on public.artist_reviews for select
to anon, authenticated
using (true);

drop policy if exists artist_reviews_insert_own on public.artist_reviews;
create policy artist_reviews_insert_own
on public.artist_reviews for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists collab_proposals_select_participant on public.collab_proposals;
create policy collab_proposals_select_participant
on public.collab_proposals for select
to authenticated
using (seller_id = auth.uid() or influencer_id = auth.uid());

drop policy if exists collab_proposals_insert_own on public.collab_proposals;
create policy collab_proposals_insert_own
on public.collab_proposals for insert
to authenticated
with check (influencer_id = auth.uid());

drop policy if exists collab_proposals_update_seller on public.collab_proposals;
create policy collab_proposals_update_seller
on public.collab_proposals for update
to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());

drop policy if exists collab_messages_select_participant on public.collab_messages;
create policy collab_messages_select_participant
on public.collab_messages for select
to authenticated
using (
  exists (
    select 1 from public.collab_proposals cp
    where cp.id = collab_id
      and (cp.seller_id = auth.uid() or cp.influencer_id = auth.uid())
  )
);

drop policy if exists collab_messages_insert_participant on public.collab_messages;
create policy collab_messages_insert_participant
on public.collab_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.collab_proposals cp
    where cp.id = collab_id
      and (cp.seller_id = auth.uid() or cp.influencer_id = auth.uid())
  )
);

drop policy if exists referral_clicks_insert_public on public.referral_clicks;
create policy referral_clicks_insert_public
on public.referral_clicks for insert
to anon, authenticated
with check (true);

drop policy if exists referral_clicks_select_own on public.referral_clicks;
create policy referral_clicks_select_own
on public.referral_clicks for select
to authenticated
using (influencer_id = auth.uid());

drop policy if exists referral_orders_select_own on public.referral_orders;
create policy referral_orders_select_own
on public.referral_orders for select
to authenticated
using (influencer_id = auth.uid());

revoke insert on public.referral_orders from authenticated, anon;

create or replace function public.place_order(
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_shipping_address jsonb,
  p_delivery_method text,
  p_payment_method text,
  p_payment_last5 text,
  p_shipping_total numeric,
  p_items jsonb,
  p_referral_code text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.orders;
  v_item jsonb;
  v_row public.order_items;
  v_product public.products;
  v_collab public.collab_proposals;
  v_qty integer;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_shipping numeric := coalesce(p_shipping_total, 0);
  v_commission numeric;
begin
  if v_actor is null then
    raise exception 'Authentication required to place an order';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  if p_delivery_method = 'express' then
    v_shipping := v_shipping + 120;
  end if;

  if p_referral_code is not null and length(trim(p_referral_code)) > 0 then
    select * into v_collab
    from public.collab_proposals
    where tracking_code = trim(p_referral_code)
      and status = 'accepted'
    limit 1;
  end if;

  insert into public.orders (
    buyer_id,
    buyer_name,
    buyer_email,
    buyer_phone,
    shipping_address,
    delivery_method,
    payment_method,
    payment_status,
    buyer_transaction_last5,
    shipping_total,
    subtotal,
    total_amount
  )
  values (
    v_actor,
    coalesce(nullif(trim(p_buyer_name), ''), 'Guest Buyer'),
    coalesce(nullif(trim(p_buyer_email), ''), 'buyer@local'),
    p_buyer_phone,
    coalesce(p_shipping_address, '{}'::jsonb),
    coalesce(p_delivery_method, 'standard'),
    coalesce(p_payment_method, 'upi'),
    case when coalesce(p_payment_method, 'upi') = 'upi' then 'pending_verification' else 'paid' end,
    p_payment_last5,
    v_shipping,
    0,
    0
  )
  returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item->>'quantity')::integer, 1);

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;

    if not found then
      raise exception 'Product not available';
    end if;

    if v_product.stock < v_qty then
      raise exception 'Insufficient stock for %', v_product.title;
    end if;

    v_line_total := v_product.price * v_qty;
    v_subtotal := v_subtotal + v_line_total;

    update public.products
    set stock = stock - v_qty,
        is_active = (stock - v_qty) > 0
    where id = v_product.id;

    insert into public.order_items (
      order_id,
      product_id,
      stall_id,
      title,
      price_at_purchase,
      quantity,
      image_url,
      status
    )
    values (
      v_order.id,
      v_product.id,
      v_product.stall_id,
      v_product.title,
      v_product.price,
      v_qty,
      v_item->>'image_url',
      'pending'
    )
    returning * into v_row;

    if v_collab.id is not null then
      v_commission := round(v_line_total * (v_collab.commission_pct / 100), 2);

      insert into public.referral_orders (
        collab_id,
        influencer_id,
        order_id,
        product_id,
        buyer_id,
        gmv,
        commission_amount,
        status
      )
      values (
        v_collab.id,
        v_collab.influencer_id,
        v_order.id,
        v_product.id,
        v_actor,
        v_line_total,
        v_commission,
        'placed'
      )
      on conflict (order_id, collab_id) do nothing;

      update public.collab_proposals
      set orders_count = orders_count + 1,
          revenue_generated = revenue_generated + v_line_total,
          updated_at = now()
      where id = v_collab.id;
    end if;
  end loop;

  update public.orders
  set subtotal = v_subtotal,
      total_amount = v_subtotal + v_shipping
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.set_order_item_status(
  p_order_id text,
  p_item_id uuid,
  p_status text,
  p_carrier text default null,
  p_tracking_number text default null
)
returns public.order_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_item public.order_items;
  v_is_buyer boolean;
  v_is_seller boolean;
  v_allowed boolean := false;
begin
  if v_actor is null then
    raise exception 'Authentication required';
  end if;

  select * into v_item from public.order_items where id = p_item_id and order_id = p_order_id for update;

  if not found then
    raise exception 'Order item not found';
  end if;

  v_is_buyer := public.is_order_buyer(p_order_id, v_actor);
  v_is_seller := public.is_order_seller(p_order_id, v_actor);

  if not (v_is_buyer or v_is_seller) then
    raise exception 'Not a participant in this order';
  end if;

  if p_status = 'delivered' then
    if not v_is_buyer then
      raise exception 'Only the buyer can confirm delivery';
    end if;
    v_allowed := v_item.status = 'out_for_delivery';
  elsif p_status = 'cancelled' then
    v_allowed := v_item.status in ('pending', 'ready_to_pack', 'shipped');
  else
    if not v_is_seller then
      raise exception 'Only the seller can update fulfilment status';
    end if;
    v_allowed := case
      when v_item.status = 'pending' and p_status = 'ready_to_pack' then true
      when v_item.status = 'ready_to_pack' and p_status = 'shipped' then true
      when v_item.status = 'shipped' and p_status = 'out_for_delivery' then true
      else false
    end;
  end if;

  if not v_allowed then
    raise exception 'Cannot move from % to %', v_item.status, p_status;
  end if;

  update public.order_items
  set status = p_status,
      carrier = coalesce(p_carrier, carrier),
      tracking_number = coalesce(p_tracking_number, tracking_number),
      shipped_at = case when p_status = 'shipped' then now() else shipped_at end,
      delivered_at = case when p_status = 'delivered' then now() else delivered_at end,
      updated_at = now()
  where id = p_item_id
  returning * into v_item;

  if p_status = 'delivered' then
    update public.referral_orders
    set status = 'delivered',
        delivered_at = now()
    where order_id = p_order_id and status = 'placed';
  end if;

  return v_item;
end;
$$;

create or replace function public.submit_order_payment(p_order_id text, p_last5 text)
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

  if not public.is_order_buyer(p_order_id, v_actor) then
    raise exception 'Only the buyer can submit payment proof';
  end if;

  update public.orders
  set payment_status = 'pending_verification',
      buyer_transaction_last5 = p_last5,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Order not found';
  end if;

  return v_order;
end;
$$;

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

  update public.orders
  set payment_status = 'confirmed',
      seller_confirmed_last5 = p_last5,
      payment_verified_at = now(),
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Order not found';
  end if;

  return v_order;
end;
$$;

create or replace function public.schedule_order_delivery(
  p_order_id text,
  p_carrier text,
  p_tracking_number text,
  p_date text
)
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
    raise exception 'Only the seller can schedule delivery';
  end if;

  update public.orders
  set carrier = p_carrier,
      tracking_number = p_tracking_number,
      delivery_scheduled_date = p_date,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Order not found';
  end if;

  return v_order;
end;
$$;

create or replace function public.report_order_dispute(p_order_id text, p_issue text)
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

  if not public.is_order_buyer(p_order_id, v_actor) then
    raise exception 'Only the buyer can report a dispute';
  end if;

  update public.orders
  set dispute_status = 'reported',
      dispute_issue = p_issue,
      dispute_created_at = now(),
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Order not found';
  end if;

  return v_order;
end;
$$;

create or replace function public.resolve_order_dispute(p_order_id text)
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
    raise exception 'Only the seller can resolve a dispute';
  end if;

  update public.orders
  set dispute_status = 'resolved',
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Order not found';
  end if;

  return v_order;
end;
$$;

revoke all on function public.place_order(text, text, text, jsonb, text, text, text, numeric, jsonb, text) from public;
revoke all on function public.set_order_item_status(text, uuid, text, text, text) from public;
revoke all on function public.submit_order_payment(text, text) from public;
revoke all on function public.verify_order_payment(text, text) from public;
revoke all on function public.schedule_order_delivery(text, text, text, text) from public;
revoke all on function public.report_order_dispute(text, text) from public;
revoke all on function public.resolve_order_dispute(text) from public;

grant execute on function public.place_order(text, text, text, jsonb, text, text, text, numeric, jsonb, text) to authenticated;
grant execute on function public.set_order_item_status(text, uuid, text, text, text) to authenticated;
grant execute on function public.submit_order_payment(text, text) to authenticated;
grant execute on function public.verify_order_payment(text, text) to authenticated;
grant execute on function public.schedule_order_delivery(text, text, text, text) to authenticated;
grant execute on function public.report_order_dispute(text, text) to authenticated;
grant execute on function public.resolve_order_dispute(text) to authenticated;
grant execute on function public.is_order_buyer(text, uuid) to authenticated;
grant execute on function public.is_order_seller(text, uuid) to authenticated;
