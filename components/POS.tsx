import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Product, CartItem, CashFlowEntry, Customer, Sale, Supermarket } from '../types';
import { Button, Card, Input, Modal, PlusIcon, MinusIcon, TrashIcon, ShoppingCartIcon, CashIcon, CameraIcon, XCircleIcon, PrinterIcon } from './UI';
import { useAppContext } from '../contexts/AppContext';
import BarcodeScanner from './BarcodeScanner';

// Add QRCode to the window interface for use with the CDN script
declare const QRCode: any;

const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void; isInCart: boolean; }> = ({ product, onAddToCart, isInCart }) => (
    <Card className={`flex flex-col items-center text-center !p-4 transition-all duration-200 ${isInCart ? 'border-primary ring-2 ring-primary' : 'border-transparent'}`}>
        <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover rounded-lg mb-2" />
        <h4 className="font-semibold text-sm h-10">{product.name}</h4>
        <p className="text-lg font-bold text-primary">R$ {product.price.toFixed(2)}</p>
        <Button onClick={() => onAddToCart(product)} className="mt-2 w-full">Adicionar</Button>
    </Card>
);

const AddCustomerForm: React.FC<{ onSave: (customer: Customer) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
    const { addCustomer } = useAppContext();
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && cpf) {
            const newCustomer = addCustomer({ name, cpf });
            onSave(newCustomer);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome do Cliente" id="cust-name" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="CPF do Cliente" id="cust-cpf" value={cpf} onChange={e => setCpf(e.target.value)} required />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Salvar Cliente</Button>
            </div>
        </form>
    )
}

