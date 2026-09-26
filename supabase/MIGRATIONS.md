# Supabase migrations

`supabase/schema.sql` and `supabase/seed.sql` are **deprecated and must not be applied.** Both files have been replaced with a notice explaining why; their original contents are still in git history (`git show 8ebe39f:supabase/schema.sql`). `schema.sql` describes an incompatible `profiles` shape and a pre-RPC order model, and because its `CREATE TABLE` statements are `IF NOT EXISTS`, running it against a partially provisioned database skips what already exists while still applying the rest — leaving the database matching neither file. `seed.sql` inserts fixed `auth.users` UUIDs that violate the `profiles` foreign key.

These migrations are the source of truth.

## How to apply

There is no Supabase CLI linked to this repo and no service-role key in `.env.local`, so these are applied manually:

1. Open the Supabase dashboard → **SQL Editor** → **New query**.
2. Paste one file, run it, confirm it succeeds.
3. Continue in order. Every statement is idempotent, so a re-run is safe.

Run them in this order — later files depend on tables created by earlier ones.

| Order | File | What it does |
| --- | --- | --- |
| 1 | `001_reconcile_catalog.sql` | Adds the `stalls`/`products` columns the app already reads and writes, the `products_catalog` view, `updated_at` triggers, catalog RLS, and the four-role check on `profiles`. |
| 2 | `002_data_model.sql` | Creates `orders`, `order_items`, `order_messages`, `artist_reviews`, `collab_proposals`, `collab_messages`, `referral_clicks`, `referral_orders` + RLS, and the order RPCs (`place_order`, `set_order_item_status`, `submit_order_payment`, `verify_order_payment`, `schedule_order_delivery`, `report_order_dispute`, `resolve_order_dispute`). |
| 3 | `003_notifications.sql` | Creates `notifications`, `notification_preferences`, `seller_subscriptions`, the `notify_recipient` helper, every event trigger, the `handle_new_user` trigger, and adds `notifications` to the `supabase_realtime` publication. |
| 4 | `004_analytics.sql` | Creates the `creator_funnel` view for the creator analytics dashboard. |
| 5 | `005_order_payment_fanout.sql` | Fix: fans payment-proof and dispute alerts out to **every** seller on a multi-stall order instead of only the first one. |
| 6 | `006_fix_lifecycle_gaps.sql` | Fixes found by the first automated E2E run: chat trigger referenced an undefined alias, UTR was never validated, `shipped`/`out_for_delivery` shared one notification type, and signup role was hardcoded to `buyer`. |
| 7 | `007_payment_prompt_and_shipped_type.sql` | Adds `order_shipped` to `notifications_type_check` (006 could not insert it) and reworks the payment prompt. |
| 8 | `008_payment_prompt_on_first_item.sql` | Moves the payment prompt to the `order_items` insert trigger — the first point at which the seller is resolvable. |

Migrations 6–8 are corrective. If you are applying to a project that never had
the bugs, run 1–5 and then only the last of 6–8 that you need; each corrective
file replaces functions in place and is safe to re-run.

## Verify after each step

After **001**:

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'products'
  and column_name in ('slug','category','b2b_moq_tiers','gem_specs','updated_at')
order by column_name;

select * from public.products_catalog limit 1;
```

Expect five rows and no error. The view must resolve even when `products` is empty.

After **002**:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('orders','order_items','order_messages','collab_proposals',
                     'collab_messages','referral_clicks','referral_orders')
order by table_name;

select proname from pg_proc
where proname in ('place_order','set_order_item_status','verify_order_payment')
order by proname;
```

Expect seven tables and three functions.

After **003**:

```sql
select count(*) from pg_publication_tables
where pubname = 'supabase_realtime' and tablename = 'notifications';

select tgname from pg_trigger
where tgrelid = 'public.notifications'::regclass
   or tgrelid = 'public.order_items'::regclass
order by tgname;

select public.notifications_enabled(auth.uid(), 'orders');
```

