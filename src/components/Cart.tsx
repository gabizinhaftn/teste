import { X, Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  paymentMethod: 'pix' | 'card';
  onSetPaymentMethod: (method: 'pix' | 'card') => void;
}

export default function Cart({ 
  isOpen, 
  onClose, 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  paymentMethod,
  onSetPaymentMethod
}: CartProps) {
  const total = cart.reduce((acc, item) => acc + (parseFloat(String(item.preco)) * item.quantidade), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
          />
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl p-6 md:p-8 flex flex-col z-[10000]"
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-cinzel text-2xl">Sacola</h3>
              <button 
                onClick={onClose}
                className="text-2xl hover:text-orange-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {cart.length === 0 ? (
                <p className="text-center text-stone-400 text-[12px] mt-20 uppercase tracking-widest">
                  Sua sacola está vazia
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center border-b border-stone-50 pb-4 mb-4">
                    <img 
                      src={item.imagem} 
                      className="w-14 h-16 object-cover rounded-lg" 
                      alt={item.nome} 
                    />
                    <div className="flex-1">
                      <h5 className="text-[11px] font-bold uppercase tracking-tighter mb-1">{item.nome}</h5>
                      <div className="flex items-center gap-3 mt-2">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-5 h-5 border flex items-center justify-center text-[10px]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[11px] font-bold">{item.quantidade}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-5 h-5 border flex items-center justify-center text-[10px]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[11px]">
                        R$ {(parseFloat(String(item.preco)) * item.quantidade).toFixed(2)}
                      </p>
                      <button 
                        onClick={() => onRemoveItem(item.id)}
                        className="text-[9px] text-red-500 uppercase font-bold mt-2 hover:text-red-700 transition"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="flex justify-between font-bold mb-4 text-lg">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>

              {cart.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-stone-100 p-1 rounded-xl flex gap-1">
                    <button 
                      onClick={() => onSetPaymentMethod('pix')}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${paymentMethod === 'pix' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      Pagar com PIX
                    </button>
                    <button 
                      onClick={() => onSetPaymentMethod('card')}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${paymentMethod === 'card' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      Pagar com Cartão
                    </button>
                  </div>

                  <button 
                    onClick={onCheckout}
                    className="w-full bg-[#1a1a1a] text-white py-5 rounded-xl font-bold uppercase tracking-[2px] text-[11px] hover:bg-stone-800 transition-all shadow-xl shadow-stone-200/50"
                  >
                    {paymentMethod === 'pix' ? 'Gerar PIX' : 'Pagar Agora'}
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
