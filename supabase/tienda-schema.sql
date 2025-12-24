-- Create products table
CREATE TABLE IF NOT EXISTS tienda_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  full_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  specifications JSONB DEFAULT '[]',
  in_stock BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS tienda_ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on products category for faster filtering
CREATE INDEX IF NOT EXISTS idx_tienda_productos_category ON tienda_productos(category);
CREATE INDEX IF NOT EXISTS idx_tienda_productos_in_stock ON tienda_productos(in_stock);

-- Create index on orders status and date
CREATE INDEX IF NOT EXISTS idx_tienda_ordenes_status ON tienda_ordenes(status);
CREATE INDEX IF NOT EXISTS idx_tienda_ordenes_created_at ON tienda_ordenes(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_tienda_productos_updated_at
  BEFORE UPDATE ON tienda_productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tienda_ordenes_updated_at
  BEFORE UPDATE ON tienda_ordenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tienda_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tienda_ordenes ENABLE ROW LEVEL SECURITY;

-- Create policies for products (public read, allow all write operations)
-- Note: Since the app uses custom authentication, we allow all operations
-- In production, you might want to add additional checks based on your auth system
CREATE POLICY "Products are viewable by everyone"
  ON tienda_productos FOR SELECT
  USING (true);

CREATE POLICY "Products are insertable by everyone"
  ON tienda_productos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Products are updatable by everyone"
  ON tienda_productos FOR UPDATE
  USING (true);

CREATE POLICY "Products are deletable by everyone"
  ON tienda_productos FOR DELETE
  USING (true);

-- Create policies for orders (allow all operations)
CREATE POLICY "Orders are viewable by everyone"
  ON tienda_ordenes FOR SELECT
  USING (true);

CREATE POLICY "Orders are insertable by everyone"
  ON tienda_ordenes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Orders are updatable by everyone"
  ON tienda_ordenes FOR UPDATE
  USING (true);

