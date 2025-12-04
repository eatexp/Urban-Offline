import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import OfflineIndicator from './OfflineIndicator';

const Layout = () => {
    return (
        <div className="app-layout">
            <OfflineIndicator />
            <main className="container" style={{ flex: 1 }}>
                <Outlet />
            </main>
            <Navbar />
        </div>
    );
};

export default Layout;
