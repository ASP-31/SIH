create index if not exists referral_orders_order_id_idx on public.referral_orders (order_id);

drop view if exists public.creator_funnel;
create view public.creator_funnel
with (security_invoker = on)
as
select
  c.id as collab_id,
  c.influencer_id,
  c.tracking_code,
  c.tracking_url,
  c.product_title,
  c.product_image,
  c.commission_pct,
  c.status,
  c.created_at,
  (
    select count(*)
    from public.referral_clicks rc
    where rc.collab_id = c.id
  ) as clicks,
  (
    select count(distinct rc.visitor_id)
    from public.referral_clicks rc
    where rc.collab_id = c.id and rc.visitor_id is not null
  ) as unique_visitors,
  (
    select count(*)
    from public.referral_orders ro
    where ro.collab_id = c.id
  ) as orders_count,
  (
    select count(*)
    from public.referral_orders ro
    where ro.collab_id = c.id and ro.status = 'delivered'
  ) as delivered_orders,
  (
    select coalesce(sum(ro.gmv), 0)
    from public.referral_orders ro
    where ro.collab_id = c.id
  ) as gmv,
  (
    select coalesce(sum(ro.commission_amount), 0)
    from public.referral_orders ro
    where ro.collab_id = c.id
  ) as pending_commission,
  (
    select coalesce(sum(ro.commission_amount), 0)
    from public.referral_orders ro
    where ro.collab_id = c.id and ro.status = 'delivered'
  ) as confirmed_commission
from public.collab_proposals c
where c.influencer_id = auth.uid();

grant select on public.creator_funnel to authenticated;
