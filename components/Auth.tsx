

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Input, Card, ExclamationTriangleIcon } from './UI';
import { useAppContext } from '../contexts/AppContext';

export const LoginPage: React.FC = () => {
    const { login, error, clearError } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        clearError();
    }, [clearError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        await login(email, password);
        setLoading(false); // Only sets on error, which is fine as component unmounts on success
    };

    const isSetupError = error === 'SETUP_REQUIRED:PROXY_URL';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
            {isSetupError && (
                 <Card className="w-full max-w-md mb-6 border-2 border-amber-400 bg-amber-50">
                    <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">Configuração Incompleta</h2>
                            <p className="text-text-secondary mt-2">O aplicativo não pode se conectar ao banco de dados porque a URL do proxy do Supabase não foi configurada.</p>
                            
                            <h3 className="text-lg font-bold text-text-primary mt-3 mb-1">Por quê?</h3>
                            <p className="text-text-secondary">Devido a atualizações recentes no Supabase, o acesso direto ao banco de dados pelo navegador é bloqueado por segurança (CORS). A solução é usar um "proxy" gratuito.</p>
                            
                            <h3 className="text-lg font-bold text-text-primary mt-3 mb-1">Como Resolver:</h3>
                            <ol className="list-decimal list-outside space-y-1 my-2 pl-5 text-text-secondary">
                                <li>Crie um proxy (recomendamos um <a href="https://workers.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Cloudflare Worker</a> gratuito).</li>
                                <li>Use o código de proxy que foi fornecido em nossa conversa.</li>
                                <li>Após publicar o worker, você receberá uma URL.</li>
                                <li>Abra o arquivo <code className="bg-base-200 px-1 py-0.5 rounded text-sm">'services/supabaseClient.ts'</code>.</li>
                                <li>Substitua o placeholder <code className="bg-base-200 px-1 py-0.5 rounded text-sm">'YOUR_PROXY_WORKER_URL_HERE'</code> pela sua URL.</li>
                            </ol>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-6 text-text-primary">Login</h2>
                {error && !isSetupError && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Email" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isSetupError} />
                    <Input label="Senha" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isSetupError} />
                    <Button type="submit" className="w-full !py-3" disabled={loading || isSetupError}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>
                 <p className="text-center mt-4 text-sm text-text-secondary">
                    Não tem uma conta de proprietário? <a href="#/register" className="font-semibold text-primary hover:underline">Cadastre-se</a>
                </p>
            </Card>
        </div>
    );
};

export const RegisterPage: React.FC = () => {
    const { register, error, clearError } = useAppContext();
    const [ownerName, setOwnerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [supermarketName, setSupermarketName] = useState('');
    const [logo, setLogo] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark' | 'green'>('light');
    const [cnpj, setCnpj] = useState('');
    const [ie, setIe] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        clearError();
    }, [clearError]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        clearError();
        const success = await register(
            { name: ownerName, email, password },
            { name: supermarketName, logo, theme, cnpj, ie, address, phone }
        );
        setLoading(false);
        if (success) {
            setIsSuccess(true);
        }
    };

    if (isSuccess) {
        return (
           <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
               <Card className="w-full max-w-lg text-center p-8">
                   <h2 className="text-3xl font-bold mb-4 text-secondary">Cadastro realizado com sucesso!</h2>
                   <p className="text-text-secondary mb-6 text-lg">
                       Enviamos um email de confirmação para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
                   </p>
                   <a href="#/" className="font-semibold text-primary hover:underline">Voltar para a tela de Login</a>
               </Card>
           </div>
       );
   }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-3xl font-bold text-center mb-6 text-text-primary">Cadastro de Proprietário</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-base-300 pb-2">Dados do Supermercado</h3>
                    <Input label="Nome do Supermercado" id="supermarketName" type="text" value={supermarketName} onChange={e => setSupermarketName(e.target.value)} required />
                    <Input label="CNPJ" id="cnpj" type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00"/>
                    <Input label="Inscrição Estadual" id="ie" type="text" value={ie} onChange={e => setIe(e.target.value)} placeholder="000000000000"/>
                    <Input label="Endereço Completo" id="address" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, Número, Bairro - Cidade/UF"/>
                    <Input label="Telefone" id="phone" type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 0000-0000"/>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Logo do Supermercado</label>
                        <div className="mt-1 flex items-center gap-4">
                             {logo ? (
                                <img src={logo} alt="Preview" className="h-16 w-16 rounded-full object-cover" />
                             ) : (
                                <span className="h-16 w-16 rounded-full bg-base-200 flex items-center justify-center text-text-secondary">Logo</span>
                             )}
                            <input type="file" accept="image/*" onChange={handleLogoUpload} ref={fileInputRef} className="hidden" />
                            <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                                Enviar Logo
                            </Button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Tema do Sistema</label>
                        <div className="flex gap-4 mt-2">
                           {['light', 'dark', 'green'].map(themeOption => (
                               <button type="button" key={themeOption} onClick={() => setTheme(themeOption as any)} className={`capitalize p-2 w-20 rounded-lg border-2 ${theme === themeOption ? 'border-primary' : 'border-base-300'}`}>
                                   {themeOption}
                               </button>
                           ))}
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold border-b border-base-300 pb-2 pt-4">Seus Dados</h3>
                    <Input label="Seu Nome Completo" id="name" type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} required />
                    <Input label="Email" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Input label="Senha" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />

                    <Button type="submit" className="w-full !py-3 mt-4" disabled={loading}>
                        {loading ? 'Criando Conta...' : 'Criar Conta'}
                    </Button>
                </form>
                 <p className="text-center mt-4 text-sm text-text-secondary">
                    Já tem uma conta? <a href="#/" className="font-semibold text-primary hover:underline">Faça Login</a>
                </p>
            </Card>
        </div>
    );
};
