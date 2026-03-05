import { useState, useEffect } from 'react';
import { getAllOrders } from '../../services/admin';
import toast from '../../utils/sweetalert';
import { FaShoppingCart, FaSearch, FaCheckCircle, FaTimesCircle, FaClock, FaBook, FaCrown } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('book'); // 'book' or 'subscription'

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await getAllOrders();
            setOrders(response.data.orders || response.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Filter based on Tab AND Search
    const filteredOrders = orders.filter(order => {
        // Tab Filter
        const isSubscription = order.orderType === 'subscription';
        if (activeTab === 'book' && isSubscription) return false;
        if (activeTab === 'subscription' && !isSubscription) return false;

        // Search Filter
        if (!searchTerm) return true; // If no search term, return all (after tab filter)

        const searchLower = searchTerm.toLowerCase();
        const orderId = String(order.id || order._id || '');

        return (
            orderId.toLowerCase().includes(searchLower) ||
            order.customerEmail?.toLowerCase().includes(searchLower) ||
            order.user?.email?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FaShoppingCart className="text-blue-600" />
                            Order Management
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage book sales and subscription revenue • {orders.length} Orders</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search IDs or Emails..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-full max-w-md">
                <button
                    onClick={() => setActiveTab('book')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'book'
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <FaBook className={activeTab === 'book' ? 'text-blue-600' : 'text-gray-400'} />
                    Book Sales
                </button>
                <button
                    onClick={() => setActiveTab('subscription')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'subscription'
                        ? 'bg-white dark:bg-gray-800 text-orange-500 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <FaCrown className={activeTab === 'subscription' ? 'text-orange-500' : 'text-gray-400'} />
                    Subscriptions
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeTab === 'book' ? 'bg-blue-50 text-blue-300' : 'bg-orange-50 text-orange-300'}`}>
                            {activeTab === 'book' ? <FaBook className="text-2xl" /> : <FaCrown className="text-2xl" />}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No {activeTab} records found</h3>
                        <p className="text-sm text-gray-500">
                            {activeTab === 'book' ? 'Book purchase history will appear here.' : 'Subscription transactions will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Order ID</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Customer</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Item Details</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Amount</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order.id || order._id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                #{order.orderNumber || String(order.id || order._id).slice(-6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${activeTab === 'book' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {(order.customerName || order.user?.name || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{order.customerName || order.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-400">{order.customerEmail || order.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                    {order.items && order.items.length > 0 ? order.items[0].title : 'Unknown Item'}
                                                </span>
                                                {order.items && order.items.length > 1 && (
                                                    <span className="text-xs text-gray-400">+{order.items.length - 1} more items</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-semibold ${activeTab === 'book' ? 'text-blue-600' : 'text-orange-500'}`}>
                                                ₹{order.total || order.totalAmount?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium w-fit ${order.status === 'completed' || order.status === 'paid' ? 'bg-green-50 text-green-600' :
                                                    order.status === 'failed' || order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                        'bg-orange-50 text-orange-600'
                                                    }`}>
                                                    {order.status === 'completed' || order.status === 'paid' ? <FaCheckCircle /> :
                                                        order.status === 'failed' || order.status === 'cancelled' ? <FaTimesCircle /> : <FaClock />}
                                                    {order.status}
                                                </span>
                                                {order.notes && (
                                                    <span className="text-[10px] text-red-400 italic max-w-[150px] truncate" title={order.notes}>
                                                        {order.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
