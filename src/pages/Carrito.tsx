import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const Carrito: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart();

  const handleQuantityChange = (productId: string | number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      toast.success('Producto eliminado del carrito');
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string | number, productName: string) => {
    removeFromCart(productId);
    toast.success(`${productName} eliminado del carrito`);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    // TODO: Implement checkout functionality
    toast.info('Funcionalidad de pago en desarrollo');
  };

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative text-white py-20 px-4 overflow-hidden" style={{ backgroundColor: '#db7f3a' }}>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Carrito de Compras
              </h1>
            </div>
          </div>
        </section>

        {/* Empty Cart */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-6 rounded-full" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                  <ShoppingCart size={64} style={{ color: '#db7f3a' }} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Tu carrito está vacío
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Agrega productos desde nuestra tienda para comenzar
              </p>
              <Link
                to="/tienda"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg"
                style={{ backgroundColor: '#db7f3a' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
              >
                <Package size={20} />
                Explorar Productos
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative text-white py-20 px-4 overflow-hidden" style={{ backgroundColor: '#db7f3a' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Carrito de Compras
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'} en tu carrito
            </p>
          </div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              to="/tienda"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-[#db7f3a] transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Continuar comprando</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row gap-6"
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.png';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                      <p className="text-lg font-bold" style={{ color: '#db7f3a' }}>
                        Q. {item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Cantidad:</span>
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition-colors rounded-l-lg"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              handleQuantityChange(item.id, value);
                            }}
                            className="w-16 text-center border-0 focus:outline-none focus:ring-0"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition-colors rounded-r-lg"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">Subtotal</p>
                        <p className="text-xl font-bold text-gray-900">
                          Q. {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id, item.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start sm:self-center"
                    aria-label="Remove item"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}

              {/* Clear Cart Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
                      clearCart();
                      toast.success('Carrito vaciado');
                    }
                  }}
                  className="text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen del Pedido</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
                    <span className="font-semibold">Q. {totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Envío</span>
                    <span className="font-semibold">Q. 0.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold" style={{ color: '#db7f3a' }}>
                        Q. {totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg mb-4"
                  style={{ backgroundColor: '#db7f3a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
                >
                  Proceder al Pago
                </button>

                <Link
                  to="/tienda"
                  className="block w-full text-center py-3 text-gray-700 hover:text-[#db7f3a] font-medium transition-colors"
                >
                  Continuar comprando
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Carrito;

