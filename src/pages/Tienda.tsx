import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, ArrowRight, X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useTienda, Product } from '@/hooks/useTienda';

// Extend Window interface for PayPal
declare global {
  interface Window {
    paypal?: any;
  }
}

const Tienda: React.FC = () => {
  const { addToCart } = useCart();
  const { products, loading, error } = useTienda();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const paypalButtonRef = useRef<HTMLDivElement>(null);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setQuantity(1);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSelectedImageIndex(0);
    setQuantity(1);
    // Clear PayPal button container
    if (paypalButtonRef.current) {
      paypalButtonRef.current.innerHTML = '';
    }
  };

  // Initialize PayPal button for rodenticida product
  useEffect(() => {
    if (selectedProduct && paypalButtonRef.current) {
      const isRodenticida = selectedProduct.name.toLowerCase().includes('rodenticida');
      
      if (isRodenticida) {
        // Clear previous button
        paypalButtonRef.current.innerHTML = '';
        
        // Wait for PayPal SDK to load
        const renderPayPalButton = () => {
          if (window.paypal && window.paypal.HostedButtons) {
            try {
              window.paypal.HostedButtons.render({
                hostedButtonId: "YOUR_HOSTED_BUTTON_ID", // TODO: Replace with your actual PayPal Hosted Button ID
                render: paypalButtonRef.current,
              }).catch((err: Error) => {
                console.error('Error rendering PayPal button:', err);
                toast.error('Error al cargar el botón de PayPal');
              });
            } catch (err) {
              console.error('Error initializing PayPal button:', err);
            }
          }
        };
        
        if (window.paypal && window.paypal.HostedButtons) {
          renderPayPalButton();
        } else {
          // Wait for PayPal SDK to load
          const checkPayPal = setInterval(() => {
            if (window.paypal && window.paypal.HostedButtons) {
              clearInterval(checkPayPal);
              renderPayPalButton();
            }
          }, 100);
          
          // Cleanup interval after 10 seconds
          setTimeout(() => {
            clearInterval(checkPayPal);
            if (!window.paypal) {
              console.warn('PayPal SDK did not load within 10 seconds');
            }
          }, 10000);
        }
      } else {
        // Clear button if not rodenticida
        if (paypalButtonRef.current) {
          paypalButtonRef.current.innerHTML = '';
        }
      }
    }
    
    return () => {
      if (paypalButtonRef.current) {
        paypalButtonRef.current.innerHTML = '';
      }
    };
  }, [selectedProduct]);

  const handleNextImage = () => {
    if (selectedProduct) {
      setSelectedImageIndex((prev) => 
        prev < selectedProduct.images.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handlePrevImage = () => {
    if (selectedProduct) {
      setSelectedImageIndex((prev) => 
        prev > 0 ? prev - 1 : selectedProduct.images.length - 1
      );
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      toast.error('Error', {
        description: 'No se ha seleccionado ningún producto.',
      });
      return;
    }

    if (!selectedProduct.inStock) {
      toast.error('Producto agotado', {
        description: 'Este producto no está disponible en este momento.',
      });
      return;
    }

    if (quantity <= 0) {
      toast.error('Cantidad inválida', {
        description: 'Por favor, selecciona una cantidad válida.',
      });
      return;
    }

    // Add to cart using context
    addToCart(
      {
        id: selectedProduct.id, // Use UUID string directly
        name: selectedProduct.name,
        description: selectedProduct.description,
        price: selectedProduct.price,
        image: selectedProduct.images[0] || '',
        category: selectedProduct.category,
      },
      quantity
    );
    
    const totalPrice = (selectedProduct.price * quantity).toFixed(2);
    const unitText = quantity === 1 ? 'unidad' : 'unidades';
    
    toast.success('Producto agregado al carrito', {
      description: `${quantity} ${unitText} de ${selectedProduct.name} - Total: Q. ${totalPrice}`,
      duration: 3000,
    });
    
    // Close modal after successful add
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative text-white py-20 px-4 overflow-hidden" style={{ backgroundColor: '#db7f3a' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Tienda FYSA
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Productos profesionales para control de plagas y fumigación
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Productos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Encuentra los mejores productos profesionales para el control de plagas
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#db7f3a] mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando productos...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-8">
              <p className="text-red-600">Error al cargar los productos. Por favor, intenta de nuevo más tarde.</p>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                onClick={() => handleProductClick(product)}
              >
                {/* Product Image */}
                <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.error-placeholder')) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'w-full h-full flex items-center justify-center error-placeholder';
                          placeholder.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={48} className="text-gray-400" />
                    </div>
                  )}
                  {product.inStock && (
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      En Stock
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', color: '#db7f3a' }}>
                      {product.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold" style={{ color: '#db7f3a' }}>
                      Q. {product.price.toFixed(2)}
                    </span>
                    <button
                      className="px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm"
                      style={{ backgroundColor: '#db7f3a', color: 'white' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                    >
                      <ShoppingCart size={16} />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20">
              <Package size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay productos disponibles</h3>
              <p className="text-gray-600">Vuelve pronto para ver nuestros productos.</p>
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden">
                    {selectedProduct.images && selectedProduct.images[selectedImageIndex] ? (
                      <img
                        src={selectedProduct.images[selectedImageIndex]}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.error-placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'w-full h-full flex items-center justify-center error-placeholder';
                            placeholder.innerHTML = '<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={64} className="text-gray-400" />
                      </div>
                    )}
                    
                    {/* Image Navigation */}
                    {selectedProduct.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                        >
                          <ChevronLeft size={24} className="text-gray-700" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                        >
                          <ChevronRight size={24} className="text-gray-700" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {selectedImageIndex + 1} / {selectedProduct.images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Gallery */}
                  {selectedProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative w-full h-20 bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                            index === selectedImageIndex
                              ? 'border-[#db7f3a]'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${selectedProduct.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  {/* Category and Stock Status */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', color: '#db7f3a' }}>
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.inStock && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-semibold">En Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <span className="text-4xl font-bold" style={{ color: '#db7f3a' }}>
                      Q. {selectedProduct.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                    <p className="text-gray-700 leading-relaxed text-justify">
                      {selectedProduct.fullDescription}
                    </p>
                  </div>

                  {/* Specifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Especificaciones</h3>
                    <div className="space-y-2">
                      {selectedProduct.specifications.map((spec, index) => (
                        <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">{spec.label}:</span>
                          <span className="text-gray-900 font-semibold">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantity and Add to Cart */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-semibold text-gray-700">Cantidad:</label>
                      <div className="flex items-center gap-2 border-2 border-gray-300 rounded-lg">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-2 hover:bg-gray-100 transition-colors"
                          style={{ color: '#db7f3a' }}
                        >
                          -
                        </button>
                        <span className="px-4 py-2 font-semibold text-gray-900 min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="px-3 py-2 hover:bg-gray-100 transition-colors"
                          style={{ color: '#db7f3a' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={!selectedProduct.inStock}
                      className="w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#db7f3a', color: 'white' }}
                      onMouseEnter={(e) => !selectedProduct.inStock || (e.currentTarget.style.backgroundColor = '#c46f2f')}
                      onMouseLeave={(e) => !selectedProduct.inStock || (e.currentTarget.style.backgroundColor = '#db7f3a')}
                    >
                      <ShoppingCart size={24} />
                      Agregar al Carrito
                    </button>

                    {/* PayPal Button for Rodenticida */}
                    {(selectedProduct.name.toLowerCase().includes('rodenticida') || 
                      selectedProduct.name.toLowerCase().includes('rodenticida')) && (
                      <div className="w-full">
                        <div ref={paypalButtonRef} className="w-full"></div>
                      </div>
                    )}

                    <Link
                      to="/contactanos"
                      className="block w-full py-3 rounded-xl font-semibold transition-all text-center border-2"
                      style={{ borderColor: '#db7f3a', color: '#db7f3a' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Consultar Disponibilidad
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tienda;
