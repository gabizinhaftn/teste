import { useState } from 'react';
import { X, Mail, Lock, UserPlus } from 'lucide-react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider } from '@/src/lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function AuthModal({ isOpen, onClose, showToast }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast("Bem-vindo axé!");
      onClose();
    } catch (e: any) {
      console.error(e);
      showToast("Erro ao autenticar com Google", "error");
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return showToast("Preencha todos os campos", "error");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Login realizado!");
      onClose();
    } catch (e) {
      showToast("E-mail ou senha incorretos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || password.length < 6) return showToast("Senha curta (mín. 6)", "error");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showToast("Conta criada com sucesso!");
      onClose();
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') showToast("E-mail já cadastrado!", "error");
      else showToast("Erro ao cadastrar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-2xl text-stone-300 hover:text-black transition"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="font-cinzel text-2xl mb-6 text-center text-stone-800">Identifique-se</h3>
            
            <button 
              onClick={handleGoogleLogin}
              className="w-full border p-3 rounded-xl flex items-center justify-center gap-3 mb-6 hover:bg-stone-50 transition font-bold text-stone-700"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5" alt="Google" /> 
              Continuar com Google
            </button>

            <div className="relative mb-6 text-center">
              <span className="bg-white px-4 text-gray-400 text-[10px] uppercase tracking-widest relative z-10">
                Ou use seu e-mail
              </span>
              <hr className="absolute top-1/2 w-full border-gray-100" />
            </div>

            <div className="space-y-3 mb-6">
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-stone-300" />
                <input 
                  type="email" 
                  placeholder="Seu e-mail" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-stone-200 p-3 pl-10 rounded-xl focus:outline-none focus:border-stone-500 transition"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-stone-300" />
                <input 
                  type="password" 
                  placeholder="Sua senha" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-stone-200 p-3 pl-10 rounded-xl focus:outline-none focus:border-stone-500 transition"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleEmailLogin}
                disabled={loading}
                className="flex-1 bg-[#1a1a1a] text-white py-3 rounded-full text-[12px] font-bold uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50"
              >
                Entrar
              </button>
              <button 
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 border border-stone-200 text-stone-400 py-3 rounded-full text-[12px] font-bold uppercase tracking-widest hover:border-black hover:text-black disabled:opacity-50"
              >
                Cadastrar
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 text-center italic">
              Para criar conta, preencha os dados e clique em Cadastrar.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
