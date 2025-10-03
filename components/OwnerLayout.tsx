import React, { useState } from 'react';
import DashboardPage from './Dashboard';
import ProductManagementPage from './ProductManagement';
import { ChartBarIcon, CubeIcon, UserGroupIcon, UserCircleIcon, Cog6ToothIcon } from './UI';
import CustomerManagementPage from './CustomerManagement';
import OperatorManagementPage from './OperatorManagement';
import SettingsPage from './SettingsPage';

const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: <ChartBarIcon /> },
    { view: 'products', label: 'Produtos', icon: <CubeIcon /> },
    { view: 'customers', label: 'Clientes', icon: <UserGroupIcon /> },
    { view: 'operators', label: 'Operadores', icon: <UserCircleIcon /> },
    { view: 'settings', label: 'Ajustes', icon: <Cog6ToothIcon /> },
];

const NavLink: React.FC<{
    view: string;
    label: string;
    icon: React.ReactNode;
    activeView: string;
    setActiveView: (view: string) => void;
}> = ({ view, label, icon, activeView, setActiveView }) => (
    <li>
        <button
            onClick={() => setActiveView(view)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-lg transition-colors ${
                activeView === view
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-text-secondary hover:bg-base-200 hover:text-text-primary'
            }`}
        >
            {icon}
            {label}
        </button>
    </li>
);

const BottomNavLink: React.FC<{
    view: string;
    label: string;
    icon: React.ReactNode;
    activeView: string;
    setActiveView: (view: string) => void;
}> = ({ view, label, icon, activeView, setActiveView }) => (
     <button
        onClick={() => setActiveView(view)}
        className={`flex flex-col items-center justify-center gap-1 w-full pt-2 pb-1 transition-colors rounded-lg ${
            activeView === view
                ? 'text-primary'
                : 'text-text-secondary hover:bg-base-200'
        }`}
    >
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        <span className="text-xs">{label}</span>
    </button>
);


const BottomNavBar: React.FC<{ activeView: string; setActiveView: (view: string) => void }> = ({ activeView, setActiveView }) => (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-base-100 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex justify-around items-center px-2 z-50 lg:hidden">
        {navItems.map(item => (
            <BottomNavLink
                key={item.view}
                view={item.view}
                label={item.label}
                icon={item.icon}
                activeView={activeView}
                setActiveView={setActiveView}
            />
        ))}
    </nav>
);


const OwnerLayout: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard');

    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardPage />;
            case 'products': return <ProductManagementPage />;
            case 'customers': return <CustomerManagementPage />;
            case 'operators': return <OperatorManagementPage />;
            case 'settings': return <SettingsPage />;
            default: return <DashboardPage />;
        }
    }

    const settingsItem = navItems.find(item => item.view === 'settings');

    return (
        <div className="flex h-full">
            {/* Desktop Sidebar */}
            <nav className="w-64 bg-base-100 p-4 flex-col shadow-lg shrink-0 hidden lg:flex">
                <ul className="space-y-2">
                    {navItems.filter(item => item.view !== 'settings').map(item => (
                        <NavLink
                            key={item.view}
                            view={item.view}
                            label={item.label}
                            icon={item.icon}
                            activeView={activeView}
                            setActiveView={setActiveView}
                        />
                    ))}
                </ul>
                <div className="mt-auto">
                    <ul className="space-y-2 border-t border-base-200 pt-2">
                        {settingsItem && (
                             <NavLink
                                view={settingsItem.view}
                                label={settingsItem.label}
                                icon={settingsItem.icon}
                                activeView={activeView}
                                setActiveView={setActiveView}
                            />
                        )}
                    </ul>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-base-200 pb-20 lg:pb-0">
                {renderActiveView()}
            </div>
            
            {/* Mobile Bottom Navigation */}
            <BottomNavBar activeView={activeView} setActiveView={setActiveView} />
        </div>
    );
};

export default OwnerLayout;