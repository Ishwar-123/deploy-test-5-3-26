import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaCog, FaUser, FaBell, FaShieldAlt, FaPalette, FaGlobe,
    FaSave, FaSync, FaLock, FaDatabase, FaCreditCard, FaCheck
} from 'react-icons/fa';
import toast from '../../utils/sweetalert';
import { useTheme } from '../../context/ThemeContext';

import { useAuth } from '../../context/AuthContext';
import settingsService from '../../services/settingsService';

const Settings = () => {
    const { user } = useAuth();
    const { adminTheme, setAdminTheme, isDeveloperMode, setIsDeveloperMode } = useTheme();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [gst, setGst] = useState(18);
    const [screenshotProtection, setScreenshotProtection] = useState(true);

    useEffect(() => {
        settingsService.getGST()
            .then(data => { if (data.gst !== undefined) setGst(data.gst); })
            .catch(err => console.log('GST fetch error:', err));

        settingsService.getSecuritySettings()
            .then(data => { if (data.screenshotProtection !== undefined) setScreenshotProtection(data.screenshotProtection); })
            .catch(err => console.log('Security settings fetch error:', err));
    }, []);

    // Local states for deferred saving
    const [localTheme, setLocalTheme] = useState(adminTheme);
    const [localDevMode, setLocalDevMode] = useState(isDeveloperMode);

    const [profileData, setProfileData] = useState({
        name: user?.name || 'Admin User',
        email: user?.email || 'admin@bookverse.com',
        phone: user?.phone || '+91 98765 43210',
        bio: 'Chief Platform Administrator. Managing library operations and vendor relations.'
    });

    const tabs = [
        { id: 'general', label: 'General', icon: FaCog },
        { id: 'profile', label: 'Admin Profile', icon: FaUser },
        { id: 'appearance', label: 'Appearance', icon: FaPalette },
        { id: 'security', label: 'Security', icon: FaShieldAlt },
        { id: 'billing', label: 'Billing & Plans', icon: FaCreditCard },
        { id: 'advanced', label: 'Advanced', icon: FaDatabase },
    ];

    const themes = [
        { id: 'blue', label: 'Blue', color: '#2563eb', bgClass: 'bg-blue-500' },
        { id: 'purple', label: 'Purple', color: '#9333ea', bgClass: 'bg-purple-500' },
        { id: 'emerald', label: 'Emerald', color: '#10b981', bgClass: 'bg-emerald-500' },
        { id: 'rose', label: 'Rose', color: '#f43f5e', bgClass: 'bg-rose-500' },
        { id: 'amber', label: 'Amber', color: '#f59e0b', bgClass: 'bg-amber-500' },
        { id: 'indigo', label: 'Indigo', color: '#4f46e5', bgClass: 'bg-indigo-500' },
        { id: 'cyan', label: 'Cyan', color: '#0891b2', bgClass: 'bg-cyan-500' },
        { id: 'violet', label: 'Violet', color: '#7c3aed', bgClass: 'bg-violet-500' },
        { id: 'orange', label: 'Orange', color: '#f97316', bgClass: 'bg-orange-500' },
        { id: 'lime', label: 'Lime', color: '#84cc16', bgClass: 'bg-lime-500' },
        { id: 'fuchsia', label: 'Fuchsia', color: '#d946ef', bgClass: 'bg-fuchsia-500' },
        { id: 'slate', label: 'Slate', color: '#475569', bgClass: 'bg-slate-500' },
    ];

    const handleSave = async () => {
        setLoading(true);

        try {
            // 1. Save Appearance (Internal Context)
            setAdminTheme(localTheme);
            setIsDeveloperMode(localDevMode);

            // 2. Save GST to backend
            await settingsService.updateGST(gst);

            // 3. Save Security Settings
            await settingsService.updateSecuritySettings(screenshotProtection);

            toast.success('Settings updated successfully!');
        } catch (error) {
            console.error('Save settings error:', error);
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex justify-between items-center bg-opacity-80 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaCog className="admin-accent-text" />
                        System Settings
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your platform preferences and admin controls</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 admin-accent-bg text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-70 shadow-lg"
                >
                    {loading ? <FaSync className="animate-spin" /> : <FaSave />}
                    Save Changes
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-bold transition-all border-l-4 ${activeTab === tab.id
                                    ? 'bg-gray-50 dark:bg-gray-900/40 admin-accent-text admin-accent-border'
                                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <tab.icon className={activeTab === tab.id ? 'admin-accent-text' : 'text-gray-400'} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings Content */}
                <div className="flex-1">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm min-h-[500px]"
                    >
                        {activeTab === 'appearance' && (
                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <FaPalette className="admin-accent-text" /> Theme & Aesthetics
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        {themes.map((t) => (
                                            <div
                                                key={t.id}
                                                onClick={() => setLocalTheme(t.id)}
                                                className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all text-center relative overflow-hidden ${localTheme === t.id
                                                    ? 'admin-accent-border bg-gray-50 dark:bg-gray-900/40 shadow-xl scale-105'
                                                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                {localTheme === t.id && (
                                                    <div className="absolute top-2 right-2 admin-accent-text">
                                                        <FaCheck className="text-xs" />
                                                    </div>
                                                )}
                                                <div className={`w-12 h-12 rounded-full mx-auto mb-3 ${t.bgClass} shadow-lg ring-4 ring-white dark:ring-gray-800 transition-transform group-hover:scale-110`}></div>
                                                <span className={`text-xs font-black uppercase tracking-widest ${localTheme === t.id ? 'admin-accent-text' : 'text-gray-500'}`}>
                                                    {t.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${localDevMode ? 'admin-accent-bg text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                                <FaDatabase className="text-xl" />
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-bold transition-colors ${localDevMode ? 'admin-accent-text' : 'text-gray-900 dark:text-white'}`}>Developer Mode Font</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Force monospaced 'JetBrains Mono' font across all admin screens.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setLocalDevMode(!localDevMode)}
                                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none ${localDevMode ? 'admin-accent-bg' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all shadow-md ${localDevMode ? 'translate-x-8' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </section>

                                <section className="pt-6">
                                    <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                                        <p className="text-xs text-gray-400 italic">Pre-viewing theme in real-time. Changes are applied globally.</p>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">General Configuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Platform Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:admin-accent-border rounded-xl px-5 py-4 text-sm outline-none transition-all dark:text-white font-bold shadow-sm"
                                            defaultValue="BookVerse Pro"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Support Email</label>
                                        <input
                                            type="email"
                                            className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:admin-accent-border rounded-xl px-5 py-4 text-sm outline-none transition-all dark:text-white font-bold shadow-sm"
                                            defaultValue="support@bookverse.com"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">GST Percentage (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={gst}
                                                onChange={(e) => setGst(e.target.value)}
                                                className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:admin-accent-border rounded-xl px-5 py-4 text-sm outline-none transition-all dark:text-white font-bold shadow-sm"
                                                min="0"
                                                max="100"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 italic">This value will be used globally for tax calculations during checkout.</p>
                                    </div>
                                </div>


                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Profile Information</h3>

                                    <div className="flex flex-col md:flex-row gap-10 items-start">
                                        {/* Avatar Section */}
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative group">
                                                <div className="w-32 h-32 rounded-3xl admin-accent-bg flex items-center justify-center text-white text-4xl font-black shadow-2xl transition-transform group-hover:scale-[1.02]">
                                                    {profileData.name.charAt(0).toUpperCase()}
                                                </div>
                                                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:admin-accent-text transition-colors">
                                                    <FaUser size={16} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator</p>
                                        </div>

                                        {/* Fields Area */}
                                        <div className="flex-1 w-full space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.name}
                                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                        className="w-full bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 focus:admin-accent-border rounded-xl px-4 py-3.5 text-sm outline-none transition-all dark:text-white font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                                                    <input
                                                        type="email"
                                                        value={profileData.email}
                                                        disabled
                                                        className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent rounded-xl px-4 py-3.5 text-sm outline-none text-gray-500 font-bold cursor-not-allowed"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Phone Number</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.phone}
                                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                        className="w-full bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 focus:admin-accent-border rounded-xl px-4 py-3.5 text-sm outline-none transition-all dark:text-white font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Role Status</label>
                                                    <div className="w-full bg-green-50 dark:bg-green-900/10 border-2 border-green-100 dark:border-green-900/30 rounded-xl px-4 py-3.5 text-sm text-green-600 dark:text-green-400 font-black uppercase tracking-widest">
                                                        Super Admin
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Admin Bio</label>
                                                <textarea
                                                    rows="3"
                                                    value={profileData.bio}
                                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                                    className="w-full bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 focus:admin-accent-border rounded-xl px-4 py-3.5 text-sm outline-none transition-all dark:text-white font-bold resize-none"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <FaShieldAlt className="admin-accent-text" /> Content Security & Rights
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${screenshotProtection ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                                    <FaLock className="text-xl" />
                                                </div>
                                                <div>
                                                    <h4 className={`text-sm font-bold transition-colors ${screenshotProtection ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>Screenshot Protection</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Prevent PrintScreen, Screenshots, and right-click in all readers.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setScreenshotProtection(!screenshotProtection)}
                                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none ${screenshotProtection ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all shadow-md ${screenshotProtection ? 'translate-x-8' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 flex items-center justify-between group opacity-50 cursor-not-allowed">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center">
                                                    <FaGlobe className="text-xl" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">IP-Based Rate Limiting</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Prevent automated scraping by limiting requests per IP.</p>
                                                </div>
                                            </div>
                                            <div className="bg-gray-300 dark:bg-gray-600 h-7 w-14 rounded-full relative">
                                                <span className="inline-block h-5 w-5 transform rounded-full bg-white absolute left-1 top-1 shadow-md" />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {['billing', 'advanced'].includes(activeTab) && (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                                <FaCog className="text-5xl text-gray-200 dark:text-gray-700 mb-4 animate-spin-slow" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Module Initializing</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs uppercase tracking-tighter">Advanced admin controls are being synced with the database.</p>
                            </div>
                        )}
                    </motion.div>
                </div >
            </div >
        </div >
    );
};

export default Settings;
