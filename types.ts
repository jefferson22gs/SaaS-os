export interface SalesSpikeAlert {
  productName: string;
  observation: string;
}

export interface DemandForecast {
  productName: string;
  predictedDemand: string;
  reasoning: string;
}

import { StringifyOptions } from "querystring";

export enum UserRole {
  Owner = 'owner',
  Operator = 'operator',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Should be handled securely on a real backend
}

export interface Supermarket {
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
  items: CartItem[];
  total: number;
  timestamp: string;
  operatorId: string;
  customerId?: string;
}

export interface CashFlowEntry {
  id: string;
  type: 'sale' | 'sangria' | 'initial';
  amount: number;
  timestamp: string;
  description: string;
}

export interface DailyReport {
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
    name: string;
    cpf: string;
    points: number;
}

export interface FeedbackAnalysisResult {
  sentiment: 'Positivo' | 'Negativo' | 'Misto';
  keyTopics: string[];
  suggestion: string;
}