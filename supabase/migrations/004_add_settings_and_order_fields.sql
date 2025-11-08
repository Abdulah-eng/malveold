-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if they don't exist
INSERT INTO settings (key, value) VALUES
('buyer_tax_percentage', '8')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES
('driver_commission_percentage', '10')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES
('seller_tax_percentage', '5')
ON CONFLICT (key) DO NOTHING;

-- Add new settings for fixed driver commission and delivery charge
INSERT INTO settings (key, value) VALUES
('driver_commission_fixed', '5.00')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES
('delivery_charge', '5.99')
ON CONFLICT (key) DO NOTHING;

-- Add columns to orders table to store delivery charge and driver commission
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS driver_commission DECIMAL(10,2) DEFAULT 0;

-- Enable RLS for the settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for settings table (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'settings' 
    AND policyname = 'Admins can view settings'
  ) THEN
    CREATE POLICY "Admins can view settings" ON settings FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'settings' 
    AND policyname = 'Admins can update settings'
  ) THEN
    CREATE POLICY "Admins can update settings" ON settings FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

