-- ATOMICITY & IDEMPOTENCY TEST SUITE 2026-09-25

-- 1. Setup Mock Subscriber
INSERT INTO subscribers (id, user_id, package_id, package_name, status, last_payment_id)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '1100kcal', 'Essential', 'active', 'initial_id')
ON CONFLICT (id) DO NOTHING;

-- 2. Simulate Concurrent Webhook (Worker A wins)
-- We simulate the update logic inside the function
UPDATE subscribers
SET status = 'active', last_payment_id = 'chg_concurrent_1'
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND last_payment_id != 'chg_concurrent_1' -- Atomic Fence
RETURNING id; -- Should return 1 row

-- 3. Simulate Concurrent Webhook (Worker B arrives a millisecond later)
UPDATE subscribers
SET status = 'active', last_payment_id = 'chg_concurrent_1'
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND last_payment_id != 'chg_concurrent_1' -- Atomic Fence
RETURNING id; -- Should return 0 rows (Collision Prevented)

-- 4. Verify No Duplicate Loyalty Points
-- (This relies on the 'accrue_points' function unique violation check)
SELECT public.accrue_points(
  '00000000-0000-0000-0000-000000000001',
  100,
  'Subscription Activation',
  'chg_concurrent_1'
); -- Returns true (first time)

SELECT public.accrue_points(
  '00000000-0000-0000-0000-000000000001',
  100,
  'Subscription Activation',
  'chg_concurrent_1'
); -- Returns false (collision prevented)
