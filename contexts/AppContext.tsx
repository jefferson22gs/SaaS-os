import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, Supermarket, Product, Sale, CashFlowEntry, DailyReport, UserRole, Customer } from '../types';

// --- Default Data ---
const getInitialProducts = (): Product[] => [
    { id: 'prod1', name: 'Leite Integral 1L', price: 5.50, stock: 100, imageUrl: 'https://placehold.co/150x150/e0f2fe/0c4a6e?text=Leite', lowStockThreshold: 20 },
    { id: 'prod2', name: 'Pão de Forma Tradicional', price: 7.20, stock: 80, imageUrl: 'https://placehold.co/150x150/fae8ff/581c87?text=Pão', lowStockThreshold: 15 },
    { id: 'prod3', name: 'Café em Pó 500g', price: 15.90, stock: 50, imageUrl: 'https://placehold.co/150x150/fefce8/854d0e?text=Café', lowStockThreshold: 10 },
    { id: 'prod4', name: 'Arroz Branco Tipo 1 5kg', price: 25.00, stock: 60, imageUrl: 'https://placehold.co/150x150/f7fee7/365314?text=Arroz', lowStockThreshold: 10 },
    { id: 'prod5', name: 'Feijão Carioca 1kg', price: 9.80, stock: 70, imageUrl: 'https://placehold.co/150x150/fef2f2/991b1b?text=Feijão', lowStockThreshold: 15 },
    { id: 'prod6', name: 'Óleo de Soja 900ml', price: 8.50, stock: 90, imageUrl: 'https://placehold.co/150x150/fffbeb/b45309?text=Óleo', lowStockThreshold: 20 },
    { id: 'prod7', name: 'Refrigerante Cola 2L', price: 9.00, stock: 8, imageUrl: 'https://placehold.co/150x150/f1f5f9/1e293b?text=Cola', lowStockThreshold: 10 },
    { id: 'prod8', name: 'Sabão em Pó 1kg', price: 12.30, stock: 40, imageUrl: 'https://placehold.co/150x150/ecfeff/0891b2?text=Sabão', lowStockThreshold: 5 },
    { id: 'prod9', name: 'Maçã Fuji (Kg)', price: 6.99, stock: 5, imageUrl: 'https://placehold.co/150x150/fecaca/991b1b?text=Maçã', lowStockThreshold: 10 },
    { id: 'prod10', name: 'Batata Lavada (Kg)', price: 4.50, stock: 50, imageUrl: 'https://placehold.co/150x150/fef9c3/a16207?text=Batata', lowStockThreshold: 10 },
    { id: 'prod11', name: 'Bandeja de Ovos (12 un)', price: 11.00, stock: 25, imageUrl: 'https://placehold.co/150x150/ffedd5/c2410c?text=Ovos', lowStockThreshold: 10 },
    { id: 'prod12', name: 'Queijo Mussarela (100g)', price: 4.80, stock: 45, imageUrl: 'https://placehold.co/150x150/fefce8/a16207?text=Queijo', lowStockThreshold: 5 },
];

const defaultOwner: User = {
    id: 'owner1',
    name: 'Admin Proprietário',
    email: 'dono@super.mercado',
    role: UserRole.Owner,
    password: 'admin'
};

const defaultOperator: User = { 
    id: 'op1', 
    name: 'Caixa Padrão', 
    email: 'caixa@super.mercado', 
    role: UserRole.Operator, 
    password: '123' 
};

const anotherOperator: User = {
    id: 'op2',
    name: 'Maria Souza',
    email: 'maria@super.mercado',
    role: UserRole.Operator,
    password: '456'
};

const getInitialUsers = (): User[] => [defaultOwner, defaultOperator, anotherOperator];

const getInitialSupermarket = (): Supermarket => ({
    name: 'Supermercado Modelo',
    logo: null,
    theme: 'light',
    cnpj: '00.000.000/0001-00',
    ie: '000.000.000.000',
    address: 'Rua Exemplo, 123, Bairro Modelo, Cidade/UF',
    phone: '(00) 1234-5678'
});


const getInitialCustomers = (): Customer[] => [
    { id: 'cust1', name: 'João da Silva', cpf: '11122233344', points: 150 },
    { id: 'cust2', name: 'Maria Oliveira', cpf: '55566677788', points: 85 },
];


// --- Helper Functions for LocalStorage ---
const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
};


// --- Context Definition ---
export interface BulkUpdatePayload {
    productIds: string[];
    price?: { operation: 'set' | 'increase_value' | 'decrease_value' | 'increase_percent' | 'decrease_percent'; value: number };
    stock?: { operation: 'set' | 'increase_value' | 'decrease_value'; value: number };
}

