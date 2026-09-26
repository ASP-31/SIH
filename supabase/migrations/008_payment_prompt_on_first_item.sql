  -- 008_payment_prompt_on_first_item.sql
  --
  -- Fix: the payment prompt still did not reach sellers.
  --
  -- 007 added an AFTER INSERT trigger on public.orders, but place_order() inserts
  -- the order row BEFORE any order_items exist. The trigger resolves recipients
  -- via `order_items join stalls`, so on a freshly inserted order that join
  -- matched zero rows and the function returned having sent nothing. It could
  -- never fire for the real checkout flow.
  --
  -- The order_items insert trigger is the first point at which the seller is
  -- actually resolvable, so the prompt belongs there. It fires once per item;
  -- the dedupe key collapses a multi-item order down to one alert per seller.
  --
  -- Also drops the ineffective orders INSERT trigger rather than leaving dead
  -- code that looks like it works.
  --
  -- Safe to re-run: functions and triggers are replaced in place.

  drop trigger if exists on_order_insert_notify on public.orders;

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
    v_payment_status text;
    v_last5 text;
  begin
    select s.user_id, s.name into v_seller, v_stall_name
    from public.stalls s where s.id = new.stall_id;

    select o.buyer_id, o.buyer_name, o.payment_status, o.buyer_transaction_last5
      into v_buyer_id, v_buyer_name, v_payment_status, v_last5
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

    -- A UPI order arrives with payment proof attached, so prompt the seller to
    -- verify straight away. Same dedupe key as trg_order_notify_payment() so a
    -- proof submitted later cannot double up on the initial alert.
    if v_payment_status = 'pending_verification' and coalesce(v_last5, '') <> '' then
      perform public.notify_recipient(
        v_seller,
        v_buyer_id,
        'payment_submitted',
        'orders',
        'Payment verification needed',
        format('%s submitted payment proof (UTR ...%s). Verify it in your UPI app.', coalesce(v_buyer_name, 'A buyer'), v_last5),
        '/dashboard?tab=orders&order=' || new.order_id,
        jsonb_build_object('order_id', new.order_id, 'buyer_name', v_buyer_name, 'last5', v_last5),
        'payment_submitted:' || new.order_id || ':' || v_seller::text || ':' || v_last5
      );
    end if;

    return new;
  end;
  $$;

  drop trigger if exists on_order_item_insert_notify on public.order_items;
  create trigger on_order_item_insert_notify
  after insert on public.order_items
  for each row execute function public.trg_order_item_notify_seller();
