import React, { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  runTransaction,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { Product, Order } from '@/src/types';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, 
  Edit, 
  TrendingUp, 
  AlertCircle, 
  Search, 
  LogOut, 
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  Trash2,
  X,
  Plus
} from 'lucide-react';

interface AdminProps {
  user: User;
}

export default function Admin({ user }: AdminProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'cadastro' | 'produtos' | 'relatorios'>('cadastro');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats
  const stats = {
    totalItens: products.length,
    faturamento: orders.reduce((acc, o) => o.pagamento === 'PAGO' ? acc + parseFloat(String(o.valorTotal)) : acc, 0),
    esgotados: products.filter(p => p.status === 'esgotado').length
  };

  // Form State
  const [form, setForm] = useState({
    nome: '',
    categoria: 'guias',
    preco: '',
    status: 'disponivel',
    descricao: '',
    imagem: ''
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([]);

  useEffect(() => {
    const qProd = query(collection(db, "produtos"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const qOrders = query(collection(db, "pedidos"), orderBy("timestamp", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    return () => { unsubProd(); unsubOrders(); };
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imagem) return showToast("Selecione uma foto.", "error");
    setIsSubmitting(true);

    try {
      const metadadosRef = doc(db, "metadados", "contador_pedidos");
      
      await runTransaction(db, async (transaction) => {
        const metaDoc = await transaction.get(metadadosRef);
        let novoIdNum = 1;
        
        if (metaDoc.exists()) {
          novoIdNum = metaDoc.data().ultimoId + 1;
        }
        
        transaction.set(metadadosRef, { ultimoId: novoIdNum }, { merge: true });

        const newProdRef = doc(collection(db, "produtos"));
        transaction.set(newProdRef, {
          pedidoNumero: `#${novoIdNum}`,
          ...form,
          criadoEm: serverTimestamp()
        });
      });

      showToast("Produto publicado na vitrine!");
      setForm({ nome: '', categoria: 'guias', preco: '', status: 'disponivel', descricao: '', imagem: '' });
    } catch (err) {
      console.error(err);
      showToast("Erro ao publicar.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateDoc(doc(db, "produtos", editingProduct.id), {
        nome: editingProduct.nome,
        categoria: editingProduct.categoria,
        preco: editingProduct.preco,
        status: editingProduct.status,
        descricao: editingProduct.descricao
      });
      showToast("Alterações salvas!");
      setEditingProduct(null);
    } catch (err) {
      showToast("Erro ao salvar.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente remover este item?")) {
      try {
        await deleteDoc(doc(db, "produtos", id));
        showToast("Removido com sucesso", "error");
      } catch (err) {
        showToast("Erro ao remover", "error");
      }
    }
  };

  const updateOrderStatus = async (order: Order, field: string, value: string) => {
    try {
      await updateDoc(doc(db, "pedidos", order.id!), { [field]: value });
      showToast("Status de pedido atualizado!");

      // If logistic status changed, notify via email
      if (field === 'logistica') {
        const userDoc = orders.find(o => o.id === order.id);
        if (userDoc) {
          // Attempting to send email via server
          axios.post('/api/notify-status', {
            email: user.email, // In a real case, we'd store and use order.userEmail
            orderId: order.idPedido,
            status: value,
            cliente: order.cliente
          }).catch(e => console.error("Email notification failed", e));
        }
      }
    } catch (err) {
      showToast("Erro ao atualizar", "error");
    }
  };

  const clearHistory = async () => {
    if (confirm("Apagar permanentemente todos os registros?")) {
      try {
        const batch = writeBatch(db);
        const snapshot = await getDocs(collection(db, "pedidos"));
        snapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        showToast("Histórico limpo", "error");
      } catch (err) {
        showToast("Erro ao limpar", "error");
      }
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setForm({ ...form, imagem: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const filteredProducts = products.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-[#f9f8f4]">
      {/* Toast Manager */}
      <div className="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="bg-stone-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in border-l-4 border-orange-500 text-xs font-bold">
            <span>{t.type === 'success' ? '✨' : '⚠️'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-[#2d3a2e] text-white flex flex-col fixed h-full z-40">
        <div className="p-8 border-b border-stone-700">
          <h1 className="text-xl font-bold tracking-tighter uppercase text-[#c5a059] font-cinzel">Canto de Caboclo</h1>
          <p className="text-[9px] opacity-60 uppercase tracking-widest">Administração de Estoque</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-4 px-3">Navegação</p>
          <button 
            onClick={() => setActiveTab('cadastro')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded text-sm transition ${activeTab === 'cadastro' ? 'bg-[#c5a059] text-white font-bold' : 'text-stone-300 hover:bg-white/10'}`}
          >
            <Package className="w-4 h-4" /> <span>Cadastro</span>
          </button>
          <button 
            onClick={() => setActiveTab('produtos')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded text-sm transition ${activeTab === 'produtos' ? 'bg-[#c5a059] text-white font-bold' : 'text-stone-300 hover:bg-white/10'}`}
          >
            <Edit className="w-4 h-4" /> <span>Editar Catálogo</span>
          </button>
          <button 
            onClick={() => setActiveTab('relatorios')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded text-sm transition ${activeTab === 'relatorios' ? 'bg-[#c5a059] text-white font-bold' : 'text-stone-300 hover:bg-white/10'}`}
          >
            <TrendingUp className="w-4 h-4" /> <span>Vendas</span>
          </button>
        </nav>

        <div className="p-6 border-t border-stone-700">
          <Link to="/" className="text-xs text-stone-400 hover:text-white uppercase tracking-tighter transition-colors block w-full mb-4">
            ← Voltar para a Loja
          </Link>
          <button onClick={() => signOut(auth)} className="text-xs text-red-400 font-bold uppercase hover:text-red-300 transition-colors w-full text-left">
            ✕ Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg border border-stone-100 shadow-sm">
            <p className="text-[10px] uppercase text-stone-400 font-bold mb-1">Total de Itens</p>
            <span className="text-3xl font-bold font-cinzel">{stats.totalItens}</span>
          </div>
          <div className="bg-white p-6 rounded-lg border border-stone-100 shadow-sm uppercase">
            <p className="text-[10px] uppercase text-stone-400 font-bold mb-1">Faturamento (Vendas Pagas)</p>
            <span className="text-3xl font-bold font-cinzel text-emerald-700">
              R$ {stats.faturamento.toFixed(2)}
            </span>
          </div>
          <div className="bg-white p-6 rounded-lg border border-stone-100 shadow-sm">
            <p className="text-[10px] uppercase text-stone-400 font-bold mb-1">Itens Esgotados</p>
            <span className="text-3xl font-bold font-cinzel text-red-600">{stats.esgotados}</span>
          </div>
        </div>

        {activeTab === 'cadastro' && (
          <section className="animate-fade-in">
            <header className="mb-6">
              <h2 className="text-3xl font-bold uppercase tracking-tight font-cinzel text-stone-800">Novo Produto</h2>
              <p className="text-stone-500 text-sm">Adicione novos itens ao Axé da sua loja.</p>
            </header>

            <div className="max-w-5xl bg-white shadow-xl border border-stone-100 overflow-hidden rounded-lg p-8">
              <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Nome do Item</label>
                    <input 
                      type="text" 
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Ex: Guia de Oxóssi" 
                      className="w-full p-3 border-b border-stone-100 bg-transparent outline-none focus:border-stone-800 transition text-sm font-semibold" 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Categoria</label>
                      <select 
                        value={form.categoria}
                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                        className="w-full p-3 border-b border-stone-100 bg-transparent outline-none focus:border-stone-800 font-bold text-xs uppercase cursor-pointer"
                      >
                        <option value="guias">Guias de Orixá</option>
                        <option value="brajas">Brajás</option>
                        <option value="utensilios">Utensílios</option>
                        <option value="acessorios">Acessórios</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Status</label>
                      <select 
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                        className="w-full p-3 border-b border-stone-100 bg-transparent outline-none focus:border-stone-800 font-bold text-xs uppercase cursor-pointer"
                      >
                        <option value="disponivel">🟢 Disponível</option>
                        <option value="quase_acabando">🟡 Quase Acabando</option>
                        <option value="esgotado">🔴 Esgotado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Preço (R$)</label>
                    <input 
                      type="number" step="0.01" 
                      value={form.preco}
                      onChange={(e) => setForm({ ...form, preco: e.target.value })}
                      placeholder="0,00" 
                      className="w-full p-3 border-b border-stone-100 bg-transparent outline-none focus:border-stone-800 text-sm font-semibold" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Descrição Curta</label>
                    <textarea 
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      rows={3} 
                      placeholder="Detalhes sobre miçangas, fios e materiais..." 
                      className="w-full p-3 border border-stone-100 rounded bg-stone-50 outline-none focus:border-stone-800 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-6 flex flex-col justify-between">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Foto do Produto</label>
                    <div className="border-2 border-dashed border-stone-200 p-4 text-center bg-stone-50 relative min-h-[250px] flex items-center justify-center rounded hover:border-stone-400 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImage}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      {form.imagem ? (
                        <img src={form.imagem} className="max-h-56 rounded shadow-md border-4 border-white" alt="Preview" />
                      ) : (
                        <div className="text-stone-400">
                          <Plus className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs font-bold uppercase">Clique para Carregar</p>
                          <p className="text-[10px]">Sugestão: 800x1000px</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-[#2d3a2e] text-white py-4 font-bold uppercase tracking-widest hover:bg-black transition shadow-lg rounded disabled:opacity-50"
                  >
                    {isSubmitting ? 'Consagrando...' : 'Publicar Produto'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {activeTab === 'produtos' && (
          <section className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold uppercase tracking-tight font-cinzel text-stone-800">Estoque Ativo</h2>
                <p className="text-stone-500 text-sm">Gerencie preços, estoque e fotos.</p>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar produto..." 
                  className="w-full p-3 pl-10 border border-stone-200 rounded-lg text-sm outline-none focus:border-stone-800 transition" 
                />
              </div>
            </div>

            <div className="bg-white shadow-xl border border-stone-100 overflow-hidden rounded-lg overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-800 text-white text-[10px] uppercase tracking-widest">
                    <th className="p-5">Imagem</th>
                    <th className="p-5">Produto</th>
                    <th className="p-5">Categoria</th>
                    <th className="p-5">Preço</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="border-b border-stone-50 hover:bg-stone-50 transition">
                      <td className="p-4">
                        <img src={p.imagem} className="w-12 h-16 object-cover rounded shadow-sm border border-stone-100" alt={p.nome} />
                      </td>
                      <td className="p-4 font-bold text-stone-800 uppercase text-xs">
                        <span className="text-orange-500 mr-2">{p.pedidoNumero}</span>{p.nome}
                      </td>
                      <td className="p-4 text-[10px] text-stone-400 uppercase font-bold tracking-widest">{p.categoria}</td>
                      <td className="p-4 text-stone-500 font-bold">R$ {parseFloat(String(p.preco || 0)).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full ${
                          p.status === 'disponivel' ? 'bg-emerald-50 text-emerald-700' :
                          p.status === 'quase_acabando' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {p.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => setEditingProduct(p)}
                            className="bg-stone-100 p-2 text-stone-600 hover:bg-[#c5a059] hover:text-white transition rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="bg-red-50 p-2 text-red-400 hover:bg-red-500 hover:text-white transition rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'relatorios' && (
          <section className="animate-fade-in">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-bold uppercase tracking-tight font-cinzel text-stone-800">Registro de Vendas</h2>
                <p className="text-stone-500 text-sm">Histórico de pedidos em tempo real.</p>
              </div>
              <button 
                onClick={clearHistory}
                className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-4 py-2 rounded font-bold uppercase hover:bg-red-500 hover:text-white transition"
              >
                Limpar Histórico
              </button>
            </header>

            <div className="bg-white rounded-lg shadow-sm border border-stone-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">Itens</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">Total</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">Pagamento</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">Logística</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-stone-50 hover:bg-stone-50 transition">
                      <td className="px-6 py-4 font-bold text-orange-600 text-[11px]">{o.idPedido}</td>
                      <td className="px-6 py-4 font-semibold text-[12px] text-stone-800">{o.cliente}</td>
                      <td className="px-6 py-4 text-[11px] text-stone-500 max-w-xs truncate">{o.itens}</td>
                      <td className="px-6 py-4 font-bold text-[12px]">R$ {parseFloat(String(o.valorTotal)).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={o.pagamento}
                          onChange={(e) => updateOrderStatus(o, 'pagamento', e.target.value)}
                          className="text-[10px] font-bold p-2 rounded border border-stone-200 bg-white cursor-pointer uppercase outline-none focus:border-stone-800"
                        >
                          <option value="PENDENTE">PENDENTE</option>
                          <option value="PAGO">✅ PAGO</option>
                          <option value="CANCELADO">❌ CANCELADO</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={o.logistica}
                          onChange={(e) => updateOrderStatus(o, 'logistica', e.target.value)}
                          className="text-[10px] font-bold p-2 rounded border border-stone-200 bg-white cursor-pointer uppercase outline-none focus:border-stone-800"
                        >
                          <option value="AGUARDANDO PAGAMENTO">AGUARDANDO PAGAMENTO</option>
                          <option value="EM PREPARAÇÃO">🛠️ EM PREPARAÇÃO</option>
                          <option value="EM ROTA">🚚 EM ROTA</option>
                          <option value="ENTREGUE">✅ ENTREGUE</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full p-8 rounded shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="font-cinzel text-xl uppercase text-[#c5a059]">Editar Registro</h3>
              <button 
                onClick={() => setEditingProduct(null)}
                className="text-stone-300 hover:text-black transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  value={editingProduct.nome}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nome: e.target.value })}
                  className="w-full p-3 border border-stone-200 font-semibold outline-none focus:border-stone-800 rounded text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Categoria</label>
                <select 
                  value={editingProduct.categoria}
                  onChange={(e) => setEditingProduct({ ...editingProduct, categoria: e.target.value })}
                  className="w-full p-3 border border-stone-200 font-bold text-xs uppercase cursor-pointer rounded outline-none focus:border-stone-800"
                >
                  <option value="guias">Guias de Orixá</option>
                  <option value="brajas">Brajás</option>
                  <option value="utensilios">Utensílios</option>
                  <option value="acessorios">Acessórios</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Preço Sugerido</label>
                <input 
                  type="number" step="0.01" 
                  value={editingProduct.preco}
                  onChange={(e) => setEditingProduct({ ...editingProduct, preco: e.target.value })}
                  className="w-full p-3 border border-stone-200 font-semibold outline-none focus:border-stone-800 rounded text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Descrição</label>
                <textarea 
                  value={editingProduct.descricao}
                  onChange={(e) => setEditingProduct({ ...editingProduct, descricao: e.target.value })}
                  rows={3} 
                  className="w-full p-3 border border-stone-200 font-semibold outline-none focus:border-stone-800 rounded text-sm resize-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Status</label>
                <select 
                  value={editingProduct.status}
                  onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                  className="w-full p-3 border border-stone-200 font-bold text-xs uppercase cursor-pointer rounded outline-none focus:border-stone-800"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="quase_acabando">Quase Acabando</option>
                  <option value="esgotado">Esgotado</option>
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-3 bg-stone-100 text-[10px] font-bold uppercase rounded hover:bg-stone-200 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-stone-800 text-white text-[10px] font-bold uppercase hover:bg-black shadow-md rounded transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