interface AppContextType {
  user: User | null;
  users: User[];
  supermarket: Supermarket | null;
  products: Product[];
  sales: Sale[];
  cashFlow: CashFlowEntry[];
  report: DailyReport | null;
  customers: Customer[];
  error: string | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  register: (ownerData: Omit<User, 'id' | 'role'>, supermarketData: Supermarket) => void;
  addSale: (sale: Omit<Sale, 'id' | 'timestamp' | 'operatorId'>, operatorId: string) => void;
  addCashFlow: (entry: CashFlowEntry) => void;
  closeShift: () => void;
  addProduct: (productData: Omit<Product, 'id' | 'lowStockThreshold'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  bulkUpdateProducts: (payload: BulkUpdatePayload) => void;
  addCustomer: (customerData: Omit<Customer, 'id' | 'points'>) => Customer;
  addOperator: (operatorData: Omit<User, 'id' | 'role'>) => void;
  updateOperator: (operator: User) => void;
  deleteOperator: (operatorId: string) => void;
  updateSupermarket: (supermarketData: Supermarket) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = usePersistentState<User | null>('saas-pos-user', null);
    const [supermarket, setSupermarket] = usePersistentState<Supermarket | null>('saas-pos-supermarket', getInitialSupermarket());
    const [users, setUsers] = usePersistentState<User[]>('saas-pos-users', getInitialUsers());
    const [products, setProducts] = usePersistentState<Product[]>('saas-pos-products', getInitialProducts());
    const [sales, setSales] = usePersistentState<Sale[]>('saas-pos-sales', []);
    const [cashFlow, setCashFlow] = usePersistentState<CashFlowEntry[]>('saas-pos-cashflow', []);
    const [report, setReport] = usePersistentState<DailyReport | null>('saas-pos-report', null);
    const [customers, setCustomers] = usePersistentState<Customer[]>('saas-pos-customers', getInitialCustomers());
    const [error, setError] = useState<string | null>(null);

    // Set document theme
    useEffect(() => {
        if (supermarket?.theme) {
            document.documentElement.setAttribute('data-theme', supermarket.theme);
        } else {
             document.documentElement.setAttribute('data-theme', 'light');
        }
    }, [supermarket]);

    const clearError = useCallback(() => setError(null), []);

    const login = useCallback((email: string, password: string) => {
        setError(null);
        const foundUser = users.find(u => u.email === email && u.password === password);
        if (foundUser) {
            setUser(foundUser);
            // If operator logs in, clear previous day's report
            if(foundUser.role === UserRole.Operator) {
                setReport(null);
                 setSales([]); // Clear sales from previous day for the operator view
                setCashFlow([]); // Clear cashflow from previous day for the operator view
                // Set initial cash for the day
                 const initialCashEntry: CashFlowEntry = {
                    id: `initial-${new Date().toISOString()}`,
                    type: 'initial',
                    amount: 200.00, // Example initial cash
                    timestamp: new Date().toISOString(),
                    description: 'Caixa Inicial'
                };
                setCashFlow([initialCashEntry]);
            }
        } else {
            setError('Email ou senha inválidos.');
        }
    }, [users, setCashFlow, setUser, setReport, setSales]);

    const logout = useCallback(() => {
        setUser(null);
    }, [setUser]);

    const register = useCallback((ownerData: Omit<User, 'id' | 'role'>, supermarketData: Supermarket) => {
        setError(null);

        const newOwner: User = {
            ...ownerData,
            id: `owner-${new Date().toISOString()}`,
            role: UserRole.Owner
        };

        setUsers(prevUsers => [...prevUsers.filter(u => u.role !== UserRole.Owner), newOwner]);
        setSupermarket(supermarketData);
        setUser(newOwner);
    }, [setUsers, setSupermarket, setUser]);

    const addSale = useCallback((saleData: Omit<Sale, 'id' | 'timestamp' | 'operatorId'>, operatorId: string) => {
        const newSale: Sale = {
            ...saleData,
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            operatorId: operatorId
        };
        setSales(prev => [...prev, newSale]);

        // Deduct stock for each item sold
        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            saleData.items.forEach(cartItem => {
                const productIndex = updatedProducts.findIndex(p => p.id === cartItem.id);
                if (productIndex !== -1) {
                    updatedProducts[productIndex] = {
                        ...updatedProducts[productIndex],
                        stock: updatedProducts[productIndex].stock - cartItem.quantity,
                    };
                }
            });
            return updatedProducts;
        });

        // Award points if customer is identified
        if (saleData.customerId) {
            const pointsEarned = Math.floor(saleData.total / 10); // 1 point for every R$10
            if (pointsEarned > 0) {
                setCustomers(prev => prev.map(c => 
                    c.id === saleData.customerId 
                        ? { ...c, points: c.points + pointsEarned }
                        : c
                ));
            }
        }
    }, [setSales, setCustomers, setProducts]);


    const addCashFlow = useCallback((entry: CashFlowEntry) => {
        setCashFlow(prev => [...prev, entry]);
    }, [setCashFlow]);

    const closeShift = useCallback(() => {
        const initialCash = cashFlow.find(cf => cf.type === 'initial')?.amount || 0;
        const totalSalesValue = sales.reduce((sum, s) => sum + s.total, 0);
        const totalSangria = cashFlow.filter(cf => cf.type === 'sangria').reduce((sum, s) => sum + s.amount, 0);
        const finalCash = initialCash + totalSalesValue + totalSangria;

        const dailyReport: DailyReport = {
            date: new Date().toLocaleDateString('pt-BR'),
            totalSales: totalSalesValue,
            initialCash,
            totalSangria: Math.abs(totalSangria),
            finalCash,
            sales,
            cashFlow
        };
        
        setReport(dailyReport);

        // Reset for the next day and logout
        logout();

    }, [sales, cashFlow, setReport, logout]);

    const addProduct = useCallback((productData: Omit<Product, 'id' | 'lowStockThreshold'>) => {
        const newProduct: Product = {
            ...productData,
            id: `prod-${new Date().getTime()}`,
            lowStockThreshold: 10, // Default threshold
        };
        setProducts(prev => [...prev, newProduct]);
    }, [setProducts]);

    const updateProduct = useCallback((updatedProduct: Product) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }, [setProducts]);

    const deleteProduct = useCallback((productId: string) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
    }, [setProducts]);
    
    const addCustomer = useCallback((customerData: Omit<Customer, 'id' | 'points'>) => {
        const newCustomer: Customer = {
            ...customerData,
            id: `cust-${new Date().getTime()}`,
            points: 0,
        };
        setCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
    }, [setCustomers]);

    const bulkUpdateProducts = useCallback((payload: BulkUpdatePayload) => {
        const { productIds, price, stock } = payload;
        const productIdsSet = new Set(productIds);

        setProducts(prevProducts =>
            prevProducts.map(p => {
                if (!productIdsSet.has(p.id)) {
                    return p;
                }

                const updatedProduct = { ...p };

                if (price && price.value >= 0) {
                    let newPrice = p.price;
                    switch (price.operation) {
                        case 'set': newPrice = price.value; break;
                        case 'increase_value': newPrice += price.value; break;
                        case 'decrease_value': newPrice -= price.value; break;
                        case 'increase_percent': newPrice *= (1 + price.value / 100); break;
                        case 'decrease_percent': newPrice *= (1 - price.value / 100); break;
                    }
                    updatedProduct.price = Math.max(0, parseFloat(newPrice.toFixed(2)));
                }

                if (stock) {
                    let newStock = p.stock;
                    switch (stock.operation) {
                        case 'set': newStock = stock.value; break;
                        case 'increase_value': newStock += stock.value; break;
                        case 'decrease_value': newStock -= stock.value; break;
                    }
                     updatedProduct.stock = Math.max(0, Math.floor(newStock));
                }

                return updatedProduct;
            })
        );
    }, [setProducts]);

    const addOperator = useCallback((operatorData: Omit<User, 'id' | 'role'>) => {
        setError(null);
        if (users.some(u => u.email === operatorData.email)) {
            setError('Este email já está em uso.');
            return;
        }
        const newOperator: User = {
            ...operatorData,
            id: `op-${new Date().getTime()}`,
            role: UserRole.Operator,
        };
        setUsers(prev => [...prev, newOperator]);
    }, [users, setUsers]);

    const updateOperator = useCallback((updatedOperator: User) => {
        setUsers(prev => prev.map(u => u.id === updatedOperator.id ? updatedOperator : u));
    }, [setUsers]);

    const deleteOperator = useCallback((operatorId: string) => {
        setUsers(prev => prev.filter(u => u.id !== operatorId && u.role !== UserRole.Owner));
    }, [setUsers]);
    
    const updateSupermarket = useCallback((supermarketData: Supermarket) => {
        setSupermarket(supermarketData);
    }, [setSupermarket]);

    const value = {
        user,
        users,
        supermarket,
        products,
        sales,
        cashFlow,
        report,
        customers,
        error,
        login,
        logout,
        register,
        addSale,
        addCashFlow,
        closeShift,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkUpdateProducts,
        addCustomer,
        addOperator,
        updateOperator,
        deleteOperator,
        updateSupermarket,
        clearError,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};