const ReceiptContent: React.FC<{
    sale: Sale;
    supermarket: Supermarket | null;
    operatorName?: string;
}> = ({ sale, supermarket, operatorName }) => (
    <div className="text-xs text-black font-mono bg-white p-2">
        <header className="text-center mb-2">
            <h2 className="text-sm font-bold">{supermarket?.name || 'Seu Supermercado'}</h2>
            {supermarket?.address && <p>{supermarket.address}</p>}
            {supermarket?.cnpj && <p>CNPJ: {supermarket.cnpj} IE: {supermarket.ie || ''}</p>}
            {supermarket?.phone && <p>Telefone: {supermarket.phone}</p>}
            <p className="border-y border-dashed border-black my-1 py-0.5">NÃO É DOCUMENTO FISCAL</p>
        </header>
        
        <table className="w-full mb-1">
            <thead>
                <tr className="border-b border-dashed border-black">
                    <th className="font-normal text-left">Cód</th>
                    <th className="font-normal text-left">Descrição</th>
                    <th className="font-normal text-right">Qtd</th>
                    <th className="font-normal text-right">Vl. Unit</th>
                    <th className="font-normal text-right">Vl. Total</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map(item => (
                    <tr key={item.id} className="align-top">
                        <td>{item.id.slice(-6)}</td>
                        <td>{item.name}</td>
                        <td className="text-right">{item.quantity.toFixed(3)}</td>
                        <td className="text-right">{item.price.toFixed(2)}</td>
                        <td className="text-right">{(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="border-t border-dashed border-black pt-1">
            <div className="flex justify-between">
                <span>Qtd. Total de Itens:</span>
                <span>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
                <span>VALOR TOTAL R$:</span>
                <span>{sale.total.toFixed(2)}</span>
            </div>
        </div>

        <div className="border-t border-dashed border-black pt-1 mt-1">
            <div className="flex justify-between">
                <span>Forma Pagamento:</span>
                <span>Cartão Crédito</span>
            </div>
             <div className="flex justify-between font-bold">
                <span>VALOR PAGO R$:</span>
                <span>{sale.total.toFixed(2)}</span>
            </div>
        </div>

        <footer className="text-center mt-2 pt-1 border-t border-dashed border-black">
             <p>CLIENTES DIVERSOS</p>
             <p>Vendedor: {operatorName || 'CAIXA'}</p>
            <p>{new Date(sale.timestamp).toLocaleString('pt-BR')}</p>
        </footer>
    </div>
);


const ReceiptModal: React.FC<{
    receiptData: { sale: Sale; operatorName?: string } | null;
    onClose: () => void;
    supermarket: Supermarket | null;
}> = ({ receiptData, onClose, supermarket }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        if (receiptData && canvasRef.current) {
            const { sale } = receiptData;
            const receiptText = `Compra no ${supermarket?.name || ''} - Total: R$ ${sale.total.toFixed(2)} em ${new Date(sale.timestamp).toLocaleDateString('pt-BR')}`;
            
            QRCode.toCanvas(canvasRef.current, receiptText, { width: 200, margin: 2 }, (error: any) => {
                if (error) console.error("QR Code generation failed:", error);
            });
        }
    }, [receiptData, supermarket]);

    if (!receiptData) return null;

    return (
        <Modal isOpen={!!receiptData} onClose={onClose} title="Venda Finalizada" size="md">
            <div id="printable-receipt" className="bg-white">
                 <ReceiptContent 
                    sale={receiptData.sale} 
                    supermarket={supermarket}
                    operatorName={receiptData.operatorName}
                />
            </div>
            <div className="mt-4 text-center no-print">
                <h3 className="text-lg font-semibold">Recibo Digital</h3>
                <p className="text-text-secondary text-sm mb-2">Aponte a câmera do celular para o QR Code.</p>
                <div className="flex justify-center p-2 bg-white rounded-lg border">
                    <canvas ref={canvasRef} />
                </div>
            </div>
            
            <div className="mt-6 flex justify-between gap-2 no-print">
                <Button variant="secondary" onClick={() => window.print()} className="w-full">
                    <PrinterIcon /> Imprimir Recibo
                </Button>
                <Button onClick={onClose} className="w-full">
                    Próxima Venda
                </Button>
            </div>
        </Modal>
    );
};


const POSPage: React.FC = () => {
    const { products, addSale, addCashFlow, closeShift, user, customers, supermarket } = useAppContext();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSangriaModalOpen, setSangriaModalOpen] = useState(false);
    const [isCloseShiftModalOpen, setCloseShiftModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [sangriaAmount, setSangriaAmount] = useState('');
    const [customerCpf, setCustomerCpf] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<{ sale: Sale; operatorName?: string } | null>(null);
    const [customerError, setCustomerError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);


    const findCustomer = () => {
        const found = customers.find(c => c.cpf === customerCpf);
        if (found) {
            setSelectedCustomer(found);
            setCustomerError(null);
        } else {
            setCustomerError('Cliente não encontrado.');
        }
    };


    const addToCart = useCallback((product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    }, []);

    const updateQuantity = useCallback((productId: string, change: number) => {
        setCart(prevCart => {
            const updatedCart = prevCart.map(item =>
                item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
            );
            return updatedCart.filter(item => item.quantity > 0);
        });
    }, []);
    
    const removeFromCart = useCallback((productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    }, []);
    
    const handleClearCart = useCallback(() => {
        setCart([]);
    }, []);

    const handleScan = useCallback((scannedId: string) => {
        const product = products.find(p => p.id === scannedId);
        if (product) {
            addToCart(product);
            setIsScannerOpen(false); // Close scanner on successful scan
        } else {
            // Optional: Add feedback for product not found
            console.warn(`Product with barcode ${scannedId} not found.`);
        }
    }, [products, addToCart]);

    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const handleFinalizeSale = () => {
        if (cart.length === 0 || !user) return;

        const saleForReceipt: Sale = {
            id: `receipt-${Date.now()}`,
            items: cart,
            total: cartTotal,
            customerId: selectedCustomer?.id,
            operatorId: user.id,
            timestamp: new Date().toISOString()
        };

        setReceiptData({
            sale: saleForReceipt,
            operatorName: user.name,
        });
        
        addSale({
            items: cart,
            total: cartTotal,
            customerId: selectedCustomer?.id
        }, user.id);
        
        const cashFlowEntry: CashFlowEntry = {
            id: `sale-${new Date().toISOString()}`,
            type: 'sale',
            amount: cartTotal,
            timestamp: new Date().toISOString(),
            description: `Venda #${new Date().toISOString().substring(11, 16)}`
        };
        addCashFlow(cashFlowEntry);
    };
    
    const handleNewSale = () => {
        setReceiptData(null);
        setCart([]);
        setSelectedCustomer(null);
        setCustomerCpf('');
        setCustomerError(null);
    };

    const handleSangria = () => {
        const amount = parseFloat(sangriaAmount);
        if (isNaN(amount) || amount <= 0) return;
        
        const cashFlowEntry: CashFlowEntry = {
            id: `sangria-${new Date().toISOString()}`,
            type: 'sangria',
            amount: -amount,
            timestamp: new Date().toISOString(),
            description: 'Sangria do caixa'
        };
        addCashFlow(cashFlowEntry);
        setSangriaAmount('');
        setSangriaModalOpen(false);
    };

    const handleCloseShift = () => {
        closeShift();
        setCloseShiftModalOpen(false);
    };


    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-68px)]">
            {/* Products Grid */}
            <div className="w-full lg:w-2/3 p-4 flex flex-col">
                 <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                    <div className="flex-grow">
                         <input
                            type="text"
                            placeholder="Buscar produto por nome..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full max-w-lg px-4 py-2 bg-base-100 border border-base-300 rounded-lg text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                    </div>
                    <Button variant="secondary" onClick={() => setIsScannerOpen(true)}>
                        <CameraIcon /> Ler Código de Barras
                    </Button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(product => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                onAddToCart={addToCart}
                                isInCart={cart.some(item => item.id === product.id)}
                            />
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-16 text-text-secondary">
                            <p className="font-semibold">Nenhum produto encontrado.</p>
                            <p>Tente ajustar sua busca.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart & Actions */}
            <div className="w-full lg:w-1/3 bg-base-200 p-4 flex flex-col">
                <div className="bg-base-100 p-3 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">Programa de Fidelidade</h4>
                    {selectedCustomer ? (
                        <div>
                            <p><span className="font-semibold">{selectedCustomer.name}</span></p>
                            <p className="text-sm text-text-secondary">Pontos: {selectedCustomer.points}</p>
                            <Button variant="ghost" className="text-red-500 !p-0 h-auto mt-1" onClick={() => { setSelectedCustomer(null); setCustomerCpf('')}}>Remover Cliente</Button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    placeholder="CPF do Cliente"
                                    value={customerCpf}
                                    onChange={e => {
                                        setCustomerCpf(e.target.value);
                                        setCustomerError(null);
                                    }}
                                    className="w-full px-3 py-2 text-sm bg-base-200 border border-base-300 rounded-lg"
                                />
                                <Button onClick={findCustomer} className="!py-2 text-sm">Buscar</Button>
                                <Button variant="secondary" onClick={() => setIsAddCustomerModalOpen(true)} className="!py-2 text-sm">Novo</Button>
                            </div>
                             {customerError && <p className="text-red-500 text-sm mt-1">{customerError}</p>}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold flex items-center gap-2"><ShoppingCartIcon /> Carrinho</h3>
                    {cart.length > 0 && (
                        <Button variant="ghost" className="text-sm text-red-500" onClick={handleClearCart}>
                            <XCircleIcon className="w-5 h-5" /> Limpar Carrinho
                        </Button>
                    )}
                </div>

                <div className="flex-grow overflow-y-auto">
                    {cart.length === 0 ? (
                        <p className="text-text-secondary text-center mt-8">O carrinho está vazio.</p>
                    ) : (
                        <ul className="space-y-3">
                            {cart.map(item => (
                                <li key={item.id} className="flex items-center bg-base-100 p-2 rounded-lg">
                                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-md mr-3" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{item.name}</p>
                                        <p className="text-xs text-text-secondary">R$ {item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" className="!p-1 h-6 w-6" onClick={() => updateQuantity(item.id, -1)}><MinusIcon className="w-4 h-4" /></Button>
                                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                                        <Button variant="ghost" className="!p-1 h-6 w-6" onClick={() => updateQuantity(item.id, 1)}><PlusIcon className="w-4 h-4"/></Button>
                                    </div>
                                    <Button variant="ghost" className="!p-1 h-6 w-6 ml-2 text-red-500" onClick={() => removeFromCart(item.id)}><TrashIcon className="w-4 h-4"/></Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mt-4 border-t border-base-300 pt-4">
                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                        <span>Total:</span>
                        <span>R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <Button onClick={handleFinalizeSale} disabled={cart.length === 0} className="w-full !py-3 !text-lg">
                        Finalizar Venda
                    </Button>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button variant="secondary" onClick={() => setSangriaModalOpen(true)}>
                            <CashIcon className="rotate-180"/> Sangria
                        </Button>
                        <Button variant="danger" onClick={() => setCloseShiftModalOpen(true)}>Fechar Caixa</Button>
                    </div>
                </div>
            </div>

            <ReceiptModal receiptData={receiptData} onClose={handleNewSale} supermarket={supermarket} />

            {/* Add Customer Modal */}
            <Modal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)} title="Adicionar Novo Cliente">
                <AddCustomerForm
                    onCancel={() => setIsAddCustomerModalOpen(false)}
                    onSave={(newCustomer) => {
                        setSelectedCustomer(newCustomer);
                        setCustomerCpf(newCustomer.cpf);
                        setIsAddCustomerModalOpen(false);
                    }}
                />
            </Modal>

            {/* Barcode Scanner Modal */}
             <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Escanear Código de Barras">
                <BarcodeScanner onScan={handleScan} />
                <p className="text-center text-text-secondary mt-4">Aponte a câmera para o código de barras do produto.</p>
            </Modal>

            {/* Sangria Modal */}
            <Modal isOpen={isSangriaModalOpen} onClose={() => setSangriaModalOpen(false)} title="Realizar Sangria">
                <div className="space-y-4">
                    <p>Digite o valor a ser retirado do caixa.</p>
                    <Input 
                        label="Valor da Sangria"
                        id="sangriaAmount"
                        type="number"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        value={sangriaAmount}
                        onChange={(e) => setSangriaAmount(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                         <Button variant="ghost" onClick={() => setSangriaModalOpen(false)}>Cancelar</Button>
                         <Button onClick={handleSangria}>Confirmar</Button>
                    </div>
                </div>
            </Modal>

            {/* Close Shift Modal */}
            <Modal isOpen={isCloseShiftModalOpen} onClose={() => setCloseShiftModalOpen(false)} title="Fechar Caixa">
                <div className="space-y-4">
                    <p className="text-lg">Você tem certeza que deseja fechar o caixa e encerrar o dia de trabalho?</p>
                    <p className="text-text-secondary">Esta ação irá gerar o relatório final do dia e você será desconectado.</p>
                    <div className="flex justify-end gap-2">
                         <Button variant="ghost" onClick={() => setCloseShiftModalOpen(false)}>Cancelar</Button>
                         <Button variant="danger" onClick={handleCloseShift}>Fechar Caixa</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default POSPage;