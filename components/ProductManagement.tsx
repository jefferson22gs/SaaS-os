import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Product } from '../types';
import { Button, Card, Input, Modal, PencilIcon, TrashIcon, PlusIcon, SparklesIcon, ExclamationTriangleIcon } from './UI';
import { useAppContext } from '../contexts/AppContext';
import { getStockReplenishmentSuggestions, getPromotionSuggestions } from '../services/geminiService';


interface AISuggestion {
    productId: string;
    productName: string;
    currentStock: number;
    salesToday: number;
    suggestedQuantity: number;
    suggestionText: string;
}

const ProductForm: React.FC<{
    product: Omit<Product, 'id'> | Product | null;
    onSave: (product: Omit<Product, 'id'> | Product) => void;
    onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        price: product?.price || 0,
        stock: product?.stock || 0,
        imageUrl: product?.imageUrl || 'https://placehold.co/150x150/f1f5f9/1e293b?text=Produto',
        lowStockThreshold: product?.lowStockThreshold || 10,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = product && 'id' in product ? { ...formData, id: product.id } : formData;
        onSave(dataToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome do Produto" id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
            <Input label="Preço" id="price" name="price" type="number" value={formData.price} onChange={handleChange} required step="0.01" min="0" />
            <Input label="Estoque" id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} required step="1" min="0" />
            <Input label="Alerta de Estoque Baixo" id="lowStockThreshold" name="lowStockThreshold" type="number" value={formData.lowStockThreshold} onChange={handleChange} required step="1" min="0" />
            <Input label="URL da Imagem" id="imageUrl" name="imageUrl" type="text" value={formData.imageUrl} onChange={handleChange} required />
            <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Salvar Produto</Button>
            </div>
        </form>
    );
};

