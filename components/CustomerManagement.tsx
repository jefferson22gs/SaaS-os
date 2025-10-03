import React, { useState } from 'react';
import { Customer, FeedbackAnalysisResult } from '../types';
import { Button, Card, Input, Modal, PlusIcon, SparklesIcon } from './UI';
import { useAppContext } from '../contexts/AppContext';
import { analyzeCustomerFeedback } from '../services/geminiService';

const CustomerForm: React.FC<{
    onSave: (customer: Omit<Customer, 'id' | 'points'>) => void;
    onCancel: () => void;
}> = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, cpf });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome Completo" id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="CPF" id="cpf" type="text" value={cpf} onChange={e => setCpf(e.target.value)} required />
            <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Salvar Cliente</Button>
            </div>
        </form>
    );
};

const FeedbackAnalysisModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [feedbackText, setFeedbackText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<FeedbackAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!feedbackText.trim()) return;
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await analyzeCustomerFeedback(feedbackText);
            setAnalysisResult(JSON.parse(result));
        } catch (e) {
            console.error("Failed to analyze feedback:", e);
            setError("Não foi possível analisar o feedback. Verifique o formato e tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFeedbackText('');
        setAnalysisResult(null);
        setError(null);
        onClose();
    };
    
    const sentimentStyles = {
        Positivo: 'bg-green-100 text-green-800',
        Negativo: 'bg-red-100 text-red-800',
        Misto: 'bg-yellow-100 text-yellow-800',
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Analisar Feedback de Cliente com IA" size="lg">
            <div className="space-y-4">
                <p className="text-text-secondary">Cole o feedback do cliente abaixo para que a IA possa analisá-lo e fornecer insights.</p>
                <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={5}
                    className="w-full p-3 bg-base-200 border border-base-300 rounded-lg text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition"
                    placeholder="Ex: 'O pão estava um pouco duro hoje, mas o atendimento do caixa foi ótimo!'"
                    disabled={isLoading}
                />
                 <div className="flex justify-end">
                    <Button onClick={handleAnalyze} disabled={isLoading || !feedbackText.trim()}>
                        {isLoading ? 'Analisando...' : 'Analisar Feedback'}
                        <SparklesIcon className="w-5 h-5 ml-2"/>
                    </Button>
                </div>

                {error && <p className="text-red-500">{error}</p>}

                {analysisResult && (
                    <div className="mt-6 space-y-4 pt-4 border-t border-base-300">
                        <h3 className="text-lg font-semibold">Resultado da Análise</h3>
                        <div>
                            <span className="font-semibold">Sentimento: </span>
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${sentimentStyles[analysisResult.sentiment] || 'bg-gray-100 text-gray-800'}`}>
                                {analysisResult.sentiment}
                            </span>
                        </div>
                        <div>
                            <h4 className="font-semibold">Tópicos Chave:</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {analysisResult.keyTopics.map(topic => (
                                    <span key={topic} className="px-3 py-1 bg-base-200 rounded-full text-sm">{topic}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                             <h4 className="font-semibold">Sugestão Acionável:</h4>
                             <p className="mt-1 p-3 bg-primary/10 rounded-lg text-primary-dark">{analysisResult.suggestion}</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};


const CustomerManagementPage: React.FC = () => {
    const { customers, addCustomer } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

    const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'points'>) => {
        addCustomer(customerData);
        setIsAddModalOpen(false);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h1 className="text-3xl font-bold text-text-primary">Gerenciar Clientes</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setIsAnalysisModalOpen(true)}>
                        <SparklesIcon className="w-5 h-5"/>
                        Analisar Feedback
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <PlusIcon className="w-5 h-5"/>
                        Adicionar Cliente
                    </Button>
                </div>
            </div>

            <div className="bg-base-100 lg:shadow-md rounded-xl lg:p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="hidden lg:table-header-group bg-base-200">
                        <tr>
                            <th className="p-4 font-semibold">Nome</th>
                            <th className="p-4 font-semibold">CPF</th>
                            <th className="p-4 font-semibold">Pontos de Fidelidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => (
                            <tr key={customer.id} className="block mb-4 p-4 rounded-lg shadow-md bg-base-100 lg:table-row lg:shadow-none lg:p-0 lg:mb-0 border-b border-base-200 last:border-0">
                                <td className="p-2 lg:p-4 block lg:table-cell font-bold text-lg lg:font-medium lg:text-base">
                                    {customer.name}
                                </td>
                                <td className="p-2 lg:p-4 block lg:table-cell">
                                    <span className="font-bold lg:hidden">CPF: </span>
                                    {customer.cpf}
                                </td>
                                <td className="p-2 lg:p-4 block lg:table-cell">
                                    <span className="font-bold lg:hidden">Pontos: </span>
                                    <span className="font-bold text-primary">{customer.points}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {customers.length === 0 && (
                    <p className="text-center py-8 text-text-secondary">Nenhum cliente cadastrado.</p>
                )}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Novo Cliente">
                <CustomerForm
                    onSave={handleSaveCustomer}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
            
            <FeedbackAnalysisModal 
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
            />
        </div>
    );
};

export default CustomerManagementPage;