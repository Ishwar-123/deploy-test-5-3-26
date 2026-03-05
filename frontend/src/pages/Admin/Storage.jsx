import { useState, useEffect } from 'react';
import { FaCloud, FaDatabase, FaImage, FaFilePdf, FaChartPie, FaSync, FaServer } from 'react-icons/fa';
import toast from '../../utils/sweetalert';
import api from '../../services/api';

const Storage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/storage/stats');
            setStats(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch storage stats');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
        toast.success('Storage stats refreshed!');
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">No storage data available</p>
            </div>
        );
    }

    const { storage, resources, bandwidth, transformations } = stats;
    const usagePercentage = storage.usagePercentage || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaCloud className="text-blue-600" />
                        Cloudinary Storage
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor your cloud storage usage</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                    <FaSync className={refreshing ? 'animate-spin' : ''} />
                    Refresh Stats
                </button>
            </div>

            {/* Main Storage Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <FaCloud className="text-xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Total Storage</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cloudinary Account Usage</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {formatNumber(storage.used)} / {formatNumber(storage.total)} Credits
                        </span>
                        <span className={`text-xl font-bold ${usagePercentage > 80 ? 'text-red-500' : usagePercentage > 50 ? 'text-orange-500' : 'text-green-500'}`}>
                            {usagePercentage}%
                        </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${usagePercentage > 80
                                ? 'bg-red-500'
                                : usagePercentage > 50
                                    ? 'bg-orange-500'
                                    : 'bg-green-500'
                                }`}
                            style={{ width: `${usagePercentage}%` }}
                        >
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Available</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                {formatNumber(storage.remaining)} Credits
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Used</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {formatNumber(storage.used)} Credits
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resource Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Images */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                            <FaImage className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(resources.images)}
                        </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cover Images</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Uploaded book covers</p>
                </div>

                {/* PDFs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <FaFilePdf className="text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(resources.raw)}
                        </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">PDF Files</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">eBook documents</p>
                </div>

                {/* Total Resources */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <FaDatabase className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(resources.total)}
                        </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Files</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All resources</p>
                </div>

                {/* Bandwidth */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <FaChartPie className="text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatBytes(bandwidth.used)}
                        </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bandwidth</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monthly usage</p>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transformations */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Transformations</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Used</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {formatNumber(transformations.used)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Limit</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {formatNumber(transformations.limit)}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600"
                                style={{
                                    width: `${Math.min((transformations.used / transformations.limit) * 100, 100)}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Plan Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Plan Information</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Plan Type</span>
                            <span className="font-semibold text-gray-900 dark:text-white capitalize">
                                {stats.plan.plan_name || 'Free'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total Credits</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {formatNumber(storage.total)}
                            </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                                <FaServer />
                                <span>Status: Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Storage;
