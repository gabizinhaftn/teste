import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { collection, query, onSnapshot, where, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Product, CartItem, Order } from '@/src/types';
import Navbar from '@/src/components/Navbar';
import ProductCard from '@/src/components/ProductCard';
import ProductDetailsModal from '@/src/components/ProductDetailsModal';
import Cart from '@/src/components/Cart';
import PixModal from '@/src/components/PixModal';
import AuthModal from '@/src/components/AuthModal';
import { Instagram, Music2, MessageCircle, MapPin, Search, Filter, Lock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface HomeProps {
  user: User | null;
  cart: CartItem[];
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
}

export default function Home({ user, cart, setCart }: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSection, setActiveSection] = useState<'home' | 'orders'>('home');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [sortBy, setSortBy] = useState<'recommended' | 'cheapest' | 'expensive'>('recommended');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [showAdminLock, setShowAdminLock] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setShowAdminLock(true);
      setClickCount(0);
    }
    setActiveSection('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync Products
  useEffect(() => {
    const q = query(collection(db, "produtos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
    });
    return () => unsubscribe();
  }, []);

  // Sync Orders - Fixed the query to properly match user ID
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    // Note: Ensuring the field name matches what's saved (userId)
    const q = query(
      collection(db, "pedidos"), 
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Manual sorting in client side to avoid index requirement for all queries
      data.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setOrders(data);
    });
    return () => unsubscribe();
  }, [user]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      }
      return [...prev, { ...product, quantidade: 1 }];
    });
    showToast(`${product.nome} na sacola!`);
    if (!cartOpen) setCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQtd = item.quantidade + delta;
        return newQtd > 0 ? { ...item, quantidade: newQtd } : item;
      }
      return item;
    }).filter(item => item.quantidade > 0));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    showToast("Item removido", "error");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast("Sua sacola está vazia!", "error");
    if (!user) {
      setAuthOpen(true);
      return showToast("Faça login para concluir", "error");
    }
    
    try {
      showToast("Preparando pedido...", "success");
      
      const orderId = `#${Math.floor(Math.random() * 10000)}`;
      const totalVenda = cart.reduce((acc, p) => acc + (parseFloat(String(p.preco || 0)) * p.quantidade), 0);
      const itensNomes = cart.map(p => `${p.quantidade}x ${p.nome}`).join(', ');

      // SE FOR PIX: Tenta primeiro gerar o QR interno
      if (paymentMethod === 'pix') {
        try {
          const response = await axios.post('/api/create-payment-pix', {
            items: cart,
            userEmail: user.email
          });

          if (response.data && response.data.qr_code_base64) {
            setPixData(response.data);
            setCartOpen(false); 

            const dadosPedido: Partial<Order> = {
              idPedido: orderId,
              userId: user.uid,
              cliente: user.displayName || user.email || 'Cliente Site',
              itens: itensNomes,
              quantidadeTotal: cart.reduce((acc, p) => acc + p.quantidade, 0),
              valorTotal: totalVenda.toFixed(2),
              pagamento: "PENDENTE",
              logistica: "AGUARDANDO PAGAMENTO (PIX)",
              data: new Date().toLocaleDateString('pt-BR'),
              timestamp: serverTimestamp()
            };

            await addDoc(collection(db, "pedidos"), dadosPedido);
            setCart([]);
            showToast("PIX gerado! Pague agora.", "success");
            return; // Encerra aqui se o PIX interno funcionou
          }
        } catch (apiErr) {
          console.log("PIX direto falhou, usando redirecionamento seguro...");
        }
      }

      // REDIRECIONAMENTO (Para Cartão OU Fallback de PIX) via Backend Seguro
      const mpResponse = await axios.post('/api/create-preference', {
        items: cart,
        external_reference: orderId
      });

      const { init_point } = mpResponse.data;

      const dadosPedido: Partial<Order> = {
        idPedido: orderId,
        userId: user?.uid || 'anonimo',
        cliente: user?.displayName || user?.email || 'Cliente Site',
        itens: itensNomes,
        quantidadeTotal: cart.reduce((acc, p) => acc + p.quantidade, 0),
        valorTotal: totalVenda.toFixed(2),
        pagamento: "AGUARDANDO",
        logistica: `REDIRECIONADO MP (${paymentMethod.toUpperCase()})`,
        data: new Date().toLocaleDateString('pt-BR'),
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, "pedidos"), dadosPedido);
      
      setCart([]);
      setCartOpen(false);
      showToast("Redirecionando para pagamento seguro...");
      window.location.href = init_point;

    } catch (err: any) {
      console.error("Erro no checkout:", err.response?.data || err.message);
      showToast("Erro ao processar checkout. Tente no WhatsApp!", "error");
      
      // Fallback final: WhatsApp
      setTimeout(() => {
        const orderId = `#${Math.floor(Math.random() * 10000)}`;
        const totalVenda = cart.reduce((acc, p) => acc + (parseFloat(String(p.preco || 0)) * p.quantidade), 0);
        const itensNomes = cart.map(p => `${p.quantidade}x ${p.nome}`).join(', ');
        const msg = window.encodeURIComponent(`Olá! Tive erro no checkout. Gostaria de pagar via ${paymentMethod.toUpperCase()}.\nPedido: ${orderId}\nTotal: R$ ${totalVenda.toFixed(2)}\nItens: ${itensNomes}`);
        window.location.href = `https://wa.me/5511984348036?text=${msg}`;
      }, 2000);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // Category Filter
    if (selectedCategory !== 'todos') {
      result = result.filter(p => p.categoria?.toUpperCase() === selectedCategory.toUpperCase());
    }

    // Search Filter (Case-insensitive)
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.nome.toLowerCase().includes(lowerSearch) || 
        p.descricao?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sorting
    result = [...result].sort((a, b) => {
      const priceA = parseFloat(String(a.preco || 0));
      const priceB = parseFloat(String(b.preco || 0));
      if (sortBy === 'cheapest') return priceA - priceB;
      if (sortBy === 'expensive') return priceB - priceA;
      return 0; // recommended
    });

    return result;
  }, [products, selectedCategory, searchTerm, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        user={user} 
        cartCount={cart.reduce((acc, item) => acc + item.quantidade, 0)}
        onToggleCart={() => setCartOpen(!cartOpen)}
        onOpenAuth={() => setAuthOpen(true)}
        onShowHome={() => setActiveSection('home')}
        onShowOrders={() => setActiveSection('orders')}
        onLogoClick={handleLogoClick}
        activeSection={activeSection}
      />

      {/* Free Shipping Banner */}
      <div className="bg-emerald-500 text-white text-[10px] py-2 px-4 text-center font-bold tracking-[2px] uppercase">
        🚚 FRETE GRÁTIS PARA TODO O BRASIL 🇧🇷
      </div>

      <div id="toast-container" className="fixed bottom-5 left-5 z-[50000] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`bg-stone-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in border-l-4 ${t.type === 'success' ? 'border-orange-500' : 'border-red-500'} text-xs font-bold`}>
            <span>{t.type === 'success' ? '✨' : '⚠️'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="flex-grow">
        {activeSection === 'home' ? (
          <>
            <header className="text-center pt-8 md:pt-16 pb-12 px-4 flex flex-col items-center">
              {user && (
                <div className="mb-10 animate-fade-in">
                  <h2 className="font-cinzel text-lg md:text-2xl text-stone-800 tracking-[3px] uppercase">
                    AXÉ, {(user.displayName || user.email?.split('@')[0])?.toUpperCase()}!
                  </h2>
                </div>
              )}

              <h2 className="font-cinzel text-3xl md:text-5xl text-stone-900 mb-12 tracking-tighter leading-tight uppercase max-w-2xl">
                Arte que vibra,<br />Fundamento que guia.
              </h2>

              {/* Search & Filters */}
              <div className="w-full max-w-4xl flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                  <input 
                    type="text" 
                    placeholder="Busque por guias, brajás, orixás..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-stone-100 rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-orange-500 shadow-sm transition-all"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-white border border-stone-100 rounded-full py-3 px-6 flex items-center gap-3 shadow-sm">
                    <Filter className="w-4 h-4 text-stone-400" />
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-[10px] uppercase font-bold tracking-widest outline-none cursor-pointer"
                    >
                      <option value="recommended">Recomendado</option>
                      <option value="cheapest">Mais Barato</option>
                      <option value="expensive">Mais Caro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => setSelectedCategory('todos')}
                  className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === 'todos' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'bg-white border border-stone-100 text-stone-400 hover:border-black hover:text-black'}`}
                >
                  Todas as Peças
                </button>
                <button 
                  onClick={() => setSelectedCategory('GUIAS')}
                  className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === 'GUIAS' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'bg-white border border-stone-100 text-stone-400 hover:border-black hover:text-black'}`}
                >
                  Guias de Orixá
                </button>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-10 pb-20 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
                {filteredAndSortedProducts.length > 0 ? (
                  filteredAndSortedProducts.map(product => (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      onOpenDetails={(p) => { setSelectedProduct(p); setDetailsOpen(true); }}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20">
                    <p className="text-stone-400 uppercase text-[12px] tracking-widest italic">
                      Nenhum item encontrado com esses critérios.
                    </p>
                  </div>
                )}
              </div>
            </main>
          </>
        ) : (
          <div className="max-w-7xl mx-auto px-4 md:px-10 py-12 md:py-20 w-full">
            <h2 className="font-cinzel text-3xl md:text-5xl text-stone-800 mb-2 uppercase">Meus Pedidos</h2>
            <p className="text-stone-500 mb-10 text-base md:text-lg">Acompanhe aqui o histórico de suas peças encomendas.</p>
            
            {!user ? (
              <div className="p-8 md:p-12 text-center bg-white rounded-xl mb-6 border-2 border-dashed border-stone-100">
                <p className="text-stone-400 italic mb-4">Você precisa estar logado para ver seus pedidos.</p>
                <button onClick={() => setAuthOpen(true)} className="px-8 py-3 bg-[#1a1a1a] text-white rounded-full font-bold uppercase text-xs tracking-widest hover:bg-stone-800">
                  Fazer Login agora
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-left min-w-[620px]">
                  <thead className="bg-stone-50 border-b border-stone-100 text-[12px] uppercase tracking-widest text-stone-400">
                    <tr>
                      <th className="px-6 py-4">Itens da Encomenda</th>
                      <th className="px-6 py-4">Valor Total</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {orders.length > 0 ? (
                      orders.map(order => (
                        <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50 transition">
                          <td className="px-6 py-4 font-semibold text-[11px] max-w-xs">{order.itens}</td>
                          <td className="px-6 py-4 text-[11px]">R$ {parseFloat(String(order.valorTotal)).toFixed(2)}</td>
                          <td className="px-6 py-4 text-stone-400 text-[11px]">{order.data}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {order.logistica}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-stone-400 italic text-[11px]">
                          Nenhum pedido encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="bg-white pt-16 pb-8 mt-20 relative z-50 group">
        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Admin Lock - Bottom Left, Hover PC / Always on Mobile if triggered */}
          <Link 
            to="/login"
            className={`absolute left-0 bottom-0 p-3 text-stone-200 hover:text-stone-800 transition-all duration-500 rounded-full ${showAdminLock ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}
            title="Painel"
          >
            <Lock className="w-4 h-4" />
          </Link>

          <div className="text-center">
            <div className="mb-8">
              <h3 className="font-cinzel text-2xl mb-2 tracking-[1px] text-stone-800">CANTO DE CABOCLO</h3>
              <p className="text-stone-500 text-[11px] font-semibold tracking-[3px] uppercase">TRABALHAMOS 100% VIA INTERNET</p>
            </div>

            <div className="flex justify-center gap-4 mb-10">
              <a 
                href="https://www.instagram.com/cantodecaboclo/?hl=pt-br" 
                target="_blank" 
                rel="noreferrer"
                className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white hover:opacity-80 transition-all"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="https://www.tiktok.com/@canto.de.caboclo" 
                target="_blank" 
                rel="noreferrer"
                className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white hover:opacity-80 transition-all"
              >
                <Music2 className="w-6 h-6" />
              </a>
            </div>

            <div className="border-t border-stone-100 max-w-4xl mx-auto mb-8"></div>

            <p className="text-[9px] text-stone-400 uppercase tracking-[2px]">
              &copy; 2026 CANTO DE CABOCLO. TODOS OS DIREITOS RESERVADOS.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp - Matching Image Style */}
      <a 
        href="https://wa.me/5511984348036?text=Olá, gostaria de tirar uma dúvida" 
        target="_blank" 
        className="fixed bottom-6 right-6 bg-[#25d366] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-[5000] group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
      </a>

      {/* Modals */}
      <Cart 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
        paymentMethod={paymentMethod}
        onSetPaymentMethod={setPaymentMethod}
      />
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
        showToast={showToast} 
      />
      <ProductDetailsModal 
        product={selectedProduct} 
        isOpen={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        onAddToCart={addToCart} 
      />

      {pixData && (
        <PixModal 
          onClose={() => setPixData(null)} 
          qrCode={pixData.qr_code} 
          qrBase64={pixData.qr_code_base64} 
        />
      )}
    </div>
  );
}
