import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { User, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';

interface LoginProps {
  user: User | null;
}

export default function Login({ user }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/admin" />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Se você digitar cantodecaboclo / cantodecaboclo
      if (email === 'cantodecaboclo' && password === 'cantodecaboclo') {
        const loginEmail = 'admin@cantodecaboclo.com.br';
        const loginPass = 'cantodecaboclo';
        
        try {
          await signInWithEmailAndPassword(auth, loginEmail, loginPass);
        } catch (authErr) {
          // Se o usuário não existir no Firebase ainda, vamos dar um erro amigável
          setError('Usuário administrativo não encontrado no banco de dados. Crie a conta "admin@cantodecaboclo.com.br" no portal primeiro.');
          console.error(authErr);
        }
        return;
      }
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Usuário ou Senha incorretos.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fdfbf7]">
      <div className="max-w-md w-full p-10 bg-white border border-stone-100 shadow-2xl text-center animate-fade-in">
        <div className="mb-8">
          <h1 className="font-cinzel text-2xl uppercase tracking-widest mb-2">Portal do Administrador</h1>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest">Área Restrita / Login Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest border border-red-100">
              {error}
            </div>
          )}
          <input 
            type="text" 
            placeholder="Usuário de Acesso" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 border border-stone-100 bg-stone-50 outline-none focus:border-stone-800 transition-all text-xs tracking-widest" 
            autoComplete="off"
            required
          />
          
          <input 
            type="password" 
            placeholder="Senha" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 border border-stone-100 bg-stone-50 outline-none focus:border-stone-800 transition-all text-xs tracking-widest uppercase" 
            required
          />
          
          <button 
            type="submit" 
            className="w-full bg-stone-800 text-white py-4 font-bold uppercase tracking-[0.2em] hover:bg-black transition shadow-lg text-xs"
          >
            Entrar no Painel
          </button>
        </form>

        <Link 
          to="/" 
          className="block mt-10 text-[10px] uppercase text-stone-400 tracking-widest hover:text-stone-800 transition-colors italic"
        >
          ← Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
