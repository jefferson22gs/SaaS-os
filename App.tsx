import React, { useState, useEffect } from 'react';
import { useAppContext } from './contexts/AppContext';
import { UserRole } from './types';
import { LoginPage, RegisterPage } from './components/Auth';
import OwnerLayout from './components/OwnerLayout';
import POSPage from './components/POS';
import { Header } from './components/UI';

const App: React.FC = () => {
    const { user } = useAppContext();
    const [hash, setHash] = useState(window.location.hash);

    useEffect(() => {
        const handleHashChange = () => {
            setHash(window.location.hash);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    if (!user) {
        if (hash === '#/register') {
            return <RegisterPage />;
        }
        return <LoginPage />;
    }

    const renderContent = () => {
        switch (user.role) {
            case UserRole.Owner:
                return <OwnerLayout />;
            case UserRole.Operator:
                return <POSPage />;
            default:
                return null;
        }
    };


    return (
        <div className="h-screen w-screen flex flex-col bg-base-200">
            <Header />
            <main className="flex-grow overflow-hidden">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
