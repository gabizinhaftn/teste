import React from 'react';
import { Product } from '@/src/types';

export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onOpenDetails }) => {
  return (
    <div className="bg-white rounded-[20px] p-[15px] shadow-[0_10px_25px_rgba(0,0,0,0.03)] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)] group relative z-10">
      <div 
        onClick={() => onOpenDetails(product)}
        className="relative aspect-[3/4] overflow-hidden rounded-[15px] mb-6 bg-stone-100 shadow-inner cursor-pointer"
      >
        <img 
          src={product.imagem || 'https://via.placeholder.com/400x533?text=Imagem+Indisponivel'} 
          className="w-full h-full object-cover transition duration-500 group-hover:scale-110" 
          alt={product.nome}
        />
      </div>
      <div className="text-center px-2">
        <p className="text-[10px] uppercase tracking-widest text-orange-600 font-bold mb-1">
          {product.categoria || 'Arte Axé'}
        </p>
        <h4 
          onClick={() => onOpenDetails(product)}
          className="font-cinzel text-xl text-stone-800 mb-2 truncate cursor-pointer hover:text-orange-600 transition-colors"
        >
          {product.nome}
        </h4>
        <p className="text-stone-800 text-lg font-semibold mb-4 italic">
          R$ {parseFloat(String(product.preco || 0)).toFixed(2)}
        </p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="w-full border border-stone-800 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-stone-800 hover:text-white transition-all"
        >
          Adicionar à Sacola
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
