import { useState, useEffect } from 'react';
import {
    FaShieldAlt, FaHistory, FaKey, FaExclamationTriangle,
    FaCheckCircle, FaTimesCircle, FaLock, FaUserSecret, FaSync,
    FaClock, FaDesktop, FaGlobe, FaCreditCard, FaExchangeAlt, FaWallet
} from 'react-icons/fa';
import { getAuthMonitorData, unlockUser, expireOTP } from '../../services/admin';
import toast from '../../utils/sweetalert';

const formatDate = (dateString) => {
    try {
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(new Date(dateString));
    } catch (e) {
        return dateString;
    }
};

const AuthMonitor = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('auth'); // 'auth' or 'payment'
    const [data, setData] = useState({
        loginLogs: [],
        activeOTPs: [],
        paymentLogs: [],
        stats: {
            totalToday: 0,
            failedToday: 0,
            lockedAccounts: 0,
            activeSessions: 0,
            totalPaymentsToday: 0,
            failedPaymentsToday: 0
        }
    });

    useEffect(() => {
        fetchMonitorData();
        const interval = setInterval(fetchMonitorData, 30000); // 30 sec auto-refresh
        return () => clearInterval(interval);
    }, []);

    const fetchMonitorData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await getAuthMonitorData();
            if (response.success || response.data?.success) {
                const monitorData = response.data.data || response.data || response.data?.data;
                setData(monitorData);
            }
        } catch (error) {
            console.error('Error fetching auth monitor data:', error);
            if (!silent) toast.error('Failed to load real-time auth logs');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleUnlock = async (userId) => {
        try {
            const res = await unlockUser(userId);
            if (res.success) {
                toast.success('User account unlocked');
                fetchMonitorData(true);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to unlock user');
        }
    };

    const handleExpire = async (userId) => {
        try {
            const res = await expireOTP(userId);
            if (res.success) {
                toast.success('OTP forced to expire');
                fetchMonitorData(true);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to expire OTP');
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'success':
                return { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: FaCheckCircle };
            case 'failed':
                return { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: FaTimesCircle };
            case 'otp_sent':
                return { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: FaKey };
            case 'locked':
                return { bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: FaLock };
            default:
                return { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', icon: FaShieldAlt };
        }
    };

    if (loading && !data.loginLogs.length) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-red-500 animate-spin"></div>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Connecting to Security Monitor...</h2>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FaShieldAlt className="text-red-500" /> Admin Live Monitor
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time tracking of security events and payment transactions.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-full md:w-auto">
                            <button
                                onClick={() => setActiveTab('auth')}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'auth' ? 'bg-white dark:bg-gray-800 text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <FaShieldAlt /> AUTH & SECURITY
                            </button>
                            <button
                                onClick={() => setActiveTab('payment')}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'payment' ? 'bg-white dark:bg-gray-800 text-green-500 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <FaCreditCard /> PAYMENT MONITOR
                            </button>
                        </div>
                        <button
                            onClick={fetchMonitorData}
                            className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-sm flex-shrink-0"
                            title="Force Refresh"
                        >
                            <FaSync className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeTab === 'auth' ? (
                    <>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                    <FaHistory size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Today's Logins</p>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">{data.stats.totalToday}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl">
                                    <FaExclamationTriangle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Failed Attempts</p>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">{data.stats.failedToday}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl">
                                    <FaLock size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Locked Users</p>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">{data.stats.lockedAccounts}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
                                    <FaKey size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active OTPs</p>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">{data.stats.activeSessions}</h4>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
                                    <FaExchangeAlt size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Today's Txns</p>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">{data.stats.totalPaymentsToday}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl">
                                    <FaExclamationTriangle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Failed Txns</p>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">{data.stats.failedPaymentsToday}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                    <FaWallet size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Completion Rate</p>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">
                                        {data.stats.totalPaymentsToday > 0
                                            ? Math.round(((data.stats.totalPaymentsToday - data.stats.failedPaymentsToday) / data.stats.totalPaymentsToday) * 100)
                                            : 0}%
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-xl">
                                    <FaCreditCard size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Attempts</p>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">
                                        {data.paymentLogs.filter(l => l.status === 'pending').length}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {activeTab === 'auth' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {/* Active OTPs Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FaKey className="text-yellow-500" /> Active OTPs
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30">
                                    {data.activeOTPs.length} ACTIVE
                                </span>
                            </div>
                            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                                {data.activeOTPs.length > 0 ? data.activeOTPs.map((user) => (
                                    <div key={user.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 group hover:border-yellow-400/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                                <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                                                    {user.emailVerificationOTP}
                                                </span>
                                                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                    <FaClock /> Exp: {new Date(user.otpExpiry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Attempts</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{user.otpAttempts}/3</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Lock Status</p>
                                                <p className={`text-sm font-bold ${user.lockUntil ? 'text-red-500' : 'text-green-500'}`}>
                                                    {user.lockUntil ? 'LOCKED' : 'READY'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => handleExpire(user.id)}
                                                className="flex-1 py-2 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                FORCE EXPIRE
                                            </button>
                                            {user.lockUntil && (
                                                <button
                                                    onClick={() => handleUnlock(user.id)}
                                                    className="flex-1 py-2 text-[10px] font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                                                >
                                                    UNLOCK
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <FaUserSecret className="mx-auto text-gray-200 dark:text-gray-700 text-4xl mb-3" />
                                        <p className="text-sm text-gray-400">No active OTP sessions</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Login Logs Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FaHistory className="text-blue-500" /> Recent Activity Logs
                                </h3>
                                <span className="text-xs text-gray-500 font-medium italic">Latest 50 events</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/20 text-xs text-gray-500 uppercase font-bold border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">User / Event</th>
                                            <th className="px-6 py-4">Security Info</th>
                                            <th className="px-6 py-4 text-right">Time & Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {data.loginLogs.map((log) => {
                                            const { bg, icon: StatusIcon } = getStatusStyles(log.status);
                                            return (
                                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className={`flex items-center gap-2 w-max px-3 py-1 rounded-full text-[10px] font-black uppercase ${bg}`}>
                                                            <StatusIcon size={12} /> {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{log.email}</p>
                                                            <p className="text-[11px] text-gray-500 mt-0.5">{log.message}</p>
                                                            {log.otpUsed && (
                                                                <span className="text-[9px] font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                                    OTP: {log.otpUsed}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                                <FaGlobe className="text-gray-400" /> {log.ipAddress || 'unknown'}
                                                            </div>
                                                            <div className="flex items-start gap-2 text-[10px] text-gray-500" title={log.userAgent}>
                                                                <FaDesktop className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                                <span className="break-words line-clamp-2">{log.userAgent || 'Unknown Device'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-gray-900 dark:text-gray-300">{formatDate(log.createdAt).split(', ')[0]}</p>
                                                            <p className="text-[10px] text-gray-400 mt-1">{formatDate(log.createdAt).split(', ')[1]}</p>
                                                            {log.status === 'locked' && (
                                                                <button
                                                                    onClick={() => {
                                                                        toast.info(`Go to Active OTPs or Readers to unlock ${log.email}`);
                                                                    }}
                                                                    className="mt-2 text-[9px] font-bold text-blue-500 hover:underline"
                                                                >
                                                                    MANAGE USER
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {data.loginLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FaExclamationTriangle className="text-gray-200 dark:text-gray-700 text-5xl" />
                                                        <p className="text-gray-400 font-medium">No activity recorded yet</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaCreditCard className="text-green-500" /> Real-time Payment Monitor
                            </h3>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500 font-medium italic">Latest 50 transactions</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-[10px] font-bold text-green-500">TRACKING GATEWAY</span>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/20 text-xs text-gray-500 uppercase font-bold border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Reader</th>
                                        <th className="px-6 py-4">Transaction Details</th>
                                        <th className="px-6 py-4 text-right">Amount & Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {data.paymentLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-2 w-max px-3 py-1 rounded-full text-[10px] font-black uppercase ${log.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    log.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {log.status === 'completed' ? <FaCheckCircle size={12} /> :
                                                        log.status === 'failed' ? <FaTimesCircle size={12} /> :
                                                            <FaSync size={12} className="animate-spin" />} {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{log.user?.name || 'Unknown User'}</p>
                                                    <p className="text-[11px] text-gray-500 truncate">{log.user?.email || 'N/A'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                                        Ref: {log.razorpayOrderId || log.id}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                        <span className="uppercase font-bold">{log.paymentMethod || 'Razorpay'}</span>
                                                        <span>•</span>
                                                        <span>{log.paymentGateway?.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-gray-900 dark:text-white">₹{log.amount}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{formatDate(log.createdAt)}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.paymentLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <FaWallet className="text-gray-200 dark:text-gray-700 text-5xl" />
                                                    <p className="text-gray-400 font-medium">No payment activity recorded yet</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthMonitor;