Expect `1` from the first query, the trigger list, and `true`/`false` from the last.

After **004**:

```sql
select * from public.creator_funnel;
```

Empty result set is correct when signed in as a user with no collaborations.

After **005**:

```sql
-- Confirm the fan-out trigger is installed (expect the trigger name back).
select tgname from pg_trigger
where tgrelid = 'public.orders'::regclass
  and tgname = 'on_order_update_notify';
```

After **008** (the corrective set as a whole):

```sql
-- Every trigger the order lifecycle depends on.
select tgname from pg_trigger
where tgrelid in ('public.orders'::regclass, 'public.order_items'::regclass,
                  'public.order_messages'::regclass)
  and not tgisinternal
order by tgname;

-- The type constraint must accept every type the app can emit.
select pg_get_constraintdef(oid) from pg_constraint
where conname = 'notifications_type_check';
```

Expect `on_order_item_insert_notify`, `on_order_item_status_notify`,
`on_order_message_insert_notify` and `on_order_update_notify`, and a
`notifications_type_check` listing that contains `order_shipped`.

> Triggers and constraints are **not** exposed over PostgREST, so these are the
> only checks that need the SQL Editor. Everything else is verified by the
> end-to-end script below.

## End-to-end verification

`npm run` has no test script; the order lifecycle is verified against the live
project by driving real orders through the public API:

```
node scripts/e2e-order-lifecycle.js
```

It provisions throwaway buyer, seller, and non-participant accounts, then asserts
49 checks: account creation, profile roles, catalog writes, server-side totals,
stock decrement, the full status pipeline, UTR validation, dedupe, chat in both
directions, and RLS isolation. Any regression in the trigger functions surfaces
here rather than in the UI.

Because it creates real rows, run it against a scratch project or clean up the
`e2e.*@proton.me` accounts afterwards. It leaves no test data in the catalog
beyond the stalls and products it creates.

## Design notes

- **`orders.id` is `text`**, generated as `TOT-00000123` from `order_number_seq`. The UI displays this value directly, so keeping it human-readable avoids a refactor while removing the `Math.random()` collision risk in checkout.
- **Notifications are per-recipient**, never per-role. `notifications` has no client `insert` policy; rows are only written by `SECURITY DEFINER` triggers, so a browser cannot forge an alert.
- **Idempotency** comes from `notifications_dedupe_uniq` on `(recipient_id, dedupe_key)`. Retry-safe triggers use `on conflict do nothing`.
- **`products_catalog`** is a `security_invoker` view joining `products` to `stalls`, which supplies `stall_name`/`stall_slug` without denormalising them onto `products`.
- **`is_order_buyer` / `is_order_seller`** are `SECURITY DEFINER` helpers used by RLS policies to avoid recursive policy evaluation.
- **Shipping total is client-supplied** because the cart applies a per-stall rule (₹75 flat, free over ₹1500) that lives in the cart store. `subtotal` is recomputed server-side from live `products.price`, so the authoritative pricing cannot be tampered with.
- **Fulfilment status is a strict pipeline**: `pending → ready_to_pack → shipped → out_for_delivery`, and only the buyer may move the last step to `delivered`. The dashboard therefore walks the chain step by step rather than jumping straight to `out_for_delivery`, which the database rejects.
- **One order can span several stalls**, so `orders`-level events (payment proof, disputes) fan out to every distinct seller via `select distinct s.user_id`. The dedupe key includes the seller id so each seller is alerted once per event even if they have several items in the order.

## Known limitations

- Product fan-out on insert is a single `insert ... select` over `seller_subscriptions`. Fine at current scale; switch to batching if a stall accumulates thousands of followers.
- `referral_clicks` allows anonymous inserts with no rate limit. Dedupe is enforced by `referral_clicks_first_visit_uniq`, but a determined actor could inflate clicks. Add edge rate limiting before relying on click counts for payouts.
- Slug indexes are intentionally non-unique so the migration cannot fail on existing duplicates. Enforce uniqueness after a dedupe pass.
