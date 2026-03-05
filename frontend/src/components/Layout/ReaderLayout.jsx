import { Outlet, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import TopBar from '../TopBar';
import Footer from '../Footer';

const ReaderLayout = () => {

    // Components from HomePage

    return (
        <div className="min-h-screen bg-white dark:bg-[#121212] flex flex-col font-sans transition-colors duration-300 w-full text-gray-900 dark:text-gray-100">
            <TopBar />
            <Navbar />

            <main className="flex-1 w-full animate-fade-in relative">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
};

export default ReaderLayout;

