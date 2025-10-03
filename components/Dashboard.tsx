import React, { useMemo, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, ChartBarIcon, CashIcon, Button, SparklesIcon, MicrophoneIcon, ArrowTrendingUpIcon, BellAlertIcon, ExclamationTriangleIcon, Modal } from './UI';
import { useAppContext } from '../contexts/AppContext';
import { getSalesAnalysis, getDemandForecast, getSalesSpikeAlerts, getStockReplenishmentSuggestions } from '../services/geminiService';
import { DailyReport, Sale, User, UserRole, Product, DemandForecast, SalesSpikeAlert } from '../types';
import { AiAssistant } from './AiAssistant';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 rounded-full bg-primary/20 text-primary mr-4">{icon}</div>
        <div>
            <p className="text-sm text-text-secondary font-medium">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
    </Card>
);

interface AISuggestion {
    productId: string;
    productName: string;
    currentStock: number;
    salesToday: number;
    suggestedQuantity: number;
    suggestionText: string;
}

const ReplenishmentSuggestionModal: React.FC<{ product: Product | null; sales: Sale[]; isOpen: boolean; onClose: () => void; }> = ({ product, sales, isOpen, onClose }) => {
    const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSuggestion = useCallback(async () => {
        if (!product) return;
        setIsLoading(true);
        setError(null);
        setSuggestion(null);
        try {
            const result = await getStockReplenishmentSuggestions([product], sales);
            const suggestions: AISuggestion[] = JSON.parse(result);
            if (suggestions.length > 0) {
                setSuggestion(suggestions[0]);
            } else {
                setError("Não foi possível gerar uma sugestão para este item.");
            }
        } catch (e) {
            console.error("Failed to get or parse single replenishment suggestion:", e);
            setError("Ocorreu um erro ao buscar a sugestão da IA.");
        } finally {
            setIsLoading(false);
        }
    }, [product, sales]);

    React.useEffect(() => {
        if (isOpen) {
            fetchSuggestion();
        }
    }, [isOpen, fetchSuggestion]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Sugestão para ${product?.name || ''}`}>
            {isLoading && (
                <div className="text-center p-8">
                    <SparklesIcon className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
                    <p className="text-text-secondary">A IA está analisando os dados...</p>
                </div>
            )}
            {error && !isLoading && <p className="text-red-500 text-center p-8">{error}</p>}
            {!isLoading && suggestion && (
                <div className="space-y-4">
                    <div className="p-4 bg-base-200 rounded-lg text-center">
                        <p className="text-text-secondary text-sm">Sugestão de Reposição</p>
                        <p className="text-5xl font-bold text-primary my-2">{suggestion.suggestedQuantity}</p>
                        <p className="text-text-secondary text-sm">unidades</p>
                    </div>
                     <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm font-semibold text-primary-dark mb-1">Justificativa da IA:</p>
                        <p className="text-sm text-text-secondary italic">"{suggestion.suggestionText}"</p>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button onClick={onClose}>Fechar</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};


const OperationalAlerts: React.FC<{ products: Product[]; sales: Sale[] }> = ({ products, sales }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [spikeAlerts, setSpikeAlerts] = useState<SalesSpikeAlert[]>([]);
    const [selectedProductForReplenish, setSelectedProductForReplenish] = useState<Product | null>(null);

    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.stock < p.lowStockThreshold);
    }, [products]);

    const handleRefreshAlerts = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getSalesSpikeAlerts(sales);
            setSpikeAlerts(JSON.parse(result));
        } catch (e) {
            console.error("Failed to get or parse sales spike alerts:", e);
            setSpikeAlerts([]);
        } finally {
            setIsLoading(false);
        }
    }, [sales]);
    
    // Auto-refresh on component mount
    React.useEffect(() => {
        handleRefreshAlerts();
    }, [handleRefreshAlerts]);

    const hasAlerts = lowStockProducts.length > 0 || spikeAlerts.length > 0;

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BellAlertIcon className="text-primary" />
                        Centro de Alertas Operacionais
                    </h3>
                    <Button onClick={handleRefreshAlerts} disabled={isLoading} variant="ghost" className="text-sm">
                        {isLoading ? 'Analisando...' : 'Atualizar'}
                    </Button>
                </div>

                {!hasAlerts && !isLoading && (
                    <p className="text-text-secondary text-center py-4">Nenhum alerta no momento. Tudo sob controle!</p>
                )}

                <div className="space-y-4">
                    {/* Sales Spike Alerts */}
                    {spikeAlerts.map((alert, index) => (
                        <div key={`spike-${index}`} className="p-3 rounded-lg bg-amber-100 text-amber-800 flex items-start gap-3">
                            <SparklesIcon className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                            <div>
                                <p className="font-bold">Pico de Vendas Detectado!</p>
                                <p className="text-sm"><b>{alert.productName}:</b> {alert.observation}</p>
                            </div>
                        </div>
                    ))}
                    {/* Low Stock Alerts */}
                    {lowStockProducts.map(product => (
                        <div key={`stock-${product.id}`} className="p-3 rounded-lg bg-red-100 text-red-800 flex items-start gap-3">
                            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 shrink-0 mt-1"/>
                            <div>
                                <p className="font-bold">Estoque Baixo</p>
                                <p className="text-sm"><b>{product.name}</b> atingiu o nível mínimo de estoque ({product.stock} / {product.lowStockThreshold}). Considere repor o item.</p>
                                <button 
                                    onClick={() => setSelectedProductForReplenish(product)}
                                    className="text-sm font-semibold text-red-900 hover:underline mt-1 flex items-center gap-1"
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                    Sugerir Reposição com IA
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            <ReplenishmentSuggestionModal
                isOpen={!!selectedProductForReplenish}
                onClose={() => setSelectedProductForReplenish(null)}
                product={selectedProductForReplenish}
                sales={sales}
            />
        </>
    );
};


const SalesOverTimeChart: React.FC<{ data: Sale[] }> = ({ data }) => {
    const chartData = useMemo(() => {
        const salesByHour: { [hour: number]: number } = {};
        data.forEach(sale => {
            const hour = new Date(sale.timestamp).getHours();
            if (!salesByHour[hour]) {
                salesByHour[hour] = 0;
            }
            salesByHour[hour] += sale.total;
        });
        
        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            Vendas: salesByHour[i] || 0,
        }));
    }, [data]);

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4">Vendas por Hora</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)"/>
                    <XAxis dataKey="hour" stroke="var(--color-text-secondary)" />
                    <YAxis stroke="var(--color-text-secondary)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-base-200)', border: '1px solid var(--color-base-300)' }}/>
                    <Legend />
                    <Line type="monotone" dataKey="Vendas" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)' }} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};

const TopProductsChart: React.FC<{ data: Sale[] }> = ({ data }) => {
    const topProducts = useMemo(() => {
        const productCount: { [key: string]: { name: string; quantity: number } } = {};
        data.forEach(sale => {
            sale.items.forEach(item => {
                if (!productCount[item.id]) {
                    productCount[item.id] = { name: item.name, quantity: 0 };
                }
                productCount[item.id].quantity += item.quantity;
            });
        });
        return Object.values(productCount).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    }, [data]);

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4">Produtos Mais Vendidos</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)"/>
                    <XAxis type="number" stroke="var(--color-text-secondary)" />
                    <YAxis type="category" dataKey="name" width={100} stroke="var(--color-text-secondary)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-base-200)', border: '1px solid var(--color-base-300)' }}/>
                    <Legend />
                    <Bar dataKey="quantity" name="Quantidade Vendida" fill="var(--color-secondary)" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
};

const OperatorPerformanceChart: React.FC<{ sales: Sale[], operators: User[] }> = ({ sales, operators }) => {
    const performanceData = useMemo(() => {
        const salesByOperator: { [operatorId: string]: number } = {};
        sales.forEach(sale => {
            salesByOperator[sale.operatorId] = (salesByOperator[sale.operatorId] || 0) + sale.total;
        });

        return Object.keys(salesByOperator).map(operatorId => {
            const operator = operators.find(op => op.id === operatorId);
            return {
                name: operator ? operator.name : 'Desconhecido',
                totalVendas: salesByOperator[operatorId]
            };
        }).sort((a, b) => b.totalVendas - a.totalVendas);
    }, [sales, operators]);

    if (performanceData.length === 0) return null;

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4">Desempenho por Operador</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)"/>
                    <XAxis dataKey="name" stroke="var(--color-text-secondary)"/>
                    <YAxis stroke="var(--color-text-secondary)"/>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-base-200)', border: '1px solid var(--color-base-300)' }}/>
                    <Legend />
                    <Bar dataKey="totalVendas" name="Total de Vendas (R$)" fill="var(--color-accent)" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}

const AiAnalysis: React.FC<{ report: DailyReport }> = ({ report }) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateAnalysis = useCallback(async () => {
        setIsLoading(true);
        const result = await getSalesAnalysis(report);
        setAnalysis(result);
        setIsLoading(false);
    }, [report]);
    
    // Function to render markdown-like text
    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, index) => {
            if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={index} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>;
            }
            if (line.trim().startsWith('-') || line.trim().match(/^\d\./)) {
                return <li key={index} className="ml-4 list-disc">{line.replace(/^- |^\d\. /, '')}</li>;
            }
            return <p key={index}>{line}</p>;
        });
    };

    return (
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
             <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <SparklesIcon className="text-primary" />
                Análise com Inteligência Artificial
             </h3>
             <p className="text-text-secondary mb-4">Obtenha insights e sugestões para o seu negócio com base nos dados do dia.</p>
             <Button onClick={handleGenerateAnalysis} disabled={isLoading}>
                {isLoading ? 'Analisando...' : 'Gerar Análise Estratégica'}
             </Button>
             {analysis && (
                <div className="mt-4 p-4 bg-base-100 rounded-lg prose max-w-none">
                    {renderMarkdown(analysis)}
                </div>
             )}
        </Card>
    );
};

const DemandForecastAnalysis: React.FC<{ products: Product[], sales: Sale[] }> = ({ products, sales }) => {
    const [forecast, setForecast] = useState<DemandForecast[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateForecast = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setForecast([]);
        try {
            const result = await getDemandForecast(products, sales);
            const parsedResult = JSON.parse(result);
            setForecast(parsedResult);
        } catch (e) {
            console.error("Failed to get or parse demand forecast:", e);
            setError("Não foi possível gerar a previsão. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }, [products, sales]);

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowTrendingUpIcon className="text-secondary" />
                Previsão de Demanda para Amanhã
            </h3>
            <p className="text-text-secondary mb-4">Utilize a IA para prever quais produtos terão maior probabilidade de venda no próximo dia útil e prepare seu estoque.</p>
            <Button onClick={handleGenerateForecast} disabled={isLoading} variant="secondary">
                {isLoading ? 'Calculando...' : 'Gerar Previsão de Demanda'}
            </Button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {forecast.length > 0 && (
                <div className="mt-4 space-y-3">
                    {forecast.map((item, index) => (
                        <div key={index} className="p-3 bg-base-200 rounded-lg">
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-text-primary">{item.productName}</p>
                                <p className="font-bold text-lg text-secondary">{item.predictedDemand}</p>
                            </div>
                            <p className="text-sm text-text-secondary italic">"{item.reasoning}"</p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};


const DashboardPage: React.FC = () => {
    const { report, users, products } = useAppContext();
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    
    const operators = useMemo(() => users.filter(u => u.role === UserRole.Operator), [users]);

    if (!report) {
        return (
            <div className="p-8">
                <Card>
                    <h2 className="text-2xl font-bold">Nenhum relatório diário encontrado</h2>
                    <p className="text-text-secondary mt-2">Um operador precisa fechar o caixa para que os dados do dashboard sejam exibidos.</p>
                </Card>
            </div>
        )
    }

    const totalSales = report.totalSales;
    const totalTransactions = report.sales.length;
    const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    return (
        <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 gap-6 relative">
            <h1 className="text-3xl font-bold text-text-primary">Dashboard do Proprietário</h1>
            
            <OperationalAlerts products={products} sales={report.sales} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Vendas Totais do Dia" value={`R$ ${totalSales.toFixed(2)}`} icon={<ChartBarIcon />} />
                <StatCard title="Total de Transações" value={totalTransactions.toString()} icon={<CashIcon className="rotate-90"/>} />
                <StatCard title="Ticket Médio" value={`R$ ${averageTicket.toFixed(2)}`} icon={<CashIcon />} />
            </div>

            <DemandForecastAnalysis products={products} sales={report.sales} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesOverTimeChart data={report.sales} />
                <TopProductsChart data={report.sales} />
            </div>

            <OperatorPerformanceChart sales={report.sales} operators={operators} />
            
            <AiAnalysis report={report} />

            <button
              onClick={() => setIsAssistantOpen(true)}
              className="fixed bottom-8 right-8 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-transform hover:scale-110 z-50"
              aria-label="Abrir Assistente de IA"
            >
                <MicrophoneIcon className="w-8 h-8" />
            </button>

            <AiAssistant
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                report={report}
            />
        </div>
    );
};

export default DashboardPage;
