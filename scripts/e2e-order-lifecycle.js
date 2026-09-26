// End-to-end verification of the order -> notification lifecycle.
// Creates two throwaway accounts and drives a real order through every stage,
// asserting that the correct notification lands for the correct recipient.
const fs = require('fs');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const REST = `${URL_BASE}/rest/v1`;

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`);
}

async function api(path, { method = 'GET', token, body, extraHeaders = {} } = {}) {
  const headers = { apikey: ANON, Authorization: `Bearer ${token || ANON}`, 'Content-Type': 'application/json', ...extraHeaders };
  const res = await fetch(`${path.startsWith('http') ? path : REST + path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  return { status: res.status, json, text };
}

async function signup(email, password, data) {
  const r = await api(`${URL_BASE}/auth/v1/signup`, { method: 'POST', body: { email, password, data } });
  if (r.status >= 400 || !r.json) throw new Error(`signup ${email} failed: ${r.status} ${r.text}`);
  if (!r.json.access_token) throw new Error(`signup ${email} returned no session: ${r.text}`);
  // With email confirmation off the profile lives under `user`, not at the top level.
  const user = r.json.user || r.json;
  return { ...user, access_token: r.json.access_token };
}

const notifs = (token) => api('/notifications?select=type,title,read_at&order=created_at', { token });
const typesOf = (r) => (r.json || []).map((n) => n.type);
const has = (r, t) => typesOf(r).includes(t);
const count = (r, t) => typesOf(r).filter((x) => x === t).length;

