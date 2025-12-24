import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  price: number;
  images: string[];
  category: string;
  specifications: {
    label: string;
    value: string;
  }[];
  inStock: boolean;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export const useAdminTienda = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from Supabase
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tienda_productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        fullDescription: p.full_description || p.description,
        price: p.price,
        images: p.images || [],
        category: p.category,
        specifications: p.specifications || [],
        inStock: p.in_stock !== false,
        stock: p.stock || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error fetching products');
    }
  }, []);

  // Fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tienda_ordenes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: Order[] = (data || []).map((o: any) => ({
        id: o.id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        customerAddress: o.customer_address,
        items: o.items || [],
        total: o.total,
        status: o.status || 'pending',
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Error fetching orders');
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchOrders()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProducts, fetchOrders]);

  // Real-time subscriptions
  useEffect(() => {
    const productsSubscription = supabase
      .channel('tienda-productos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tienda_productos' }, () => {
        fetchProducts();
      })
      .subscribe();

    const ordersSubscription = supabase
      .channel('tienda-ordenes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tienda_ordenes' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      productsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  }, [fetchProducts, fetchOrders]);

  // Add product
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('tienda_productos')
        .insert({
          name: product.name,
          description: product.description,
          full_description: product.fullDescription,
          price: product.price,
          images: product.images,
          category: product.category,
          specifications: product.specifications,
          in_stock: product.inStock,
          stock: product.stock,
        })
        .select()
        .single();

      if (error) throw error;

      const newProduct: Product = {
        id: data.id,
        name: data.name,
        description: data.description,
        fullDescription: data.full_description || data.description,
        price: data.price,
        images: data.images || [],
        category: data.category,
        specifications: data.specifications || [],
        inStock: data.in_stock !== false,
        stock: data.stock || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      console.error('Error adding product:', err);
      throw err;
    }
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.fullDescription !== undefined) updateData.full_description = updates.fullDescription;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.images !== undefined) updateData.images = updates.images;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.specifications !== undefined) updateData.specifications = updates.specifications;
      if (updates.inStock !== undefined) updateData.in_stock = updates.inStock;
      if (updates.stock !== undefined) updateData.stock = updates.stock;

      const { data, error } = await supabase
        .from('tienda_productos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct: Product = {
        id: data.id,
        name: data.name,
        description: data.description,
        fullDescription: data.full_description || data.description,
        price: data.price,
        images: data.images || [],
        category: data.category,
        specifications: data.specifications || [],
        inStock: data.in_stock !== false,
        stock: data.stock || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tienda_productos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  // Update order status
  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      const { data, error } = await supabase
        .from('tienda_ordenes')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedOrder: Order = {
        id: data.id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        customerAddress: data.customer_address,
        items: data.items || [],
        total: data.total,
        status: data.status || 'pending',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
      return updatedOrder;
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  return {
    products,
    orders,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    refreshProducts: fetchProducts,
    refreshOrders: fetchOrders,
  };
};

