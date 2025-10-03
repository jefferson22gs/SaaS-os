export interface SalesSpikeAlert {
  productName: string;
  observation: string;
}

export interface DemandForecast {
  productName: string;
  predictedDemand: string;
  reasoning: string;
}

export enum UserRole {
  Owner = 'owner',
  Operator = 'operator',
}

export interface User {
  id: string;
  supermarket_id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Usado apenas para criação, não será armazenado no estado.
}

export interface Supermarket {
  id: string;
  owner_id: string;
  name: string;
  logo: string | null;
  theme: 'light' | 'dark' | 'green';
  cnpj?: string;
  ie?: string;
  address?: string;
  phone?: string;
}

export interface Product {
  id: string;
  supermarket_id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  lowStockThreshold: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  supermarket_id: string;
  items: CartItem[];
  total: number;
  timestamp: string;
  operator_id: string;
  customer_id?: string;
}

export interface CashFlowEntry {
  id: string;
  supermarket_id: string;
  operator_id: string;
  type: 'sale' | 'sangria' | 'initial';
  amount: number;
  timestamp: string;
  description: string;
}

export interface DailyReport {
    id: string;
    supermarket_id: string;
    date: string;
    totalSales: number;
    initialCash: number;
    totalSangria: number;
    finalCash: number;
    sales: Sale[];
    cashFlow: CashFlowEntry[];
}

export interface Customer {
    id: string;
    supermarket_id: string;
    name: string;
    cpf: string;
    points: number;
}

export interface FeedbackAnalysisResult {
  sentiment: 'Positivo' | 'Negativo' | 'Misto';
  keyTopics: string[];
  suggestion: string;
}