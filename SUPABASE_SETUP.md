# Supabase Integration Setup Guide

This guide will help you set up Supabase for your DeliverEase project.

## Prerequisites

1. Node.js (v18 or higher)
2. A Supabase account (sign up at https://supabase.com)

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `malves-example` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Project API Keys** > **anon public** key
   - **Project API Keys** > **service_role** key (keep this secret!)

## Step 3: Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 4: Set Up the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run** to execute the schema creation
4. Copy and paste the contents of `supabase/migrations/002_sample_data.sql`
5. Click **Run** to insert sample data (this now creates auth users first and relies on the trigger to create matching profiles)

## Step 5: Configure Authentication

1. In your Supabase project dashboard, go to **Authentication** > **Settings**
2. Under **Site URL**, add: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000/**`
4. Under **Email**, configure your email settings:
   - **Enable email confirmations**: Toggle ON if you want email verification
   - **Enable email change confirmations**: Toggle ON
5. Save the settings

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and go to `http://localhost:3000`

3. Test the following features:
   - **Registration**: Try creating a new account
   - **Login**: Sign in with your credentials
   - **Browse Products**: View the product catalog
   - **Add to Cart**: Add items to your cart
   - **Checkout**: Place an order
   - **View Orders**: Check your order history

## Step 7: Verify Database Data

1. In your Supabase project dashboard, go to **Table Editor**
2. Check that the following tables were created:
   - `profiles`
   - `products`
   - `cart_items`
   - `orders`
   - `order_items`

3. Verify that sample data was inserted in the `products` table

## Features Implemented

### Authentication
- ✅ User registration with role selection (buyer/seller/driver)
- ✅ User login/logout
- ✅ Email verification (configurable)
- ✅ Password reset functionality
- ✅ Row Level Security (RLS) policies

### Database Schema
- ✅ **profiles** table: User profiles with roles
- ✅ **products** table: Product catalog
- ✅ **cart_items** table: Shopping cart functionality
- ✅ **orders** table: Order management
- ✅ **order_items** table: Order line items

### Application Features
- ✅ Product browsing and search
- ✅ Shopping cart management
- ✅ Order placement and tracking
- ✅ User profile management
- ✅ Real-time data synchronization

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: Secure user authentication via Supabase Auth
- **Data Validation**: Server-side validation for all operations
- **API Security**: Protected API endpoints with proper permissions

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that your environment variables are correctly set
   - Ensure there are no extra spaces in your `.env.local` file

2. **"User not authenticated" error**
   - Make sure the user is logged in
   - Check that the authentication context is properly set up

3. **Database connection issues**
   - Verify your Supabase project is active
   - Check that the database schema was created correctly

4. **CORS errors**
   - Add your domain to the allowed origins in Supabase settings
   - Check that your site URL is correctly configured

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
- Review the project's GitHub issues

## Next Steps

1. **Deploy to Production**: Set up production environment variables
2. **Add Payment Integration**: Integrate with Stripe or similar
3. **Add Real-time Features**: Implement live order tracking
4. **Add Push Notifications**: Notify users of order updates
5. **Add Analytics**: Track user behavior and sales metrics

## Environment Variables Reference

```env
# Required for Supabase integration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: For production deployment
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

You can copy these into a new file named `.env.local` in `malveold/`.

## Database Schema Overview

```sql
-- Core tables
profiles (id, name, email, role, avatar, phone, address, created_at, updated_at)
products (id, name, description, price, image, category, seller_id, seller_name, stock, rating, reviews, created_at, updated_at)
cart_items (id, user_id, product_id, quantity, created_at, updated_at)
orders (id, buyer_id, seller_id, driver_id, total, status, delivery_address, estimated_delivery, driver_location, created_at, updated_at)
order_items (id, order_id, product_id, quantity, price, created_at)
```

This integration provides a complete, production-ready e-commerce platform with authentication, database management, and order processing capabilities.
