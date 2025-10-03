import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Button, Card, Input, Modal, PencilIcon, TrashIcon, PlusIcon } from './UI';
import { useAppContext } from '../contexts/AppContext';

const OperatorForm: React.FC<{
    operator: Omit<User, 'id' | 'role'> | User | null;
    onSave: (operator: Omit<User, 'id' | 'role'> | User) => void;
    onCancel: () => void;
    error: string | null;
}> = ({ operator, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({
        name: operator?.name || '',
        email: operator?.email || '',
        password: operator?.password || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = operator && 'id' in operator ? { ...formData, id: operator.id, role: UserRole.Operator } : formData;
        onSave(dataToSave as any);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</p>}
            <Input label="Nome do Operador" id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
            <Input label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <Input label="Senha" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder={operator ? 'Deixe em branco para não alterar' : ''} />
            <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
            </div>
        </form>
    );
};

const OperatorManagementPage: React.FC = () => {
    const { users, addOperator, updateOperator, deleteOperator, error, clearError } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOperator, setEditingOperator] = useState<User | null>(null);
    const [deletingOperator, setDeletingOperator] = useState<User | null>(null);

    const operators = users.filter(u => u.role === UserRole.Operator);

    useEffect(() => {
        if (isModalOpen) {
            clearError();
        }
    }, [isModalOpen, clearError]);

    const handleOpenAddModal = () => {
        setEditingOperator(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (operator: User) => {
        setEditingOperator(operator);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOperator(null);
    };

    const handleSaveOperator = (operatorData: Omit<User, 'id' | 'role'> | User) => {
        if ('id' in operatorData) {
            // If password is not provided on edit, keep the old one
            const originalOperator = operators.find(o => o.id === operatorData.id);
            if (!operatorData.password && originalOperator) {
                operatorData.password = originalOperator.password;
            }
            updateOperator(operatorData as User);
        } else {
            addOperator(operatorData as Omit<User, 'id' | 'role'>);
        }
        // Only close modal if there's no error
        if (!error) {
            handleCloseModal();
        }
    };

    const handleDelete = () => {
        if (deletingOperator) {
            deleteOperator(deletingOperator.id);
            setDeletingOperator(null);
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Gerenciar Operadores</h1>
                <Button onClick={handleOpenAddModal}>
                    <PlusIcon className="w-5 h-5" />
                    Adicionar Operador
                </Button>
            </div>

            <div className="bg-base-100 lg:shadow-md rounded-xl lg:p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="hidden lg:table-header-group bg-base-200">
                        <tr>
                            <th className="p-4 font-semibold">Nome</th>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operators.map(op => (
                            <tr key={op.id} className="block mb-4 p-4 rounded-lg shadow-md bg-base-100 lg:table-row lg:shadow-none lg:p-0 lg:mb-0 border-b border-base-200 last:border-0">
                                <td className="p-2 lg:p-4 block lg:table-cell font-bold text-lg lg:font-medium lg:text-base">
                                    {op.name}
                                </td>
                                <td className="p-2 lg:p-4 block lg:table-cell">
                                     <span className="font-bold lg:hidden">Email: </span>
                                    {op.email}
                                </td>
                                <td className="p-2 lg:p-4 block lg:table-cell">
                                    <span className="font-bold lg:hidden">Ações: </span>
                                    <div className="flex gap-2 mt-2 lg:mt-0">
                                        <Button variant="ghost" className="!p-2" aria-label={`Editar ${op.name}`} onClick={() => handleOpenEditModal(op)}>
                                            <PencilIcon className="w-5 h-5" />
                                        </Button>
                                        <Button variant="ghost" className="!p-2 text-red-500" aria-label={`Excluir ${op.name}`} onClick={() => setDeletingOperator(op)}>
                                            <TrashIcon className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {operators.length === 0 && (
                    <p className="text-center py-8 text-text-secondary">Nenhum operador cadastrado.</p>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingOperator ? 'Editar Operador' : 'Adicionar Operador'}>
                <OperatorForm
                    operator={editingOperator}
                    onSave={handleSaveOperator}
                    onCancel={handleCloseModal}
                    error={error}
                />
            </Modal>

            <Modal isOpen={!!deletingOperator} onClose={() => setDeletingOperator(null)} title="Confirmar Exclusão">
                <div className="space-y-4">
                    <p>Você tem certeza que deseja excluir o operador <strong>{deletingOperator?.name}</strong>?</p>
                    <p className="text-sm text-text-secondary">Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setDeletingOperator(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete}>Excluir</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OperatorManagementPage;