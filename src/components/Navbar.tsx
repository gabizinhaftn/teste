import React, { useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { ShoppingBag, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  user: User | null;
  cartCount: number;
  onToggleCart: () => void;
  onOpenAuth: () => void;
  onShowHome: () => void;
  onShowOrders: () => void;
  activeSection: string;
  onLogoClick: () => void;
}

export default function Navbar({ 
  user, 
  cartCount, 
  onToggleCart, 
  onOpenAuth, 
  onShowHome, 
  onShowOrders,
  onLogoClick,
  activeSection 
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[1000] bg-white shadow-md px-4 md:px-10 py-4 md:py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div 
            onClick={onLogoClick}
            className="flex items-center gap-3 md:gap-4 cursor-pointer min-w-0"
          >
            <img 
              src="https://i.ibb.co/KpkJ1K4Z/LOGO-CANTO-DE-CABOCLO.jpg" 
              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shadow-sm shrink-0" 
              alt="Logo" 
            />
            <div className="min-w-0">
              <h1 className="font-cinzel text-sm sm:text-base md:text-2xl tracking-widest leading-none truncate">
                CANTO DE CABOCLO
              </h1>
              <p className="text-[9px] md:text-[11px] uppercase tracking-[2px] md:tracking-[3px] text-stone-400 truncate">
                Religiosidade & Arte
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex justify-center gap-8 text-[14px] uppercase font-bold tracking-widest text-stone-600">
          <button 
            onClick={onShowHome}
            className={`hover:text-stone-900 transition ${activeSection === 'home' ? 'text-stone-900' : ''}`}
          >
            Coleções
          </button>
          <button 
            onClick={onShowOrders}
            className={`hover:text-stone-900 transition ${activeSection === 'orders' ? 'text-stone-900' : ''}`}
          >
            Meus Pedidos
          </button>
          {user ? (
            <button 
              onClick={() => signOut(auth)}
              className="text-stone-400 hover:text-stone-900 transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sair ({user.displayName || user.email?.split('@')[0]})
            </button>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="text-orange-600 hover:text-orange-700 transition"
            >
              Entrar
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={onToggleCart} className="p-2 relative group">
            <ShoppingBag className="w-6 h-6 transition-transform group-hover:scale-110" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-orange-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full animate-fade-in">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[20000]">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-8 shadow-xl flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h2 className="font-cinzel text-xl">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="text-2xl">&times;</button>
            </div>
            <button 
              onClick={() => { onShowHome(); setMobileMenuOpen(false); }}
              className="text-left text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-black"
            >
              Coleções
            </button>
            <button 
              onClick={() => { onShowOrders(); setMobileMenuOpen(false); }}
              className="text-left text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-black"
            >
              Meus Pedidos
            </button>
            {!user ? (
              <button 
                onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
                className="text-left text-xs font-bold uppercase tracking-widest text-orange-600"
              >
                Entrar / Cadastrar
              </button>
            ) : (
              <button 
                onClick={() => { signOut(auth); setMobileMenuOpen(false); }}
                className="text-left text-xs font-bold uppercase tracking-widest text-stone-400"
              >
                Sair
              </button>
            )}
            
            <p className="mt-auto text-[9px] text-stone-400 uppercase tracking-widest text-center">
              Canto de Caboclo &copy; 2026
            </p>
          </div>
        </div>
      )}
    </nav>
  );
}
