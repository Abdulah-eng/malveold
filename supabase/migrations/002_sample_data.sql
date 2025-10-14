-- Note: seeding auth users via SQL is not supported in all projects.
-- This seed only inserts products for sellers whose profiles already exist.

-- Now insert sample products (only if no products exist)
INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440010'::uuid,
  'iPhone 15 Pro',
  'Latest iPhone with advanced camera system and A17 Pro chip',
  999.00,
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=300&fit=crop',
  'electronics',
  p.id,
  'TechStore Pro',
  10,
  4.8,
  156
FROM profiles p
WHERE p.email = 'techstore@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'iPhone 15 Pro');

INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440011'::uuid,
  'Nike Air Max 270',
  'Comfortable running shoes with Max Air cushioning',
  150.00,
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=300&fit=crop',
  'clothing',
  p.id,
  'Sports Central',
  25,
  4.6,
  89
FROM profiles p
WHERE p.email = 'sports@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Nike Air Max 270');

INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440012'::uuid,
  'Organic Coffee Beans',
  'Premium organic coffee beans from Colombia',
  24.99,
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=300&fit=crop',
  'food',
  p.id,
  'Coffee Corner',
  50,
  4.9,
  203
FROM profiles p
WHERE p.email = 'coffee@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Organic Coffee Beans');

INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440013'::uuid,
  'Wireless Bluetooth Headphones',
  'High-quality wireless headphones with noise cancellation',
  199.99,
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=300&fit=crop',
  'electronics',
  p.id,
  'TechStore Pro',
  15,
  4.7,
  127
FROM profiles p
WHERE p.email = 'techstore@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Wireless Bluetooth Headphones');

INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440014'::uuid,
  'Yoga Mat Premium',
  'Non-slip yoga mat with carrying strap',
  45.00,
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=300&fit=crop',
  'sports',
  p.id,
  'Fitness World',
  30,
  4.5,
  78
FROM profiles p
WHERE p.email = 'fitness@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Yoga Mat Premium');

INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440015'::uuid,
  'Smart Home Speaker',
  'Voice-controlled smart speaker with Alexa',
  79.99,
  'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&h=300&fit=crop',
  'electronics',
  p.id,
  'TechStore Pro',
  20,
  4.4,
  94
FROM profiles p
WHERE p.email = 'techstore@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Smart Home Speaker');

INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440016'::uuid,
  'Designer Handbag',
  'Luxury leather handbag with gold hardware',
  299.00,
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=300&fit=crop',
  'clothing',
  p.id,
  'Fashion Forward',
  8,
  4.9,
  45
FROM profiles p
WHERE p.email = 'fashion@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Designer Handbag');

INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440017'::uuid,
  'Garden Tool Set',
  'Complete set of professional gardening tools',
  89.99,
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=300&fit=crop',
  'home',
  p.id,
  'Garden Paradise',
  12,
  4.6,
  67
FROM profiles p
WHERE p.email = 'garden@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Garden Tool Set');

INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440018'::uuid,
  'Skincare Set',
  'Complete skincare routine with natural ingredients',
  65.00,
  'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500&h=300&fit=crop',
  'beauty',
  p.id,
  'Beauty Essentials',
  40,
  4.7,
  112
FROM profiles p
WHERE p.email = 'beauty@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Skincare Set');

INSERT INTO products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews)
SELECT 
  '550e8400-e29b-41d4-a716-446655440019'::uuid,
  'Programming Book',
  'Complete guide to modern web development',
  49.99,
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=300&fit=crop',
  'books',
  p.id,
  'Book Haven',
  35,
  4.8,
  89
FROM profiles p
WHERE p.email = 'books@example.com'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Programming Book');
