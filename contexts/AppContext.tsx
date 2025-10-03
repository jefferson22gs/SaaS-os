import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, Supermarket, Product, Sale, CashFlowEntry, DailyReport, UserRole, Customer } from '../types';
import { supabase } from '../services/supabaseClient';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (ownerData: Omit<User, 'id' | 'role' | 'supermarket_id'>, supermarketData: Omit<Supermarket, 'id' | 'owner_id'>) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'timestamp' | 'operator_id' | 'supermarket_id'>, operatorId: string) => Promise<void>;
  addCashFlow: (entry: Omit<CashFlowEntry, 'id' | 'supermarket_id' | 'operator_id'>) => Promise<void>;
  closeShift: () => Promise<void>;
  addProduct: (productData: Omit<Product, 'id' | 'lowStockThreshold' | 'supermarket_id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  bulkUpdateProducts: (payload: BulkUpdatePayload) => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'points' | 'supermarket_id'>) => Promise<Customer | null>;
  addOperator: (operatorData: Omit<User, 'id' | 'role' | 'supermarket_id'>) => Promise<void>;
  updateOperator: (operator: User) => Promise<void>;
  deleteOperator: (operatorId: string) => Promise<void>;
  updateSupermarket: (supermarketData: Supermarket) => Promise<void>;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>([]);
    const [report, setReport] = useState<DailyReport | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [error, setError] = useState<string | null>(null);

    // --- Auth Listener ---
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const { data: userProfile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setUser(userProfile as User | null);
            } else {
                setUser(null);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            if (user && user.supermarket_id) {
                // Fetch supermarket details
                const { data: smData } = await supabase.from('supermarkets').select('*').eq('id', user.supermarket_id).single();
                setSupermarket(smData as Supermarket);

                // Fetch related data
                const [productsRes, usersRes, customersRes, salesRes, cashFlowRes] = await Promise.all([
                    supabase.from('products').select('*').eq('supermarket_id', user.supermarket_id),
                    supabase.from('users').select('*').eq('supermarket_id', user.supermarket_id),
                    supabase.from('customers').select('*').eq('supermarket_id', user.supermarket_id),
                    supabase.from('sales').select('*').eq('supermarket_id', user.supermarket_id), // Note: might need date filter
                    supabase.from('cash_flow_entries').select('*').eq('supermarket_id', user.supermarket_id) // Note: might need date filter
                ]);
                setProducts(productsRes.data || []);
                setUsers(usersRes.data || []);
                setCustomers(customersRes.data || []);
                
                if (user.role === UserRole.Operator) {
                    setSales([]);
                    setCashFlow([]);
                    setReport(null);
                } else {
                    setSales(salesRes.data || []);
                    setCashFlow(cashFlowRes.data || []);
                }
            } else {
                // Clear state on logout or if user has no supermarket
                setSupermarket(null);
                setProducts([]);
                setUsers([]);
                setCustomers([]);
                setSales([]);
                setCashFlow([]);
                setReport(null);
            }
        };
        fetchData();
    }, [user]);

    // Set document theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', supermarket?.theme || 'light');
    }, [supermarket]);

    const clearError = useCallback(() => setError(null), []);

    const login = async (email: string, password: string) => {
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError("Email ou senha inválidos.");
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const register = async (ownerData: Omit<User, 'id' | 'role' | 'supermarket_id'>, supermarketData: Omit<Supermarket, 'id' | 'owner_id'>) => {
        setError(null);
        // Step 1: Sign up the new user.
        // We pass all necessary data in the 'options.data' field.
        // The database trigger 'on_auth_user_created' will handle creating the user profile,
        // the supermarket, and linking them together in a single atomic transaction.
        const { error: authError } = await supabase.auth.signUp({
            email: ownerData.email,
            password: ownerData.password as string,
            options: {
                data: {
                    name: ownerData.name,
                    role: UserRole.Owner,
                    supermarket_data: supermarketData // Pass supermarket data to the trigger
                }
            }
        });

        if (authError) {
            if (authError.message.includes('For security purposes')) {
                setError("Muitas tentativas. Por favor, aguarde um minuto e tente novamente.");
            } else if (authError.message.toLowerCase().includes('user already registered')) {
                setError("Este email já está cadastrado. Por favor, use um email diferente ou faça login.");
            } else {
                 setError(`Falha no cadastro: ${authError.message}. Verifique os dados e tente novamente.`);
            }
            return;
        }

        // On success, the onAuthStateChange listener will handle setting the user and supermarket state
        // after the user confirms their email and logs in. For now, we just let the flow complete.
        // A message to check email could be shown here if desired.
    };

    const addSale = async (saleData: Omit<Sale, 'id' | 'timestamp' | 'operator_id' | 'supermarket_id'>, operatorId: string) => {
        if (!supermarket || !user) return;
        const newSale = { ...saleData, supermarket_id: supermarket.id, operator_id: operatorId, timestamp: new Date().toISOString() };
        const { data: insertedSale, error } = await supabase.from('sales').insert(newSale).select().single();
        if (error) return console.error(error);
        if (!insertedSale) return;

        setSales(prev => [...prev, insertedSale]);

        // Deduct stock
        const stockUpdates = saleData.items.map(item =>
            supabase.rpc('decrement_stock', { p_id: item.id, p_quantity: item.quantity })
        );
        await Promise.all(stockUpdates);

        // Award points
        if (saleData.customer_id) {
            const pointsEarned = Math.floor(saleData.total); // Simplified: 1 point per R$
            await supabase.rpc('increment_points', { c_id: saleData.customer_id, p_points: pointsEarned });
        }
    };
    
    const addCashFlow = async (entry: Omit<CashFlowEntry, 'id' | 'supermarket_id' | 'operator_id'>) => {
        if (!supermarket || !user) return;
        const newEntry = { ...entry, supermarket_id: supermarket.id, operator_id: user.id };
        const { data, error } = await supabase.from('cash_flow_entries').insert(newEntry).select().single();
        if (error) return console.error(error);
        if(data) setCashFlow(prev => [...prev, data]);
    };

    const closeShift = async () => {
         if (!supermarket) return;
        const initialCash = cashFlow.find(cf => cf.type === 'initial')?.amount || 0;
        const totalSalesValue = sales.reduce((sum, s) => sum + s.total, 0);
        const totalSangria = cashFlow.filter(cf => cf.type === 'sangria').reduce((sum, s) => sum + s.amount, 0);
        const finalCash = initialCash + totalSalesValue + totalSangria;
        
        const newReport = {
            supermarket_id: supermarket.id,
            date: new Date().toLocaleDateString('pt-BR'),
            totalSales: totalSalesValue,
            initialCash,
            totalSangria: Math.abs(totalSangria),
            finalCash,
            sales,
            cashFlow
        };
        
        await supabase.from('daily_reports').insert(newReport);
        setReport(newReport as DailyReport);
        logout();
    };

    const addProduct = async (productData: Omit<Product, 'id' | 'lowStockThreshold' | 'supermarket_id'>) => {
        if (!supermarket) return;
        const newProduct = { ...productData, supermarket_id: supermarket.id, lowStockThreshold: 10 };
        const { data, error } = await supabase.from('products').insert(newProduct).select().single();
        if (error) return console.error(error);
        if (data) setProducts(prev => [...prev, data]);
    };

    const updateProduct = async (updatedProduct: Product) => {
        const { data, error } = await supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id).select().single();
        if (error) return console.error(error);
        if (data) setProducts(prev => prev.map(p => p.id === data.id ? data : p));
    };

    const deleteProduct = async (productId: string) => {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) return console.error(error);
        setProducts(prev => prev.filter(p => p.id !== productId));
    };

    const bulkUpdateProducts = async (payload: BulkUpdatePayload) => {
        const { productIds, price, stock } = payload;
        // This is complex logic that is best handled in a database function (RPC call) for atomicity and performance.
        // For client-side, we have to fetch and update, which is not ideal.
        console.warn("Bulk update should be implemented via an RPC function in Supabase for production use.");
        // Simple implementation:
        for (const id of productIds) {
            const product = products.find(p => p.id === id);
            if(product) {
                // calculate new price/stock based on payload and update product one by one
            }
        }
    };
    
    const addCustomer = async (customerData: Omit<Customer, 'id' | 'points' | 'supermarket_id'>) => {
        if (!supermarket) return null;
        const newCustomer = { ...customerData, supermarket_id: supermarket.id, points: 0 };
        const { data, error } = await supabase.from('customers').insert(newCustomer).select().single();
        if (error) { console.error(error); return null; }
        if (data) setCustomers(prev => [...prev, data]);
        return data;
    };

    const addOperator = async (operatorData: Omit<User, 'id' | 'role' | 'supermarket_id'>) => {
        setError(null);
        if (!supermarket) {
            setError("Nenhum supermercado encontrado para associar o operador.");
            return;
        }

        // Preserve the owner's session to restore it after the operator sign-up.
        const { data: { session: ownerSession } } = await supabase.auth.getSession();
        if (!ownerSession) {
            setError("Sessão do proprietário inválida. Por favor, faça login novamente.");
            return;
        }

        // Sign up the new operator. The trigger will handle creating their profile.
        // We pass the supermarket_id so the trigger can link them correctly.
        const { data: { user: newOperatorUser }, error: signUpError } = await supabase.auth.signUp({
            email: operatorData.email,
            password: operatorData.password as string,
            options: {
                data: {
                    name: operatorData.name,
                    role: UserRole.Operator,
                    supermarket_id: supermarket.id // Crucial: pass the ID to the trigger
                }
            }
        });

        // Restore the owner's session immediately.
        await supabase.auth.setSession(ownerSession);

        if (signUpError) {
            setError(`Falha ao criar operador: ${signUpError.message}`);
            return;
        }
        if (!newOperatorUser) {
            setError("Não foi possível criar o operador, usuário não retornado.");
            return;
        }
        
        const newOperatorProfile: User = {
            id: newOperatorUser.id,
            email: newOperatorUser.email!,
            name: operatorData.name,
            role: UserRole.Operator,
            supermarket_id: supermarket.id
        };

        setUsers(prev => [...prev, newOperatorProfile]);
    };

    const updateOperator = async (updatedOperator: User) => {
        const { name, id } = updatedOperator;
        const { data, error } = await supabase.from('users').update({ name }).eq('id', id).select().single();
        if (error) return console.error(error);
        if (data) setUsers(prev => prev.map(u => u.id === data.id ? data : u));
    };

    const deleteOperator = async (operatorId: string) => {
        // Deleting from auth.users requires admin privileges and should be done in a serverless function.
        // For this client-side app, we'll just remove them from our public table.
        console.warn(`Operator ${operatorId} removed from public.users table, but not from auth.users.`);
        const { error } = await supabase.from('users').delete().eq('id', operatorId);
        if (error) return console.error(error);
        setUsers(prev => prev.filter(u => u.id !== operatorId));
    };

    const updateSupermarket = async (supermarketData: Supermarket) => {
        const { data, error } = await supabase.from('supermarkets').update(supermarketData).eq('id', supermarketData.id).select().single();
        if (error) return console.error(error);
        if (data) setSupermarket(data);
    };

    const value = {
        user, users, supermarket, products, sales, cashFlow, report, customers, error,
        login, logout, register, addSale, addCashFlow, closeShift, addProduct, updateProduct,
        deleteProduct, bulkUpdateProducts, addCustomer, addOperator, updateOperator,
        deleteOperator, updateSupermarket, clearError,
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