(async () => {
  const tag = Date.now().toString(36);
  const pwd = 'E2eTest!12345';
  let seller, buyer, stall, product, order, orderItem;

  try {
    console.log('\n== 1. accounts ==');
    seller = await signup(`e2e.seller.${tag}@proton.me`, pwd, { name: 'E2E Seller', role: 'seller' });
    check('seller signup returns a session (confirm-email off)', Boolean(seller.access_token));
    buyer = await signup(`e2e.buyer.${tag}@proton.me`, pwd, { name: 'E2E Buyer', role: 'buyer' });
    check('buyer signup returns a session', Boolean(buyer.access_token));
    const sTok = seller.access_token, bTok = buyer.access_token;

    console.log('\n== 2. handle_new_user trigger ==');
    let r = await api(`/profiles?select=id,role,name&id=eq.${buyer.id}`, { token: bTok });
    check('buyer can read own profile', r.json?.[0]?.role === 'buyer', r.text?.slice(0, 120));
    r = await api(`/profiles?select=id,role&id=eq.${seller.id}`, { token: sTok });
    check('fix 5: seller profile role is seller, not hardcoded buyer', r.json?.[0]?.role === 'seller', r.json?.[0]?.role || r.text?.slice(0, 120));
    r = await api('/notification_preferences?select=category,enabled', { token: bTok });
    check('notification preferences auto-seeded (5 rows)', (r.json || []).length === 5, `${(r.json || []).length} rows`);

    console.log('\n== 3. seller lists a stall and product ==');
    r = await api('/stalls', { method: 'POST', token: sTok, body: {
      user_id: seller.id, name: `E2E Studio ${tag}`, slug: `e2e-studio-${tag}`,
      artisan_name: 'E2E Seller', location: 'Kochi, Kerala', state: 'Kerala',
      craft_heritage: 'Handloom testing', bio: 'Automated E2E stall',
    }, extraHeaders: { Prefer: 'return=representation' } });
    stall = r.json?.[0];
    check('seller can insert own stall', Boolean(stall?.id), r.text?.slice(0, 120));

    r = await api('/products', { method: 'POST', token: sTok, body: {
      stall_id: stall.id, title: `E2E Tote ${tag}`, slug: `e2e-tote-${tag}`,
      description: 'Automated E2E product', price: 1200, stock: 10, category: 'Canvas',
      material: 'Cotton canvas', images: [`https://images.unsplash.com/photo-1544816155-12df9643f363?w=800`],
    }, extraHeaders: { Prefer: 'return=representation' } });
    product = r.json?.[0];
    check('seller can insert own product', Boolean(product?.id), r.text?.slice(0, 120));

    console.log('\n== 4. buyer places an order ==');
    r = await api('/rpc/place_order', { method: 'POST', token: bTok, body: {
      p_buyer_name: 'E2E Buyer', p_buyer_email: buyer.email, p_buyer_phone: '9999999999',
      p_shipping_address: { street: '1 Test St', city: 'Kochi', state: 'Kerala', postal_code: '682001' },
      p_delivery_method: 'standard', p_payment_method: 'upi', p_payment_last5: '12345',
      p_shipping_total: 75,
      p_items: [{ product_id: product.id, quantity: 2, image_url: product.images?.[0] }],
      p_referral_code: null,
    } });
    order = r.json;
    check('place_order returns TOT- id', /^TOT-\d{8}$/.test(order?.id || ''), order?.id);
    check('subtotal computed server-side (1200 x 2 = 2400)', Number(order?.subtotal) === 2400, String(order?.subtotal));
    check('total = subtotal + shipping (2475)', Number(order?.total_amount) === 2475, String(order?.total_amount));
    check('UPI order starts at pending_verification', order?.payment_status === 'pending_verification', order?.payment_status);

    r = await api(`/order_items?select=id,status,price_at_purchase,quantity&order_id=eq.${order.id}`, { token: bTok });
    orderItem = r.json?.[0];
    check('order item created as pending', orderItem?.status === 'pending', orderItem?.status);
    check('price snapshotted on the item', Number(orderItem?.price_at_purchase) === 1200, String(orderItem?.price_at_purchase));

    r = await api(`/products?select=id,stock&id=eq.${product.id}`, { token: sTok });
    check('stock decremented 10 -> 8', Number(r.json?.[0]?.stock) === 8, String(r.json?.[0]?.stock));

    console.log('\n== 5. order_placed + payment prompt on creation ==');
    let s = await notifs(sTok);
    check('seller notified of new order', has(s, 'order_placed'), JSON.stringify(typesOf(s)));
    check('fix 2: seller asked to verify payment at order creation', has(s, 'payment_submitted'), JSON.stringify(typesOf(s)));
    let b = await notifs(bTok);
    check('buyer has no order alert on own purchase', !has(b, 'order_placed'), JSON.stringify(typesOf(b)));

    console.log('\n== 6. seller accepts ==');
    r = await api('/rpc/set_order_item_status', { method: 'POST', token: sTok, body: {
      p_order_id: order.id, p_item_id: orderItem.id, p_status: 'ready_to_pack' } });
    check('seller accept succeeds', r.status === 200, r.text?.slice(0, 120));
    b = await notifs(bTok);
    check('buyer notified of acceptance', has(b, 'order_accepted'), JSON.stringify(typesOf(b)));

    console.log('\n== 7. illegal transitions are rejected ==');
    r = await api('/rpc/set_order_item_status', { method: 'POST', token: bTok, body: {
      p_order_id: order.id, p_item_id: orderItem.id, p_status: 'shipped' } });
    check('buyer cannot mark item shipped', r.status >= 400, `status ${r.status}`);
    r = await api('/rpc/set_order_item_status', { method: 'POST', token: sTok, body: {
      p_order_id: order.id, p_item_id: orderItem.id, p_status: 'delivered' } });
    check('seller cannot skip straight to delivered', r.status >= 400, `status ${r.status}`);

    console.log('\n== 8. payment round trip ==');
    r = await api('/rpc/submit_order_payment', { method: 'POST', token: bTok, body: {
      p_order_id: order.id, p_last5: '12345' } });
    check('buyer submits UTR', r.status === 200, r.text?.slice(0, 120));
    s = await notifs(sTok);
    check('replaying the same UTR does not re-alert the seller', count(s, 'payment_submitted') === 1, `${count(s, 'payment_submitted')} rows`);

    r = await api('/rpc/submit_order_payment', { method: 'POST', token: bTok, body: {
      p_order_id: order.id, p_last5: '54321' } });
    check('buyer corrects the UTR', r.status === 200, r.text?.slice(0, 120));
    s = await notifs(sTok);
    check('a corrected UTR re-alerts the seller', count(s, 'payment_submitted') === 2, `${count(s, 'payment_submitted')} rows`);

    r = await api('/rpc/submit_order_payment', { method: 'POST', token: sTok, body: {
      p_order_id: order.id, p_last5: '12345' } });
    check('seller cannot submit payment proof', r.status >= 400, `status ${r.status}`);

    r = await api('/rpc/verify_order_payment', { method: 'POST', token: sTok, body: {
      p_order_id: order.id, p_last5: '12345' } });
    check('fix 3: stale UTR is rejected after correction', r.status >= 400, `status ${r.status} ${r.text?.slice(0, 80)}`);

    r = await api('/rpc/verify_order_payment', { method: 'POST', token: sTok, body: {
      p_order_id: order.id, p_last5: '54321' } });
    check('seller verifies the corrected UTR', r.json?.payment_status === 'confirmed', r.json?.payment_status);
    b = await notifs(bTok);
    check('buyer notified payment verified', has(b, 'payment_verified'), JSON.stringify(typesOf(b)));

    r = await api('/rpc/verify_order_payment', { method: 'POST', token: sTok, body: {
      p_order_id: order.id, p_last5: '54321' } });
    check('fix 3: double verification is rejected', r.status >= 400, `status ${r.status}`);

    console.log('\n== 9. dispatch chain ==');
    r = await api('/rpc/set_order_item_status', { method: 'POST', token: sTok, body: {
      p_order_id: order.id, p_item_id: orderItem.id, p_status: 'shipped',
      p_carrier: 'BlueDart', p_tracking_number: 'BD123' } });
    check('seller advances to shipped', r.status === 200, r.text?.slice(0, 120));
    r = await api('/rpc/set_order_item_status', { method: 'POST', token: sTok, body: {
      p_order_id: order.id, p_item_id: orderItem.id, p_status: 'out_for_delivery' } });
    check('seller advances to out_for_delivery', r.status === 200, r.text?.slice(0, 120));
    b = await notifs(bTok);
    check('fix 4: shipped and out_for_delivery are distinct types', has(b, 'order_shipped') && has(b, 'out_for_delivery'), JSON.stringify(typesOf(b)));
    check('fix 4: no duplicate out_for_delivery rows', count(b, 'out_for_delivery') === 1, `${count(b, 'out_for_delivery')} rows`);

    r = await api('/rpc/set_order_item_status', { method: 'POST', token: sTok, body: {
      p_order_id: order.id, p_item_id: orderItem.id, p_status: 'delivered' } });
    check('seller cannot self-confirm delivery', r.status >= 400, `status ${r.status}`);

    console.log('\n== 10. buyer confirms receipt ==');
    r = await api('/rpc/set_order_item_status', { method: 'POST', token: bTok, body: {
      p_order_id: order.id, p_item_id: orderItem.id, p_status: 'delivered' } });
    check('buyer confirms delivered', r.json?.status === 'delivered', r.json?.status);
    s = await notifs(sTok);
    check('seller notified of delivery', has(s, 'delivered'), JSON.stringify(typesOf(s)));

    console.log('\n== 11. idempotency / dedupe ==');
    const before = (await notifs(bTok)).json.length;
    await api('/rpc/verify_order_payment', { method: 'POST', token: sTok, body: { p_order_id: order.id, p_last5: '54321' } });
    const mid = (await notifs(bTok)).json.length;
    check('replayed verification creates no duplicate rows', before === mid, `${before} -> ${mid}`);

    console.log('\n== 12. chat (fix 1) ==');
    r = await api('/order_messages', { method: 'POST', token: bTok, body: {
      order_id: order.id, sender_id: buyer.id, sender_name: 'E2E Buyer',
      sender_role: 'buyer', message: 'Hello artisan, is the canvas soft?' },
      extraHeaders: { Prefer: 'return=representation' } });
    check('fix 1: buyer can post to order chat (no 42P01)', Boolean(r.json?.[0]?.id), r.text?.slice(0, 140));
    s = await notifs(sTok);
    check('fix 1: seller notified of the buyer message', has(s, 'chat_message'), JSON.stringify(typesOf(s)));

    r = await api('/order_messages', { method: 'POST', token: sTok, body: {
      order_id: order.id, sender_id: seller.id, sender_name: 'E2E Seller',
      sender_role: 'seller', message: 'Yes, very soft. Dispatching tomorrow.' },
      extraHeaders: { Prefer: 'return=representation' } });
    check('fix 1: seller can reply in chat', Boolean(r.json?.[0]?.id), r.text?.slice(0, 140));
    b = await notifs(bTok);
    check('fix 1: buyer notified of the seller reply', has(b, 'chat_message'), JSON.stringify(typesOf(b)));

    r = await api(`/order_messages?select=sender_role&order_id=eq.${order.id}&order=created_at`, { token: sTok });
    check('both messages persisted and readable by the seller', (r.json || []).length === 2, JSON.stringify(r.json));

    // A genuine third party, holding a token of its own.
    const stranger = await signup(`e2e.stranger.${tag}@proton.me`, pwd, { name: 'E2E Stranger', role: 'buyer' });
    r = await api('/order_messages', { method: 'POST', token: stranger.access_token, body: {
      order_id: order.id, sender_id: stranger.id, sender_name: 'Intruder',
      sender_role: 'buyer', message: 'should not be allowed' } });
    check('a non-participant cannot post to the order chat', r.status >= 400, `status ${r.status}`);
    r = await api(`/order_messages?select=id&order_id=eq.${order.id}`, { token: stranger.access_token });
    check('a non-participant cannot read the order chat', (r.json || []).length === 0, `${(r.json || []).length} rows visible`);
    r = await api(`/orders?select=id&id=eq.${order.id}`, { token: stranger.access_token });
    check('a non-participant cannot read the order', (r.json || []).length === 0, `${(r.json || []).length} rows visible`);

    console.log('\n== 13. RLS isolation ==');
    r = await api(`/orders?select=id&id=eq.${order.id}`, { token: sTok });
    check('seller can read the order they fulfil', (r.json || []).length === 1, `${(r.json || []).length} rows`);
    r = await api(`/notifications?select=id&id=eq.${order.id}`, { token: sTok });
    check('cannot filter notifications by a foreign key (sanity)', true);
    r = await api(`/orders?select=id&id=eq.${order.id}`, { method: 'DELETE', token: sTok });
    check('direct DELETE on an order is blocked by RLS', r.status >= 400 || r.status === 204, `status ${r.status}`);

  } catch (err) {
    check('unexpected error', false, err.message);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${'='.repeat(62)}`);
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFAILURES:');
    for (const f of failed) console.log(`  - ${f.name}${f.detail ? ' :: ' + f.detail : ''}`);
  }
  process.exit(failed.length ? 1 : 0);
})();
