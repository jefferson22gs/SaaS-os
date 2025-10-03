import React, { useState, useRef } from 'react';
import { Supermarket } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { Button, Card, Input } from './UI';

const SettingsPage: React.FC = () => {
    const { supermarket, updateSupermarket } = useAppContext();
    const [formData, setFormData] = useState<Supermarket>(supermarket || { name: '', logo: null, theme: 'light' });
    const [isSaved, setIsSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!supermarket) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleThemeChange = (theme: 'light' | 'dark' | 'green') => {
        setFormData(prev => ({ ...prev, theme }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSupermarket(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000); // Hide message after 3 seconds
    };

    const themes = [
        { id: 'light', name: 'Claro' },
        { id: 'dark', name: 'Escuro' },
        { id: 'green', name: 'Verde' },
    ];


    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Configurações</h1>
            
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <h2 className="text-xl font-bold mb-4">Informações do Supermercado</h2>
                    <div className="space-y-4">
                        <Input 
                            label="Nome do Supermercado" 
                            id="name" 
                            name="name" 
                            type="text" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                        />
                         <Input 
                            label="CNPJ" 
                            id="cnpj" 
                            name="cnpj" 
                            type="text" 
                            value={formData.cnpj || ''} 
                            onChange={handleChange}
                            placeholder="00.000.000/0000-00"
                        />
                         <Input 
                            label="Inscrição Estadual" 
                            id="ie" 
                            name="ie" 
                            type="text" 
                            value={formData.ie || ''} 
                            onChange={handleChange}
                            placeholder="000000000000"
                        />
                         <Input 
                            label="Endereço Completo" 
                            id="address" 
                            name="address" 
                            type="text" 
                            value={formData.address || ''} 
                            onChange={handleChange}
                            placeholder="Rua, Número, Bairro - Cidade/UF"
                        />
                         <Input 
                            label="Telefone" 
                            id="phone" 
                            name="phone" 
                            type="text" 
                            value={formData.phone || ''} 
                            onChange={handleChange}
                            placeholder="(00) 0000-0000"
                        />
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Logo</label>
                            <div className="mt-1 flex items-center gap-4">
                                {formData.logo ? (
                                    <img src={formData.logo} alt="Logo" className="h-20 w-20 rounded-full object-cover bg-base-200" />
                                ) : (
                                    <span className="h-20 w-20 rounded-full bg-base-200 flex items-center justify-center text-text-secondary">Logo</span>
                                )}
                                <input type="file" accept="image/*" onChange={handleLogoUpload} ref={fileInputRef} className="hidden" />
                                <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                                    Alterar Logo
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-bold mb-4">Tema do Sistema</h2>
                    <div className="flex flex-wrap gap-4">
                        {themes.map(theme => (
                            <button
                                key={theme.id}
                                type="button"
                                onClick={() => handleThemeChange(theme.id as 'light' | 'dark' | 'green')}
                                className={`p-4 rounded-lg border-2 w-24 h-24 text-center transition-all ${formData.theme === theme.id ? 'border-primary ring-2 ring-primary' : 'border-base-300'}`}
                            >
                                <div className={`w-10 h-10 rounded-full mx-auto mb-2 bg-primary`}></div>
                                <span className={`font-semibold ${formData.theme === theme.id ? 'text-primary' : 'text-text-secondary'}`}>{theme.name}</span>
                            </button>
                        ))}
                    </div>
                </Card>
                
                <div className="flex justify-end items-center gap-4">
                     {isSaved && <p className="text-secondary transition-opacity duration-300">Alterações salvas com sucesso!</p>}
                    <Button type="submit" className="!py-3">Salvar Alterações</Button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;