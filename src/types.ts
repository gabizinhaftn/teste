export interface Product {
  id: string;
  nome: string;
  preco: string | number;
  categoria: string;
  descricao: string;
  imagem: string;
  status: 'disponivel' | 'quase_acabando' | 'esgotado';
  pedidoNumero?: string;
  criadoEm?: any;
}

export interface CartItem extends Product {
  quantidade: number;
}

export interface Order {
  id?: string;
  idPedido: string;
  userId: string;
  cliente: string;
  itens: string;
  quantidadeTotal: number;
  valorTotal: string | number;
  pagamento: 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'AGUARDANDO';
  logistica: 'AGUARDANDO PAGAMENTO' | 'EM PREPARAÇÃO' | 'EM ROTA' | 'ENTREGUE' | 'AGUARDANDO PAGAMENTO (PIX)' | string;
  data: string;
  timestamp: any;
}
