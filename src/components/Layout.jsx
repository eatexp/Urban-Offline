import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import OfflineIndicator from './OfflineIndicator';

import Search from './Search';

const Layout = () => {
    return (
        <div className="app-layout flex flex-col h-screen">
            <header className="bg-slate-900 p-2 shadow-md z-50">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="font-bold text-orange-500 text-sm tracking-tighter">URBAN OFFLINE</div>
                    <Search />
                </div>
                <OfflineIndicator />
            </header>

            <main className="container mx-auto flex-1 overflow-y-auto p-4 safe-area-bottom">
                <Outlet />
            </main>
            <Navbar />
        </div>
    );
};

export default Layout;