const BulkEditForm: React.FC<{
    selectedCount: number;
    onSave: (data: {
        price?: { operation: string; value: number };
        stock?: { operation: string; value: number };
    }) => void;
    onCancel: () => void;
}> = ({ selectedCount, onSave, onCancel }) => {
    const [changePrice, setChangePrice] = useState(false);
    const [priceOperation, setPriceOperation] = useState<'set' | 'increase_value' | 'decrease_value' | 'increase_percent' | 'decrease_percent'>('set');
    const [priceValue, setPriceValue] = useState('');

    const [changeStock, setChangeStock] = useState(false);
    const [stockOperation, setStockOperation] = useState<'set' | 'increase_value' | 'decrease_value'>('set');
    const [stockValue, setStockValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: {
            price?: { operation: string; value: number };
            stock?: { operation: string; value: number };
        } = {};

        if (changePrice && priceValue !== '') {
            payload.price = { operation: priceOperation, value: parseFloat(priceValue) };
        }
        if (changeStock && stockValue !== '') {
            payload.stock = { operation: stockOperation, value: parseInt(stockValue, 10) };
        }

        if (Object.keys(payload).length > 0) {
            onSave(payload);
        } else {
            onCancel();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-text-secondary">Você está prestes a modificar {selectedCount} produtos. As alterações aplicadas aqui irão sobrescrever os valores existentes para todos os produtos selecionados.</p>
            
            {/* Price Section */}
            <div className="p-4 border border-base-300 rounded-lg space-y-4">
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input type="checkbox" className="rounded" checked={changePrice} onChange={e => setChangePrice(e.target.checked)} />
                    <span className="font-semibold">Alterar Preço</span>
                </label>
                {changePrice && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="priceOperation" className="block text-sm font-medium text-text-secondary mb-1">Operação</label>
                            <select id="priceOperation" value={priceOperation} onChange={e => setPriceOperation(e.target.value as any)} className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-lg text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition">
                                <option value="set">Definir novo valor</option>
                                <option value="increase_value">Aumentar por valor</option>
                                <option value="decrease_value">Diminuir por valor</option>
                                <option value="increase_percent">Aumentar por %</option>
                                <option value="decrease_percent">Diminuir por %</option>
                            </select>
                        </div>
                        <Input label="Valor" id="priceValue" type="number" value={priceValue} onChange={e => setPriceValue(e.target.value)} required step="0.01" min="0" />
                    </div>
                )}
            </div>

            {/* Stock Section */}
            <div className="p-4 border border-base-300 rounded-lg space-y-4">
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input type="checkbox" className="rounded" checked={changeStock} onChange={e => setChangeStock(e.target.checked)} />
                    <span className="font-semibold">Alterar Estoque</span>
                </label>
                {changeStock && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="stockOperation" className="block text-sm font-medium text-text-secondary mb-1">Operação</label>
                            <select id="stockOperation" value={stockOperation} onChange={e => setStockOperation(e.target.value as any)} className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-lg text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition">
                                <option value="set">Definir novo valor</option>
                                <option value="increase_value">Aumentar por valor</option>
                                <option value="decrease_value">Diminuir por valor</option>
                            </select>
                        </div>
                        <Input label="Valor" id="stockValue" type="number" value={stockValue} onChange={e => setStockValue(e.target.value)} required step="1" />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={!changePrice && !changeStock}>Aplicar Mudanças</Button>
            </div>
        </form>
    );
};


const PromotionAssistantModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { products, sales } = useAppContext();
    const [messages, setMessages] = useState<{ sender: 'user' | 'ai', text: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, index) => {
            if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={index} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>;
            }
             if (line.startsWith('###')) {
                return <h3 key={index} className="text-lg font-semibold mt-3 mb-1">{line.replace(/###/g, '')}</h3>;
            }
            if (line.trim().startsWith('-')) {
                return <li key={index} className="ml-4 list-disc">{line.replace(/^- /, '')}</li>;
            }
            return <p key={index} className="my-1">{line}</p>;
        });
    };

    const handleQuery = async (query: string) => {
        if (!query.trim()) return;
        setMessages(prev => [...prev, { sender: 'user', text: query }]);
        setIsLoading(true);

        const aiResponse = await getPromotionSuggestions(query, products, sales);

        setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        setIsLoading(false);
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = formData.get('query') as string;
        handleQuery(query);
        e.currentTarget.reset();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assistente de Promoções com IA" size="2xl">
            <div className="flex flex-col h-[70vh]">
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-base-200 rounded-lg">
                    {messages.length === 0 && (
                         <div className="text-center text-text-secondary h-full flex flex-col justify-center items-center">
                            <SparklesIcon className="w-12 h-12 text-primary/50 mx-auto mb-4" />
                            <p className="font-semibold">Peça sugestões de marketing!</p>
                            <p className="text-sm">Use a IA para criar promoções e combos.</p>
                            <p className="text-xs mt-2">Ex: "Crie um combo de café da manhã"</p>
                        </div>
                    )}
                     {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-4 rounded-2xl prose max-w-none ${msg.sender === 'user' ? 'bg-primary text-white prose-invert' : 'bg-base-100 text-text-primary shadow-sm'}`}>
                           {msg.sender === 'ai' ? <div>{renderMarkdown(msg.text)}</div> : msg.text}
                        </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                        <div className="max-w-xs p-3 rounded-2xl bg-base-100 text-text-primary flex items-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span> 
                            Criando sugestão...
                        </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                 <div className="mt-4 pt-4 border-t border-base-300">
                    <form className="flex items-center gap-2" onSubmit={handleFormSubmit}>
                        <input
                            type="text"
                            name="query"
                            className="w-full px-4 py-2 bg-base-100 border border-base-300 rounded-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition"
                            placeholder="Descreva a promoção que você quer..."
                            disabled={isLoading}
                        />
                         <Button type="submit" disabled={isLoading} className="!p-3 rounded-full">
                            <SparklesIcon className="w-6 h-6 text-white"/>
                        </Button>
                    </form>
                </div>
            </div>
        </Modal>
    );
};


const ProductManagementPage: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct, bulkUpdateProducts, sales } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isPromoAssistantOpen, setIsPromoAssistantOpen] = useState(false);
    const [isConfirmBulkEditOpen, setIsConfirmBulkEditOpen] = useState(false);
    const bulkEditPayloadRef = useRef<any>(null);


    const hasLowStockProducts = useMemo(() => products.some(p => p.stock < p.lowStockThreshold), [products]);

    const handleGenerateSuggestions = useCallback(async () => {
        setIsSuggestionsModalOpen(true);
        setIsLoadingSuggestions(true);
        try {
            const result = await getStockReplenishmentSuggestions(products, sales);
            setSuggestions(JSON.parse(result));
        } catch (error) {
            console.error("Failed to parse AI suggestions:", error);
            setSuggestions([]); // Or show an error message
        }
        setIsLoadingSuggestions(false);
    }, [products, sales]);


    const handleSelectProduct = (productId: string) => {
        setSelectedProducts(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(productId)) {
                newSelection.delete(productId);
            } else {
                newSelection.add(productId);
            }
            return newSelection;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProducts(new Set(products.map(p => p.id)));
        } else {
            setSelectedProducts(new Set());
        }
    };

    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = (productData: Omit<Product, 'id'> | Product) => {
        if ('id' in productData) {
            updateProduct(productData as Product);
        } else {
            addProduct(productData as Omit<Product, 'id' | 'lowStockThreshold'>);
        }
        handleCloseModal();
    };
    
    const handleDelete = () => {
        if (deletingProduct) {
            deleteProduct(deletingProduct.id);
            setDeletingProduct(null);
        }
    };

    const handleBulkUpdate = (data: any) => {
        bulkEditPayloadRef.current = data;
        setIsBulkEditModalOpen(false);
        setIsConfirmBulkEditOpen(true);
    };

    const confirmBulkUpdate = () => {
        if (bulkEditPayloadRef.current) {
            bulkUpdateProducts({
                productIds: Array.from(selectedProducts),
                ...bulkEditPayloadRef.current
            });
        }
        setIsConfirmBulkEditOpen(false);
        setSelectedProducts(new Set());
        bulkEditPayloadRef.current = null;
    };


    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h1 className="text-3xl font-bold text-text-primary">Gerenciar Produtos</h1>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                     {selectedProducts.size > 0 && (
                        <Button variant="secondary" onClick={() => setIsBulkEditModalOpen(true)}>
                            <PencilIcon className="w-5 h-5"/>
                            Editar ({selectedProducts.size})
                        </Button>
                    )}
                     <Button variant="secondary" onClick={handleGenerateSuggestions} disabled={!hasLowStockProducts} title={!hasLowStockProducts ? "Nenhum produto com baixo estoque" : "Gerar sugestões de reposição com IA"}>
                        <SparklesIcon className="w-5 h-5"/>
                        Reposição
                    </Button>
                    <Button variant="secondary" onClick={() => setIsPromoAssistantOpen(true)}>
                        <SparklesIcon className="w-5 h-5"/>
                        Promoções
                    </Button>
                    <Button onClick={handleOpenAddModal}>
                        <PlusIcon className="w-5 h-5"/>
                        Adicionar Produto
                    </Button>
                </div>
            </div>

            <div className="bg-base-100 lg:shadow-md rounded-xl lg:p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="hidden lg:table-header-group bg-base-200">
                        <tr>
                            <th className="p-4 w-4">
                                <input 
                                    type="checkbox"
                                    className="rounded"
                                    onChange={handleSelectAll}
                                    checked={products.length > 0 && selectedProducts.size === products.length}
                                    ref={el => {
                                        if (el) { el.indeterminate = selectedProducts.size > 0 && selectedProducts.size < products.length; }
                                    }}
                                />
                            </th>
                            <th className="p-4 font-semibold">Produto</th>
                            <th className="p-4 font-semibold">Preço</th>
                            <th className="p-4 font-semibold">Estoque</th>
                            <th className="p-4 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} className={`block mb-4 p-4 rounded-lg shadow-md bg-base-100 lg:table-row lg:shadow-none lg:p-0 lg:mb-0 border-b border-base-200 last:border-0 ${selectedProducts.has(product.id) ? 'bg-primary/10' : ''}`}>
                                <td className="p-2 lg:p-4 block lg:table-cell lg:w-4">
                                    <div className="flex items-center">
                                         <input 
                                            type="checkbox"
                                            className="rounded"
                                            checked={selectedProducts.has(product.id)}
                                            onChange={() => handleSelectProduct(product.id)}
                                        />
                                        <div className="flex items-center gap-4 lg:hidden ml-4">
                                            <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md"/>
                                            <span className="font-bold">{product.name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden lg:table-cell p-4">
                                    <div className="flex items-center gap-4">
                                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md"/>
                                        <span className="font-medium">{product.name}</span>
                                    </div>
                                </td>
                                <td className="p-2 lg:p-4 block lg:table-cell">
                                    <span className="font-bold lg:hidden">Preço: </span>
                                    R$ {product.price.toFixed(2)}
                                </td>
                                <td className="p-2 lg:p-4 block lg:table-cell">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold lg:hidden">Estoque: </span>
                                        {product.stock < product.lowStockThreshold && (
                                            <div title={`Estoque baixo! Limite: ${product.lowStockThreshold}`}>
                                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 inline-block" />
                                            </div>
                                        )}
                                        <span>{product.stock}</span>
                                    </div>
                                </td>
                                <td className="p-2 lg:p-4 block lg:table-cell">
                                     <span className="font-bold lg:hidden">Ações: </span>
                                    <div className="flex gap-2 mt-2 lg:mt-0">
                                        <Button variant="ghost" className="!p-2" aria-label={`Editar ${product.name}`} onClick={() => handleOpenEditModal(product)}>
                                            <PencilIcon className="w-5 h-5"/>
                                        </Button>
                                        <Button variant="ghost" className="!p-2 text-red-500" aria-label={`Excluir ${product.name}`} onClick={() => setDeletingProduct(product)}>
                                            <TrashIcon className="w-5 h-5"/>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {products.length === 0 && (
                    <p className="text-center py-8 text-text-secondary">Nenhum produto cadastrado.</p>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'Editar Produto' : 'Adicionar Produto'}>
                <ProductForm
                    product={editingProduct}
                    onSave={handleSaveProduct}
                    onCancel={handleCloseModal}
                />
            </Modal>
            
            <Modal isOpen={!!deletingProduct} onClose={() => setDeletingProduct(null)} title="Confirmar Exclusão">
                <div className="space-y-4">
                    <p>Você tem certeza que deseja excluir o produto <strong>{deletingProduct?.name}</strong>?</p>
                    <p className="text-sm text-text-secondary">Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setDeletingProduct(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete}>Excluir</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} title={`Editar ${selectedProducts.size} Produtos em Massa`}>
                <BulkEditForm
                    selectedCount={selectedProducts.size}
                    onSave={handleBulkUpdate}
                    onCancel={() => setIsBulkEditModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={isConfirmBulkEditOpen} onClose={() => setIsConfirmBulkEditOpen(false)} title="Confirmar Alteração em Massa">
                <div className="space-y-4">
                    <p>Você tem certeza que deseja aplicar as alterações a <strong>{selectedProducts.size}</strong> produtos selecionados?</p>
                     <p className="text-sm text-text-secondary">Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsConfirmBulkEditOpen(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={confirmBulkUpdate}>Confirmar Alterações</Button>
                    </div>
                </div>
            </Modal>

             <Modal isOpen={isSuggestionsModalOpen} onClose={() => setIsSuggestionsModalOpen(false)} title="Sugestões de Reposição de Estoque" size="2xl">
                 {isLoadingSuggestions ? (
                    <div className="text-center p-8">
                        <SparklesIcon className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
                        <p className="text-text-secondary">A IA está analisando seus dados para gerar as melhores sugestões...</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                        <p className="text-text-secondary">A inteligência artificial analisou os produtos com baixo estoque e as vendas do dia para sugerir as seguintes reposições:</p>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th className="p-3 font-semibold">Produto</th>
                                        <th className="p-3 font-semibold">Estoque Atual</th>
                                        <th className="p-3 font-semibold">Vendas Hoje</th>
                                        <th className="p-3 font-semibold text-primary">Sugestão de Reposição</th>
                                        <th className="p-3 font-semibold">Justificativa da IA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suggestions.map(sug => (
                                        <tr key={sug.productId} className="border-b border-base-200 last:border-0">
                                            <td className="p-3 font-medium">{sug.productName}</td>
                                            <td className="p-3 text-center">{sug.currentStock}</td>
                                            <td className="p-3 text-center">{sug.salesToday}</td>
                                            <td className="p-3 text-center font-bold text-lg text-primary">{sug.suggestedQuantity}</td>
                                            <td className="p-3 text-sm text-text-secondary">{sug.suggestionText}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 )}
            </Modal>

            <PromotionAssistantModal 
                isOpen={isPromoAssistantOpen}
                onClose={() => setIsPromoAssistantOpen(false)}
            />
        </div>
    );
};

export default ProductManagementPage;