import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import Home from '@/src/pages/Home';
import Login from '@/src/pages/Login';
import Admin from '@/src/pages/Admin';
import { CartItem } from '@/src/types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart_fio_de_axe');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart_fio_de_axe', JSON.stringify(cart));
  }, [cart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="font-cinzel text-xl animate-pulse tracking-widest uppercase">
          Carregando Axé...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home user={user} cart={cart} setCart={setCart} />} />
        <Route path="/login" element={<Login user={user} />} />
        <Route 
          path="/admin" 
          element={
            user && (user.email === 'contato.nandoxavierdev@gmail.com' || user.email === 'admin@cantodecaboclo.com.br') 
            ? <Admin user={user} /> 
            : <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}
