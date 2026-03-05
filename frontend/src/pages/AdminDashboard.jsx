import { useState } from 'react';
import {
    FaBook, FaUsers, FaStore, FaChartLine, FaArrowUp, FaArrowDown,
    FaPlus, FaCheckCircle, FaClock, FaExclamationTriangle, FaDollarSign,
    FaShoppingCart, FaTrophy, FaFire, FaBolt, FaStar, FaRocket
} from 'react-icons/fa';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const AdminDashboard = () => {
    // Sample Data
    const salesData = [
        { name: 'Jan', sales: 4000, revenue: 2400 },
        { name: 'Feb', sales: 3000, revenue: 1398 },
        { name: 'Mar', sales: 5000, revenue: 3800 },
        { name: 'Apr', sales: 2780, revenue: 3908 },
        { name: 'May', sales: 4890, revenue: 4800 },
        { name: 'Jun', sales: 6390, revenue: 3800 },
        { name: 'Jul', sales: 7490, revenue: 4300 },
    ];

    const categoryData = [
        { name: 'Fiction', value: 400, color: '#6366f1' },
        { name: 'Tech', value: 300, color: '#8b5cf6' },
        { name: 'Business', value: 200, color: '#ec4899' },
        { name: 'Science', value: 150, color: '#f59e0b' },
    ];

    const stats = [
        {
            label: 'Total Revenue',
            value: '₹8.4M',
            change: '+24.5%',
            isUp: true,
            icon: FaDollarSign,
            gradient: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400'
        },
        {
            label: 'Active Users',
            value: '12.5K',
            change: '+18.2%',
            isUp: true,
            icon: FaUsers,
            gradient: 'from-blue-500 to-cyan-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400'
        },
        {
            label: 'Total Books',
            value: '1,842',
            change: '+12.8%',
            isUp: true,
            icon: FaBook,
            gradient: 'from-violet-500 to-purple-600',
            bg: 'bg-violet-50 dark:bg-violet-900/20',
            iconColor: 'text-violet-600 dark:text-violet-400'
        },
        {
            label: 'Conversion',
            value: '68.4%',
            change: '+5.2%',
            isUp: true,
            icon: FaTrophy,
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            iconColor: 'text-amber-600 dark:text-amber-400'
        },
    ];

    const topBooks = [
        { title: 'The Modern Developer', sales: 1234, trend: '+12%', rating: 4.8 },
        { title: 'AI Revolution', sales: 987, trend: '+8%', rating: 4.9 },
        { title: 'Business Mastery', sales: 856, trend: '+15%', rating: 4.7 },
        { title: 'Digital Marketing Pro', sales: 745, trend: '+6%', rating: 4.6 },
    ];

    return (
        <div className="space-y-8 animate-fade-in w-full pb-10">

            {/* Hero Header Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 p-8 lg:p-12 shadow-2xl">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                                <FaRocket className="text-3xl text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    Command Center
                                </h1>
                                <p className="text-indigo-200 font-semibold text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    Real-time Business Intelligence Dashboard
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-6">
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                                <span className="text-white font-bold text-sm flex items-center gap-2">
                                    <FaFire className="text-orange-400" />
                                    Live Updates
                                </span>
                            </div>
                            <div className="px-4 py-2 bg-emerald-500/20 backdrop-blur-xl rounded-full border border-emerald-400/30">
                                <span className="text-emerald-200 font-bold text-sm flex items-center gap-2">
                                    <FaBolt className="text-emerald-400" />
                                    All Systems Operational
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-6 py-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 font-bold text-sm text-white hover:bg-white/20 transition-all shadow-lg active:scale-95" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Export Report
                        </button>
                        <button className="px-6 py-3.5 rounded-2xl bg-white text-indigo-900 font-black text-sm hover:bg-indigo-50 shadow-2xl shadow-white/20 transition-all active:scale-95 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <FaPlus size={14} /> New Campaign
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Ultra Premium Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        {/* Gradient Background on Hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                    <stat.icon className={`text-2xl ${stat.iconColor}`} />
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${stat.isUp ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                                    {stat.isUp ? <FaArrowUp className="text-emerald-600 text-xs" /> : <FaArrowDown className="text-rose-600 text-xs" />}
                                    <span className={`text-xs font-black ${stat.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                                        {stat.change}
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {stat.value}
                            </h3>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {stat.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                                Revenue Analytics
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                                Growth performance over last 7 months
                            </p>
                        </div>
                        <select className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold px-4 py-2.5 text-slate-700 dark:text-slate-300 outline-none cursor-pointer" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <option>Last 7 Months</option>
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
                                        background: '#fff',
                                        fontFamily: "'Inter', sans-serif"
                                    }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="mb-6">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Category Mix
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Distribution by genre
                        </p>
                    </div>
                    <div className="h-[200px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontFamily: "'Inter', sans-serif",
                                        fontWeight: 'bold'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 space-y-3">
                        {categoryData.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                                        {cat.name}
                                    </span>
                                </div>
                                <span className="font-black text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    {cat.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section - Top Books & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Performing Books */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                                <FaTrophy className="text-amber-500" />
                                Top Performers
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                                Best-selling books this month
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {topBooks.map((book, idx) => (
                            <div key={idx} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                    #{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                                        {book.title}
                                    </h5>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                                            {book.sales} sales
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <FaStar className="text-amber-400 text-xs" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                                                {book.rating}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                                        {book.trend}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions & Alerts */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
                    {/* Animated Background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30">
                                <FaBolt className="text-2xl text-white" />
                            </div>
                            <h3 className="text-2xl font-black" style={{ fontFamily: "'Inter', sans-serif" }}>
                                Quick Actions
                            </h3>
                        </div>

                        <div className="space-y-3 mb-8">
                            <button className="w-full p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-left group/btn">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FaCheckCircle className="text-emerald-300" />
                                        <span className="font-bold text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                                            Approve Pending Books
                                        </span>
                                    </div>
                                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-black">
                                        8 New
                                    </span>
                                </div>
                            </button>

                            <button className="w-full p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-left">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FaClock className="text-amber-300" />
                                        <span className="font-bold text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                                            Review Submissions
                                        </span>
                                    </div>
                                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-black">
                                        5
                                    </span>
                                </div>
                            </button>

                            <button className="w-full p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-left">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FaExclamationTriangle className="text-rose-300" />
                                        <span className="font-bold text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                                            Critical Alerts
                                        </span>
                                    </div>
                                    <span className="px-2 py-1 bg-rose-500/30 rounded-full text-xs font-black">
                                        2
                                    </span>
                                </div>
                            </button>
                        </div>

                        <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl hover:shadow-3xl hover:scale-105 transition-all active:scale-95" style={{ fontFamily: "'Inter', sans-serif" }}>
                            View All Activities
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
