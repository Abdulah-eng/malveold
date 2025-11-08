# Test Credentials

All test accounts use the password: **password123**

## ⚠️ Important: Creating Test Users

The test users need to be created using Supabase's Admin API to ensure proper authentication. 

**To create the test users, run:**
```bash
npm run create-test-users
```

This script will:
1. Delete any existing test users
2. Create 16 new test accounts (4 per role) using Supabase Admin API
3. Automatically create profiles for each user

**Note:** Make sure you have `SUPABASE_SERVICE_ROLE_KEY` set in your `.env.local` file.

## Buyers (4 accounts)
- **Email:** buyer1@test.com | **Password:** password123 | **Name:** Buyer One
- **Email:** buyer2@test.com | **Password:** password123 | **Name:** Buyer Two
- **Email:** buyer3@test.com | **Password:** password123 | **Name:** Buyer Three
- **Email:** buyer4@test.com | **Password:** password123 | **Name:** Buyer Four

## Sellers (4 accounts)
- **Email:** seller1@test.com | **Password:** password123 | **Name:** Seller One
- **Email:** seller2@test.com | **Password:** password123 | **Name:** Seller Two
- **Email:** seller3@test.com | **Password:** password123 | **Name:** Seller Three
- **Email:** seller4@test.com | **Password:** password123 | **Name:** Seller Four

## Drivers (4 accounts)
- **Email:** driver1@test.com | **Password:** password123 | **Name:** Driver One
- **Email:** driver2@test.com | **Password:** password123 | **Name:** Driver Two
- **Email:** driver3@test.com | **Password:** password123 | **Name:** Driver Three
- **Email:** driver4@test.com | **Password:** password123 | **Name:** Driver Four

## Admins (4 accounts)
- **Email:** admin1@test.com | **Password:** password123 | **Name:** Admin One
- **Email:** admin2@test.com | **Password:** password123 | **Name:** Admin Two
- **Email:** admin3@test.com | **Password:** password123 | **Name:** Admin Three
- **Email:** admin4@test.com | **Password:** password123 | **Name:** Admin Four

---

## Quick Reference Table

| Role | Email | Password |
|------|-------|----------|
| Buyer | buyer1@test.com | password123 |
| Buyer | buyer2@test.com | password123 |
| Buyer | buyer3@test.com | password123 |
| Buyer | buyer4@test.com | password123 |
| Seller | seller1@test.com | password123 |
| Seller | seller2@test.com | password123 |
| Seller | seller3@test.com | password123 |
| Seller | seller4@test.com | password123 |
| Driver | driver1@test.com | password123 |
| Driver | driver2@test.com | password123 |
| Driver | driver3@test.com | password123 |
| Driver | driver4@test.com | password123 |
| Admin | admin1@test.com | password123 |
| Admin | admin2@test.com | password123 |
| Admin | admin3@test.com | password123 |
| Admin | admin4@test.com | password123 |

---

## Testing Workflow

1. **As a Buyer:**
   - Login with any buyer account
   - Browse products
   - Add items to cart
   - Place orders
   - Track order progress

2. **As a Seller:**
   - Login with any seller account
   - Add products to your store
   - View and manage orders
   - Update order status (pending → confirmed → preparing → ready)
   - Track order progress

3. **As a Driver:**
   - Login with any driver account
   - View available orders (status: ready)
   - Accept orders
   - Update delivery status (ready → picked_up → delivered)
   - Track delivery progress

4. **As an Admin:**
   - Login with any admin account
   - View dashboard overview
   - Manage users (change roles, delete users)
   - Manage orders (view details, update status)
   - Manage products (view all, delete products)
   - Search and filter across all sections

---

**Note:** All accounts are ready to use. The profiles were automatically created when the users were added to the database.

