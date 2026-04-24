import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface PixModalProps {
  onClose: () => void;
  qrCode: string;
  qrBase64: string;
}

export default function PixModal({ onClose, qrCode, qrBase64 }: PixModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-stone-900 mb-2">Pagamento via PIX</h3>
            <p className="text-stone-500 text-sm">Escaneie o QR Code abaixo para pagar</p>
          </div>

          <div className="flex justify-center mb-8 bg-stone-50 p-6 rounded-2xl">
            <img 
              src={`data:image/png;base64,${qrBase64}`} 
              alt="QR Code PIX" 
              className="w-full max-w-[200px] aspect-square object-contain"
            />
          </div>

          <div className="space-y-4">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">Código Copia e Cola</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={qrCode}
                  className="flex-1 bg-transparent text-xs text-stone-600 outline-none overflow-hidden text-ellipsis"
                />
                <button 
                  onClick={copyToClipboard}
                  className="p-2 text-stone-800 hover:bg-stone-200 rounded-lg transition-colors"
                  title="Copiar código"
                >
                  {copied ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full bg-[#c5a059] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#b38f4d] transition-all"
            >
              Já realizei o pagamento
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-stone-400 uppercase tracking-widest">
              Pagamento processado de forma segura via Mercado Pago
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
