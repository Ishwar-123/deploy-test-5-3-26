import { useState, useEffect } from 'react';
import { getReports } from '../../services/admin';
import toast from '../../utils/sweetalert';
import {
    FaChartLine, FaBook, FaStore, FaDownload,
    FaCalendarAlt, FaFilter, FaMoneyBillWave,
    FaArrowUp, FaUsers, FaShoppingCart
} from 'react-icons/fa';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const Reports = () => {
    const [reportType, setReportType] = useState('sales');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    const fetchReport = async () => {
        setLoading(true);
        setReportData(null); // Clear previous data to show loading state
        try {
            const params = {
                type: reportType,
                ...(dateRange.startDate && { startDate: dateRange.startDate }),
                ...(dateRange.endDate && { endDate: dateRange.endDate })
            };
            console.log(`Fetching ${reportType} report...`, params);
            const response = await getReports(params);
            console.log(`${reportType} data received:`, response.data);
            setReportData(response.data);
        } catch (error) {
            console.error('Report fetch error:', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    // Auto load sales on mount
    useEffect(() => {
        fetchReport();
    }, [reportType]);

    const StatCard = ({ title, value, icon, trend, color }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between"
        >
            <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white">{value}</h4>
                {trend && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                        <FaArrowUp /> <span>{trend}</span>
                    </div>
                )}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
                {icon}
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                        Platform Insights
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Real-time visualization of your business performance.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                    {['sales', 'books', 'vendors'].map(type => (
                        <button
                            key={type}
                            onClick={() => setReportType(type)}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${reportType === type
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="min-h-[120px]">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-700/50 animate-pulse rounded-2xl"></div>
                        ))}
                    </div>
                ) : reportData ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={reportType}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {reportType === 'sales' && (
                                <>
                                    <StatCard
                                        title="Total Earnings"
                                        value={`₹${reportData?.salesData?.reduce((s, i) => s + parseFloat(i.totalRevenue || 0), 0).toLocaleString() || '0'}`}
                                        icon={<FaMoneyBillWave />}
                                        color="bg-green-50 dark:bg-green-900/20 text-green-600"
                                        trend="+12.5%"
                                    />
                                    <StatCard
                                        title="Orders Count"
                                        value={reportData?.salesData?.reduce((s, i) => s + (i.totalOrders || 0), 0) || '0'}
                                        icon={<FaShoppingCart />}
                                        color="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                    />
                                    <StatCard
                                        title="Admin Commission"
                                        value={`₹${Math.round(reportData?.salesData?.reduce((s, i) => s + parseFloat(i.totalRevenue || 0), 0) * 0.15).toLocaleString() || '0'}`}
                                        icon={<FaChartLine />}
                                        color="bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                                        trend="15% Fixed"
                                    />
                                    <StatCard
                                        title="Avg Order Value"
                                        value={`₹${Math.round(reportData?.salesData?.reduce((s, i) => s + parseFloat(i.totalRevenue || 0), 0) / (reportData?.salesData?.reduce((s, i) => s + (i.totalOrders || 0), 1) || 1)).toLocaleString()}`}
                                        icon={<FaFilter />}
                                        color="bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                                    />
                                </>
                            )}
                            {reportType === 'books' && (
                                <>
                                    <StatCard
                                        title="Catalog Categories"
                                        value={reportData?.booksData?.length || '0'}
                                        icon={<FaFilter />}
                                        color="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                                    />
                                    <StatCard
                                        title="Total Inventory"
                                        value={reportData?.booksData?.reduce((s, i) => s + (i.count || 0), 0) || '0'}
                                        icon={<FaBook />}
                                        color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                                    />
                                    <StatCard
                                        title="High Demand Cat"
                                        value={reportData?.booksData?.[0]?.category || 'N/A'}
                                        icon={<FaArrowUp />}
                                        color="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                                    />
                                    <StatCard
                                        title="Total Book Sales"
                                        value={reportData?.booksData?.reduce((s, i) => s + (parseInt(i.totalSales) || 0), 0) || '0'}
                                        icon={<FaShoppingCart />}
                                        color="bg-pink-50 dark:bg-pink-900/20 text-pink-600"
                                    />
                                </>
                            )}
                            {reportType === 'vendors' && (
                                <>
                                    <StatCard
                                        title="Active Vendors"
                                        value={reportData?.vendorsData?.length || '0'}
                                        icon={<FaStore />}
                                        color="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                    />
                                    <StatCard
                                        title="Total Vendor Sales"
                                        value={`₹${reportData?.vendorsData?.reduce((s, i) => s + parseFloat(i.totalRevenue || 0), 0).toLocaleString() || '0'}`}
                                        icon={<FaMoneyBillWave />}
                                        color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                                    />
                                    <StatCard
                                        title="Top Vendor Orders"
                                        value={reportData?.vendorsData?.[0]?.totalOrders || '0'}
                                        icon={<FaUsers />}
                                        color="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                                    />
                                    <StatCard
                                        title="Commission Rev"
                                        value={`₹${reportData?.vendorsData?.reduce((s, i) => s + parseFloat(i.totalCommission || 0), 0).toLocaleString() || '0'}`}
                                        icon={<FaChartLine />}
                                        color="bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                                    />
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                ) : null}
            </div>

            {/* Visualization Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Compiling Insights...</p>
                </div>
            ) : reportData ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Trend Analysis</h3>
                                    <p className="text-xs text-gray-500 font-medium">Performance over time</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="date"
                                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                        className="bg-gray-50 dark:bg-gray-700 border-0 rounded-lg px-3 py-1.5 text-xs font-bold outline-none ring-1 ring-gray-200 dark:ring-gray-600 focus:ring-blue-500"
                                    />
                                    <button onClick={fetchReport} className="text-blue-600 hover:text-blue-700 p-2"><FaFilter /></button>
                                </div>
                            </div>

                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {reportType === 'sales' ? (
                                        <AreaChart data={reportData?.salesData || []}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                                itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                                            />
                                            <Area type="monotone" dataKey="totalRevenue" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                        </AreaChart>
                                    ) : (
                                        <BarChart data={reportType === 'books' ? reportData?.booksData : reportData?.vendorsData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey={reportType === 'books' ? "category" : "vendorName"} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                            <Bar dataKey="totalRevenue" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Distribution</h3>
                            <p className="text-xs text-gray-500 font-medium mb-8 uppercase tracking-widest">Revenue Share</p>

                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={reportType === 'books' ? reportData?.booksData : reportData?.vendorsData || []}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="totalRevenue"
                                            nameKey={reportType === 'books' ? "category" : "vendorName"}
                                        >
                                            {(reportType === 'books' ? reportData?.booksData : reportData?.vendorsData || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <button className="w-full mt-6 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2">
                                <FaDownload size={14} /> Download Raw Report
                            </button>
                        </div>
                    </div>

                    {/* Detailed Table Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mt-8">
                        <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detailed Data Table</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/30">
                                    {reportType === 'sales' && (
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction Date</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order Volume</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Revenue</th>
                                        </tr>
                                    )}
                                    {reportType === 'books' && (
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category Name</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Items Count</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Sold</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Revenue</th>
                                        </tr>
                                    )}
                                    {reportType === 'vendors' && (
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Vendor Identity</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Sales</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Commission Earned</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {reportType === 'sales' && reportData?.salesData?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/10 transition-colors">
                                            <td className="px-8 py-4 text-sm font-bold text-gray-800 dark:text-gray-200">{item.date}</td>
                                            <td className="px-8 py-4 text-sm text-gray-500 font-medium">{item.totalOrders} Orders</td>
                                            <td className="px-8 py-4 text-sm font-black text-gray-900 dark:text-white text-right">₹{parseFloat(item.totalRevenue).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {reportType === 'books' && reportData?.booksData?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/10 transition-colors">
                                            <td className="px-8 py-4">
                                                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-sm text-gray-500 font-medium">{item.count} Books</td>
                                            <td className="px-8 py-4 text-sm text-gray-700 font-bold dark:text-gray-300">{item.totalSales} Sold</td>
                                            <td className="px-8 py-4 text-sm font-black text-gray-900 dark:text-white text-right">₹{parseFloat(item.totalRevenue || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {reportType === 'vendors' && reportData?.vendorsData?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/10 transition-colors">
                                            <td className="px-8 py-4 text-sm font-bold text-gray-800 dark:text-gray-200">{item.vendorName}</td>
                                            <td className="px-8 py-4 text-sm text-gray-500 font-medium">{item.totalOrders} Sales</td>
                                            <td className="px-8 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400 text-right">₹{parseFloat(item.totalCommission).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                        <FaChartLine className="text-3xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Data Available</h3>
                    <p className="text-gray-500 text-sm">Please update your filters or try another report.</p>
                </div>
            )}
        </div>
    );
};

export default Reports;
