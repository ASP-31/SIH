-- ============================================================================
-- SAAS D2C STOREFRONT BUILDER - REALISTIC SEED DATA (INDIA)
-- ============================================================================

-- Insert sample profiles
INSERT INTO public.profiles (id, full_name, phone, role)
VALUES
  ('11111111-1111-4111-a111-111111111111', 'Aarav Sharma', '+91 98765 43210', 'seller'),
  ('22222222-2222-4222-a222-222222222222', 'Meera Iyer', '+91 98123 45678', 'seller')
ON CONFLICT (id) DO NOTHING;

-- Insert sample stores
INSERT INTO public.stores (id, owner_id, store_name, slug, upi_id, upi_name, logo_url, banner_url, bio, is_suspended)
VALUES
  (
    '33333333-3333-4333-a333-333333333333',
    '11111111-1111-4111-a111-111111111111',
    'Kala & Co. Handcrafted Ceramics',
    'kala-ceramics',
    'kala.ceramics@okicici',
    'Kala Handcrafted Ceramics',
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1600&q=80',
    'Artisanal studio pottery crafted in Jaipur. Earth-friendly ceramics for mindful living. Direct UPI checkout, 0% platform fee.',
    FALSE
  ),
  (
    '44444444-4444-4444-a444-444444444444',
    '22222222-2222-4222-a222-222222222222',
    'Aura Chai & Spices',
    'aura-chai',
    'aurachai@okhdfcbank',
    'Aura Chai Spices India',
    'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1600&q=80',
    'Single-origin Assam masala tea blends & organic whole spices from Kerala estates. Freshly packed & shipped across India.',
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample products for Kala Ceramics
INSERT INTO public.products (id, store_id, title, description, price, stock_quantity, images, is_active)
VALUES
  (
    '55555555-5555-4555-a555-555555555501',
    '33333333-3333-4333-a333-333333333333',
    'Terracotta Chai Kulhad Set (Set of 4)',
    'Traditional unglazed clay tea cups handcrafted by Jaipur artisans. Naturally cools and imparts an earthy aroma to hot beverages.',
    499.00,
    24,
    ARRAY['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'],
    TRUE
  ),
  (
    '55555555-5555-4555-a555-555555555502',
    '33333333-3333-4333-a333-333333333333',
    'Speckled Sage Stoneware Matcha Bowl',
    'Wheel-thrown stoneware bowl with a satin sage reactive glaze. Lead-free, microwave safe, and ergonomic.',
    1250.00,
    8,
    ARRAY['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'],
    TRUE
  ),
  (
    '55555555-5555-4555-a555-555555555503',
    '33333333-3333-4333-a333-333333333333',
    'Minimalist Ocher Vase',
    'Contemporary sculptural floral vase with matte sandstone texture. Perfect center piece for modern Indian living rooms.',
    1890.00,
    5,
    ARRAY['https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80'],
    TRUE
  ),
  (
    '55555555-5555-4555-a555-555555555504',
    '33333333-3333-4333-a333-333333333333',
    'Indigo Spiral Ceramic Serving Platter',
    'Large hand-painted serving platter with cobalt blue brush strokes inspired by traditional Rajasthani indigo block print patterns.',
    1450.00,
    12,
    ARRAY['https://images.unsplash.com/photo-1530982011887-3cc11cc85693?auto=format&fit=crop&w=800&q=80'],
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample products for Aura Chai & Spices
INSERT INTO public.products (id, store_id, title, description, price, stock_quantity, images, is_active)
VALUES
  (
    '66666666-6666-4666-a666-666666666601',
    '44444444-4444-4444-a444-444444444444',
    'Royal Masala Chai Blend (250g)',
    'Premium CTC Assam tea blended with cardamom, dry ginger, cloves, cinnamon, and black pepper. Strong, aromatic, and invigorating.',
    450.00,
    50,
    ARRAY['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'],
    TRUE
  ),
  (
    '66666666-6666-4666-a666-666666666602',
    '44444444-4444-4444-a444-444444444444',
    'Alleppey Green Cardamom Pods (100g)',
    'Extra bold aromatic green cardamom sourced directly from Idukki spice hills in Kerala. Rich in essential oils.',
    580.00,
    35,
    ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'],
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample orders (in different verification states)
INSERT INTO public.orders (id, store_id, buyer_name, buyer_phone, buyer_address, buyer_upi_id, total_amount, utr_number, status, created_at)
VALUES
  (
    '77777777-7777-4777-a777-777777777701',
    '33333333-3333-4333-a333-333333333333',
    'Rohan Deshmukh',
    '+91 99887 76655',
    'Flat 4B, Shanti Heights, Bandra West, Mumbai 400050',
    'rohan@okaxis',
    1250.00,
    '321456789012',
    'utr_submitted',
    NOW() - INTERVAL '35 minutes'
  ),
  (
    '77777777-7777-4777-a777-777777777702',
    '33333333-3333-4333-a333-333333333333',
    'Priya Menon',
    '+91 98450 12345',
    '12/4, Koramangala 4th Block, Bengaluru 560034',
    'priya.menon@ybl',
    499.00,
    '319876543210',
    'verified_paid',
    NOW() - INTERVAL '4 hours'
  ),
  (
    '77777777-7777-4777-a777-777777777703',
    '33333333-3333-4333-a333-333333333333',
    'Aditya Verma',
    '+91 97111 22334',
    'House 18, Defence Colony, New Delhi 110024',
    'aditya@icici',
    1890.00,
    '318899001122',
    'shipped',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample order items
INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
VALUES
  ('77777777-7777-4777-a777-777777777701', '55555555-5555-4555-a555-555555555502', 1, 1250.00),
  ('77777777-7777-4777-a777-777777777702', '55555555-5555-4555-a555-555555555501', 1, 499.00),
  ('77777777-7777-4777-a777-777777777703', '55555555-5555-4555-a555-555555555503', 1, 1890.00)
ON CONFLICT DO NOTHING;

-- Insert sample verified buyer review
INSERT INTO public.reviews_reports (order_id, store_id, rating, comment, is_report)
VALUES
  (
    '77777777-7777-4777-a777-777777777702',
    '33333333-3333-4333-a333-333333333333',
    5,
    'Absolutely loved the Kulhad set! The clay quality is superb and packaging was shatter-proof. Direct UPI payment was smooth!',
    FALSE
  )
ON CONFLICT DO NOTHING;
