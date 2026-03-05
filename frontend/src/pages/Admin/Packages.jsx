import { useEffect, useState } from 'react';
import { getAllPackages, createPackage, updatePackage, deletePackage } from '../../services/admin';
import toast from '../../utils/sweetalert';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaCrown, FaGem, FaShieldAlt, FaRocket, FaCheckCircle, FaBook } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';

const Packages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        bookLimit: '',
        isUnlimited: false,
        hasVerifiedBadge: false,
        isRecommended: false,
        monthlyPrice: '',
        yearlyPrice: '',
        lifetimePrice: '',
        wholesaleMonthlyPrice: '',
        wholesaleYearlyPrice: '',
        description: '',
        features: [''],
        isActive: true
    });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, packageId: null, packageName: '' });

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await getAllPackages();
            setPackages(response.data.packages || response.data || []);
        } catch (error) {
            toast.error('Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                features: formData.features.filter(f => f.trim() !== '')
            };

            if (editingPackage) {
                await updatePackage(editingPackage.id, data);
                toast.success('Package updated successfully');
            } else {
                await createPackage(data);
                toast.success('Package created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchPackages();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (pkg) => {
        // Parse features safely
        let features = pkg.features;
        if (typeof features === 'string') {
            try {
                features = JSON.parse(features);
            } catch (e) {
                features = [];
            }
        }
        if (!Array.isArray(features)) {
            features = [];
        }

        setEditingPackage(pkg);
        setFormData({
            name: pkg.name,
            bookLimit: pkg.bookLimit,
            isUnlimited: pkg.isUnlimited || false,
            hasVerifiedBadge: pkg.hasVerifiedBadge || false,
            isRecommended: pkg.isRecommended || false,
            monthlyPrice: pkg.monthlyPrice,
            yearlyPrice: pkg.yearlyPrice,
            lifetimePrice: pkg.lifetimePrice || '',
            wholesaleMonthlyPrice: pkg.wholesaleMonthlyPrice,
            wholesaleYearlyPrice: pkg.wholesaleYearlyPrice,
            description: pkg.description || '',
            features: features.length > 0 ? features : [''],
            isActive: pkg.isActive
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        try {
            await deletePackage(confirmDelete.packageId);
            toast.success('Package deleted successfully');
            fetchPackages();
        } catch (error) {
            toast.error('Failed to delete package');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            bookLimit: '',
            isUnlimited: false,
            hasVerifiedBadge: false,
            isRecommended: false,
            monthlyPrice: '',
            yearlyPrice: '',
            lifetimePrice: '',
            wholesaleMonthlyPrice: '',
            wholesaleYearlyPrice: '',
            description: '',
            features: [''],
            isActive: true
        });
        setEditingPackage(null);
    };

    // Helper for Package Card Preview - Premium Glass Style
    // Helper for Package Card Preview - Clean Admin Style
    const PackageCard = ({ pkg, preview = false }) => (
        <div className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 border transition-all duration-300 flex flex-col h-full overflow-hidden
            ${pkg.isRecommended
                ? 'admin-accent-border ring-1 admin-accent-ring shadow-md'
                : 'border-gray-200 dark:border-gray-700 hover:shadow-lg'
            }
            ${preview ? 'scale-90 origin-top' : ''}
        `}>
            {pkg.isRecommended && (
                <div className="absolute top-0 right-0">
                    <div className="admin-accent-bg text-white px-3 py-1 rounded-bl-lg font-bold text-[10px] uppercase tracking-wider shadow-sm">
                        Recommended
                    </div>
                </div>
            )}

            <div className="text-center mb-6 mt-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{pkg.name || 'Package Name'}</h3>
                <div className="flex items-center justify-center gap-1 text-gray-900 dark:text-white">
                    <span className="text-3xl font-bold">₹{pkg.monthlyPrice || '0'}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase self-end mb-1">/mo</span>
                </div>
                {pkg.description && <p className="text-xs text-gray-500 mt-3 leading-relaxed px-2">{pkg.description}</p>}
            </div>

            <div className="space-y-3 flex-1 mb-6">
                {pkg.isUnlimited ? (
                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200 p-3 rounded-lg admin-accent-bg-soft border border-opacity-20 admin-accent-border">
                        <div className="w-8 h-8 rounded-lg admin-accent-bg flex items-center justify-center text-white">
                            <FaRocket />
                        </div>
                        <div className="flex-1">
                            <span className="block admin-accent-text font-bold">Unlimited Reading</span>
                            <span className="text-[10px] admin-accent-text opacity-70 uppercase tracking-wider font-black">All Access</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-blue-600">
                            <FaBook />
                        </div>
                        <div className="flex-1">
                            <span className="block text-gray-900 dark:text-gray-300">{pkg.bookLimit || 0} Books Limit</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Per Month</span>
                        </div>
                    </div>
                )
                }

                {/* Parse features safely */}
                {(() => {
                    let features = pkg.features;
                    // If features is a string, try to parse it
                    if (typeof features === 'string') {
                        try {
                            features = JSON.parse(features);
                        } catch (e) {
                            features = [];
                        }
                    }
                    // Ensure it's an array
                    if (!Array.isArray(features)) {
                        features = [];
                    }

                    return features.map((feature, idx) => feature && (
                        <div key={idx} className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 pl-2">
                            <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                            <span className="leading-snug">{feature}</span>
                        </div>
                    ));
                })()}
            </div>

            {!preview && (
                <div className="relative z-10 mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Yearly</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">₹{pkg.yearlyPrice}</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Lifetime</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">₹{pkg.lifetimePrice || '-'}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => handleEdit(pkg)} className="flex-1 py-3 admin-accent-bg-soft admin-accent-text rounded-xl font-black text-[10px] uppercase tracking-widest hover:admin-accent-bg hover:text-white transition-all shadow-sm">
                            Edit Plan
                        </button>
                        <button
                            onClick={() => setConfirmDelete({ isOpen: true, packageId: pkg.id, packageName: pkg.name })}
                            className="w-12 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                        >
                            <FaTrash size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaGem className="admin-accent-text" />
                        Package Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage subscription tiers & pricing • {packages.length} Plans</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="px-4 py-2 admin-accent-bg text-white rounded-lg font-medium text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                >
                    <FaPlus size={14} /> Create Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {packages.map((pkg) => (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                        >
                            <PackageCard pkg={pkg} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>


            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }}></div>

                    {/* Modal Content */}
                    <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-700">
                        {/* Modal Header */}
                        <div className="p-6 admin-accent-bg text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <FaGem className="text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{editingPackage ? 'Edit Package Plan' : 'Create New Package'}</h2>
                                    <p className="text-xs text-blue-100">{editingPackage ? `ID: ${editingPackage.id}` : 'Define subscription tiers & benefits'}</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                                <FaTimes />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10">
                            <form onSubmit={handleSubmit} className="space-y-10 group">

                                {/* 1. Basic Metadata */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Package Basics</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Plan Name *</label>
                                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="e.g. Premium Plan" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Description</label>
                                            <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all resize-none shadow-sm" placeholder="Short description of the plan..."></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Pricing Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pricing Configuration</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Monthly Price (₹) *</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <input type="number" required value={formData.monthlyPrice} onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 pl-9 text-sm font-black text-indigo-600 dark:text-indigo-400 outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="0" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Yearly Price (₹) *</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <input type="number" required value={formData.yearlyPrice} onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 pl-9 text-sm font-black text-slate-700 dark:text-slate-300 outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="0" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Lifetime (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <input type="number" value={formData.lifetimePrice} onChange={(e) => setFormData({ ...formData, lifetimePrice: parseFloat(e.target.value) || 0 })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 pl-9 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border shadow-sm" placeholder="0" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Wholesale Mo.</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <input type="number" value={formData.wholesaleMonthlyPrice} onChange={(e) => setFormData({ ...formData, wholesaleMonthlyPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 pl-9 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border shadow-sm" placeholder="0" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Wholesale Yr.</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <input type="number" value={formData.wholesaleYearlyPrice} onChange={(e) => setFormData({ ...formData, wholesaleYearlyPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 pl-9 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border shadow-sm" placeholder="0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Features & limits */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access & Features</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>

                                    {/* Toggles */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="block text-sm font-bold text-slate-900 dark:text-white">Unlimited Access</span>
                                                <span className="text-[10px] text-slate-400 font-bold">Bypass book limits</span>
                                            </div>
                                            <button type="button" onClick={() => setFormData({ ...formData, isUnlimited: !formData.isUnlimited })} className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${formData.isUnlimited ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${formData.isUnlimited ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        {!formData.isUnlimited && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Book Limit</label>
                                                <input type="number" value={formData.bookLimit} onChange={(e) => setFormData({ ...formData, bookLimit: e.target.value })} className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-800 rounded-xl p-2 px-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border" placeholder="Limit..." />
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="block text-sm font-bold text-slate-900 dark:text-white">Verified Badge</span>
                                                <span className="text-[10px] text-slate-400 font-bold">Show verified icon</span>
                                            </div>
                                            <button type="button" onClick={() => setFormData({ ...formData, hasVerifiedBadge: !formData.hasVerifiedBadge })} className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${formData.hasVerifiedBadge ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${formData.hasVerifiedBadge ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="block text-sm font-bold text-slate-900 dark:text-white">Recommended</span>
                                                <span className="text-[10px] text-slate-400 font-bold">Highlight this plan</span>
                                            </div>
                                            <button type="button" onClick={() => setFormData({ ...formData, isRecommended: !formData.isRecommended })} className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${formData.isRecommended ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${formData.isRecommended ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Feature List */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Plan Features</label>
                                        {formData.features.map((feature, index) => (
                                            <div key={index} className="flex gap-2 group">
                                                <div className="flex-1 relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                                                        <FaCheck className="text-xs" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={feature}
                                                        onChange={(e) => {
                                                            const newFeatures = [...formData.features];
                                                            newFeatures[index] = e.target.value;
                                                            setFormData({ ...formData, features: newFeatures });
                                                        }}
                                                        className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-10 text-sm font-medium text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm"
                                                        placeholder={`Feature ${index + 1}`}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                setFormData({ ...formData, features: [...formData.features, ''] });
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (formData.features.length > 1) {
                                                                const newFeatures = formData.features.filter((_, i) => i !== index);
                                                                setFormData({ ...formData, features: newFeatures });
                                                            }
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <FaTimes size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, features: [...formData.features, ''] })}
                                            className="ml-2 text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-widest transition-colors"
                                        >
                                            <FaPlus className="text-[10px]" /> Add Another Feature
                                        </button>
                                    </div>
                                </div>

                                {/* Footer Actions Wrapper */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100 dark:border-slate-800 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 rounded-2xl admin-accent-bg text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:opacity-90 hover:-translate-y-0.5 transition-all active:scale-95"
                                    >
                                        {editingPackage ? 'Update Plan' : 'Create Package'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, packageId: null, packageName: '' })}
                onConfirm={handleDelete}
                title="Delete Package"
                message={`Are you sure you want to delete the package "${confirmDelete.packageName}"? This action cannot be undone.`}
                confirmText="Delete Package"
                type="danger"
            />
        </div>
    );
};

export default Packages;
