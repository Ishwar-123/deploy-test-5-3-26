import { useState, useEffect } from 'react';
import {
    FaBook, FaUsers, FaStore, FaChartLine, FaArrowUp, FaArrowDown,
    FaDollarSign, FaShoppingCart, FaTrophy, FaStar, FaSignal, FaSync, FaChartPie
} from 'react-icons/fa';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { getDashboardStats } from '../../services/admin';
import toast from '../../utils/sweetalert';

const formatDate = (dateString) => {
    try {
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(new Date(dateString));
    } catch (e) {
        return dateString;
    }
};

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [topBooksData, setTopBooksData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await getDashboardStats();
            if (response.data.success || response.success) {
                const data = response.data.data || response.data;
                setStatsData(data.stats);
                setRecentOrders(data.recentOrders || []);
                setTopBooksData(data.topBooks || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('Failed to load real-time analytics');
        } finally {
            setLoading(false);
        }
    };
    const stats = [
        {
            label: 'Total Revenue',
            value: `₹${(statsData?.totalRevenue || 0).toLocaleString()}`,
            change: '+12.5%',
            isUp: true,
            icon: FaDollarSign,
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400'
        },
        {
            label: 'Active Users',
            value: (statsData?.totalReaders || 0) + (statsData?.totalVendors || 0),
            change: '+8.2%',
            isUp: true,
            icon: FaUsers,
            bg: 'bg-green-50 dark:bg-green-900/20',
            iconColor: 'text-green-600 dark:text-green-400'
        },
        {
            label: 'Total Books',
            value: statsData?.totalBooks || 0,
            change: '+5.8%',
            isUp: true,
            icon: FaBook,
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            iconColor: 'text-purple-600 dark:text-purple-400'
        },
        {
            label: 'Pending Subs',
            value: statsData?.pendingSubmissions || 0,
            change: '-2.4%',
            isUp: false,
            icon: FaSignal,
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            iconColor: 'text-orange-600 dark:text-orange-400'
        },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 admin-accent-border border-t-transparent animate-spin"></div>
                </div>
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Syncing Analytics</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fetching latest data from the server...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaChartPie className="admin-accent-text" /> Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Welcome back! Here's what's happening today, {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
                    </p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="p-2 admin-accent-bg text-white rounded-lg hover:opacity-90 transition-all shadow-md"
                >
                    <FaSync className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`text-xl ${stat.iconColor}`} />
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${stat.isUp ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                {stat.isUp ? <FaArrowUp className="text-green-600 text-xs" /> : <FaArrowDown className="text-red-600 text-xs" />}
                                <span className={`text-xs font-semibold ${stat.isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stat.value}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Revenue Analytics
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Growth performance over last 7 months
                            </p>
                        </div>
                        <select className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium px-3 py-2 text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
                            <option>Last 7 Months</option>
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-[320px] w-full flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <FaChartLine className="text-gray-300 dark:text-gray-600 text-4xl mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Live analytics will populate as sales occur</p>
                        </div>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Category Mix
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Distribution by genre
                        </p>
                    </div>
                    <div className="h-[200px] w-full flex items-center justify-center">
                        <div className="text-center">
                            <FaChartPie className="text-gray-300 dark:text-gray-600 text-3xl mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Category data coming soon</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Top Books & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Books */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaTrophy className="text-orange-500" />
                                Top Performers
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Best-selling books this month
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {topBooksData.length > 0 ? topBooksData.map((book, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                    #{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {book.title}
                                    </h5>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {book.totalSales || 0} sales
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <FaStar className="text-yellow-400 text-xs" />
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {book.avgRating || '4.5'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20">
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                        ₹{book.retailPrice}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <p className="text-sm text-gray-500">No sales data available yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Recent Activity
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Latest updates and actions
                        </p>
                    </div>
                    <div className="space-y-4">
                        {recentOrders.length > 0 ? recentOrders.map((order, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <FaShoppingCart className="text-white text-xs" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Order {order.orderNumber}</p>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        By {order.customer?.name} ({order.customer?.email})
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs font-black text-gray-900 dark:text-white">₹{order.total}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {formatDate(order.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                <FaSignal className="mx-auto text-gray-200 dark:text-gray-700 text-3xl mb-2" />
                                <p className="text-xs text-gray-400">Waiting for first orders...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
