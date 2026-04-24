import { X } from 'lucide-react';
import { Product } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductDetailsModal({ product, isOpen, onClose, onAddToCart }: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[20000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-2xl rounded-[20px] overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white/80 rounded-full p-2 hover:bg-white transition-all shadow-md"
            >
              <X className="w-5 h-5 text-stone-800" />
            </button>

            <div className="w-full md:w-1/2 bg-stone-100">
              <img 
                src={product.imagem} 
                className="w-full h-full object-cover aspect-[3/4]" 
                alt={product.nome}
              />
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
              <p className="text-[10px] uppercase tracking-[0.2em] text-orange-600 font-bold mb-2">
                {product.categoria || 'Arte Axé'}
              </p>
              <h2 className="font-cinzel text-2xl text-stone-800 mb-4">{product.nome}</h2>
              
              <div className="flex-grow">
                <h3 className="text-[11px] uppercase tracking-widest text-stone-400 font-bold mb-2">Descrição</h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-6">
                  {product.descricao || "Este produto artesanal é carregado de axé e fundamento. Entre em contato para mais detalhes sobre a confecção."}
                </p>
              </div>

              <div className="mt-auto">
                <p className="text-2xl font-semibold text-stone-800 mb-6 italic">
                  R$ {parseFloat(String(product.preco || 0)).toFixed(2)}
                </p>
                <button 
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  className="w-full bg-stone-800 text-white py-4 text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-orange-600 transition-all"
                >
                  Adicionar à Sacola
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
