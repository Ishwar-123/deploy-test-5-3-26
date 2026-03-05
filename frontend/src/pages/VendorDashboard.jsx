import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    FaStore, FaSignOutAlt, FaBoxOpen, FaChartLine, FaUserCircle,
    FaShoppingBag, FaHistory, FaSearch, FaPlus, FaSpinner,
    FaSun, FaMoon
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from '../utils/sweetalert';

const VendorDashboard = () => {
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    // Data States
    const [stats, setStats] = useState({ inventoryCount: 0, totalSales: 0, followers: 0 });
    const [inventory, setInventory] = useState([]);
    const [marketplaceBooks, setMarketplaceBooks] = useState([]);
    const [sales, setSales] = useState([]);

    // Action States
    const [purchaseLoading, setPurchaseLoading] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Tab Data Fetching
    useEffect(() => {
        if (activeTab === 'inventory') fetchInventory();
        if (activeTab === 'marketplace') fetchMarketplace();
        if (activeTab === 'sales') fetchSales();
    }, [activeTab]);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/vendor/dashboard');
            if (response.success) setStats(response.data);
        } catch (error) {
            console.error("Dashboard data error", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/vendor/inventory');
            if (response.success) setInventory(response.data);
        } catch (error) {
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    const fetchMarketplace = async () => {
        try {
            setLoading(true);
            const response = await api.get('/books');
            setMarketplaceBooks(Array.isArray(response) ? response : response.data.books || []);
        } catch (error) {
            toast.error("Failed to load marketplace");
        } finally {
            setLoading(false);
        }
    };

    const fetchSales = async () => {
        try {
            setLoading(true);
            const response = await api.get('/vendor/sales');
            if (response.success) setSales(response.data);
        } catch (error) {
            toast.error("Failed to load sales history");
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (bookId, quantity = 5) => {
        try {
            setPurchaseLoading(bookId);
            const response = await api.post('/vendor/purchase', {
                itemId: bookId,
                itemType: 'book',
                quantity: quantity
            });

            if (response.success) {
                toast.success("Stock purchased successfully!");
                fetchDashboardData();
                fetchMarketplace();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Purchase failed");
        } finally {
            setPurchaseLoading(null);
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all duration-300 ${activeTab === id
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
        >
            <Icon className="text-xl" />
            <span className="font-bold">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-white">

            {/* Sidebar */}
            <aside className="w-72 hidden lg:flex flex-col fixed inset-y-0 left-0 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 z-40">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
                        <FaStore />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold tracking-tight">Vendor Portal</h1>
                        <p className="text-xs text-slate-500 font-medium">MANAGEMENT</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <TabButton id="dashboard" label="Overview" icon={FaChartLine} />
                    <TabButton id="marketplace" label="Marketplace" icon={FaShoppingBag} />
                    <TabButton id="inventory" label="My Inventory" icon={FaBoxOpen} />
                    <TabButton id="sales" label="Sales History" icon={FaHistory} />
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
                    {/* Theme Toggle in Sidebar */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
                    >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                            {darkMode ? <FaSun className="text-amber-400" /> : <FaMoon className="text-blue-600" />}
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-xs font-bold uppercase tracking-wider">Appearance</p>
                            <p className="text-[10px] opacity-70">{darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                        </div>
                    </button>

                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <FaUserCircle size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{user?.name}</p>
                            <p className="text-xs text-green-500 font-bold uppercase tracking-wider">Verified</p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <FaSignOutAlt />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Nav (Top) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FaStore className="text-indigo-600" size={24} />
                    <span className="font-bold">Vendor Portal</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="text-slate-500 hover:text-indigo-600 transition-colors">
                        {darkMode ? <FaSun className="text-amber-400" /> : <FaMoon />}
                    </button>
                    <button onClick={logout} className="text-slate-500"><FaSignOutAlt /></button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-6 lg:p-10 mt-16 lg:mt-0 transition-all">

                {/* Header Section */}
                <header className="mb-10 animate-fade-in-up">
                    <h2 className="text-3xl font-display font-black tracking-tight mb-2">
                        {activeTab === 'dashboard' && `Welcome back, ${user?.name?.split(' ')[0]}!`}
                        {activeTab === 'marketplace' && 'Wholesale Marketplace'}
                        {activeTab === 'inventory' && 'Inventory Management'}
                        {activeTab === 'sales' && 'Sales History'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        {activeTab === 'dashboard' && 'Here is what is happening with your store today.'}
                        {activeTab === 'marketplace' && 'Purchase books from Admin to resell to your readers.'}
                        {activeTab === 'inventory' && 'Track and manage your current stock levels.'}
                        {activeTab === 'sales' && 'View all your recent transactions and revenue.'}
                    </p>
                </header>

                {/* Dashboard View */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-2xl">
                                        <FaBoxOpen />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Stock Value</p>
                                        <h3 className="text-3xl font-black">{stats.inventoryCount} <span className="text-sm font-medium text-slate-400">items</span></h3>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-2xl">
                                        <FaChartLine />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Total Revenue</p>
                                        <h3 className="text-3xl font-black">₹{stats.totalSales}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-2xl">
                                        <FaUserCircle />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Active Customers</p>
                                        <h3 className="text-3xl font-black">{stats.followers}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions / Promo */}
                        <div className="relative overflow-hidden rounded-[2.5rem] p-10 text-white shadow-xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">Need more stock?</h3>
                                    <p className="text-indigo-100 max-w-md">Browse the latest bestsellers from the central repository and add them to your store.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setActiveTab('marketplace')}
                                        className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                                    >
                                        Go to Marketplace
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Marketplace View */}
                {activeTab === 'marketplace' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                        {loading ? (
                            <div className="col-span-full flex justify-center py-20 text-slate-400">
                                <FaSpinner className="animate-spin text-3xl" />
                            </div>
                        ) : marketplaceBooks.map((book) => (
                            <div key={book.id || book._id} className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group">
                                <div className="h-48 overflow-hidden relative">
                                    <img src={book.coverImage || 'https://via.placeholder.com/300x400?text=No+Cover'} alt={book.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                        <h3 className="text-white font-bold text-lg leading-tight truncate">{book.title}</h3>
                                        <p className="text-slate-300 text-sm">{book.author}</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Wholesale Price</p>
                                            <p className="text-2xl font-black text-indigo-600">₹{book.wholesalePrice || Math.floor(book.retailPrice * 0.7) || 200}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Retail Price</p>
                                            <p className="text-lg font-bold text-slate-400 line-through decoration-2">₹{book.retailPrice || 500}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePurchase(book.id || book._id, 5)}
                                            disabled={purchaseLoading === (book.id || book._id)}
                                            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
                                        >
                                            {purchaseLoading === (book.id || book._id) ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                                            Buy 5 Units
                                        </button>
                                    </div>
                                    <p className="text-xs text-center text-slate-400 mt-3 font-medium">Estimated Profit: ₹{((book.retailPrice || 500) - (book.wholesalePrice || Math.floor(book.retailPrice * 0.7) || 200)) * 5}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Inventory View */}
                {activeTab === 'inventory' && (
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
                        {loading ? (
                            <div className="flex justify-center py-20 text-slate-400">
                                <FaSpinner className="animate-spin text-3xl" />
                            </div>
                        ) : inventory.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-3xl">
                                    <FaBoxOpen />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Inventory Empty</h3>
                                <p className="text-slate-500 mt-2 mb-6">You haven't purchased any books yet.</p>
                                <button onClick={() => setActiveTab('marketplace')} className="text-indigo-600 font-bold hover:underline">Go to Marketplace</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Book</th>
                                            <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Available</th>
                                            <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Sold</th>
                                            <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Purchase Price</th>
                                            <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {inventory.map((item) => (
                                            <tr key={item.id || item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={item.itemId?.coverImage || 'https://via.placeholder.com/50'}
                                                            alt=""
                                                            className="w-12 h-16 object-cover rounded-lg shadow-sm"
                                                        />
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white">{item.itemId?.title || 'Unknown Title'}</p>
                                                            <p className="text-xs text-slate-500">{item.itemId?.author || 'Unknown Author'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${item.quantityAvailable > 5
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {item.quantityAvailable} units
                                                    </span>
                                                </td>
                                                <td className="p-6 font-medium text-slate-600 dark:text-slate-400">
                                                    {item.quantitySold}
                                                </td>
                                                <td className="p-6 font-medium text-slate-600 dark:text-slate-400">
                                                    ₹{item.purchasePrice}
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-sm text-green-600 font-bold">Active</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Sales History view */}
                {activeTab === 'sales' && (
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
                        {loading ? (
                            <div className="flex justify-center py-20 text-slate-400">
                                <FaSpinner className="animate-spin text-3xl" />
                            </div>
                        ) : sales.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-3xl">
                                    <FaHistory />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Sales Yet</h3>
                                <p className="text-slate-500 mt-2">Sales transactions will appear here.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Order ID</th>
                                        <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Item</th>
                                        <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
                                        <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                                        <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {sales.map((sale) => (
                                        <tr key={sale.id || sale._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-6 font-mono text-xs font-bold text-slate-500">
                                                #{String(sale.id || sale._id).slice(-6).toUpperCase()}
                                            </td>
                                            <td className="p-6 font-bold text-slate-800 dark:text-white">
                                                {sale.items[0]?.title || 'Book Sale'}
                                                <span className="block text-xs font-normal text-slate-500">Qty: {sale.items[0]?.quantity}</span>
                                            </td>
                                            <td className="p-6 font-bold text-emerald-600">
                                                +₹{sale.total}
                                            </td>
                                            <td className="p-6 text-sm text-slate-500">
                                                {new Date(sale.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-6">
                                                <span className="inline-block px-2 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold uppercase">
                                                    Completed
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default VendorDashboard;
