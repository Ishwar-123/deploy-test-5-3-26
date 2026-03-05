import { useEffect, useState } from 'react';
import { getAllVendors, createVendor, updateVendor, grantLicenseToVendor, revokeLicenseFromVendor, deleteVendor } from '../../services/admin';
import toast from '../../utils/sweetalert';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaCheckCircle, FaTimesCircle, FaStore, FaUser, FaPhone, FaBuilding, FaSearch, FaTimes, FaRocket, FaFire, FaBolt, FaUsers, FaShieldAlt, FaBan, FaTrash } from 'react-icons/fa';

const Vendors = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedVendorForLicense, setSelectedVendorForLicense] = useState(null);
    const [selectedVendorForRevoke, setSelectedVendorForRevoke] = useState(null);
    const [selectedVendorForDelete, setSelectedVendorForDelete] = useState(null);
    const [editingVendor, setEditingVendor] = useState(null);

    // Helper to safety parse JSON if needed
    const getVendorDetails = (vendor) => {
        if (!vendor || !vendor.vendorDetails) return {};
        if (typeof vendor.vendorDetails === 'string') {
            try {
                return JSON.parse(vendor.vendorDetails);
            } catch (e) {
                return {};
            }
        }
        return vendor.vendorDetails;
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        companyName: '',
        resaleLimit: 100,
        maxRetailPrice: 10000,
        validityDays: 365
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await getAllVendors();
            setVendors(response.data.vendors);
        } catch (error) {
            toast.error('Failed to load vendors');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingVendor) {
                await updateVendor(editingVendor.id, {
                    name: formData.name,
                    phone: formData.phone,
                    companyName: formData.companyName,
                    isActive: formData.isActive
                });
                toast.success('Vendor updated successfully');
            } else {
                await createVendor(formData);
                toast.success('Vendor created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchVendors();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (vendor) => {
        setEditingVendor(vendor);
        setFormData({
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone || '',
            companyName: vendor.vendorDetails?.companyName || '',
            isActive: vendor.isActive
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            companyName: '',
            resaleLimit: 100,
            maxRetailPrice: 10000,
            validityDays: 365
        });
        setEditingVendor(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleGrantLicenseClick = (vendor) => {
        setSelectedVendorForLicense(vendor);
        setShowLicenseModal(true);
    };

    const confirmGrantLicense = async () => {
        try {
            await grantLicenseToVendor(selectedVendorForLicense.id, {
                resaleLimit: 100,
                maxRetailPrice: 10000,
                validityDays: 365
            });
            toast.success(`License granted to ${selectedVendorForLicense.name}`);
            setShowLicenseModal(false);
            setSelectedVendorForLicense(null);
            fetchVendors();
        } catch (error) {
            console.error(error);
            toast.error('Failed to grant license');
        }
    };

    const handleRevokeLicenseClick = (vendor) => {
        setSelectedVendorForRevoke(vendor);
        setShowRevokeModal(true);
    };

    const confirmRevokeLicense = async () => {
        try {
            await revokeLicenseFromVendor(selectedVendorForRevoke.id);
            toast.warning(`License revoked from ${selectedVendorForRevoke.name}`);
            setShowRevokeModal(false);
            setSelectedVendorForRevoke(null);
            fetchVendors();
        } catch (error) {
            console.error(error);
            toast.error('Failed to revoke license');
        }
    };

    const handleDeleteClick = (vendor) => {
        setSelectedVendorForDelete(vendor);
        setShowDeleteModal(true);
    };

    const confirmDeleteVendor = async () => {
        try {
            await deleteVendor(selectedVendorForDelete.id);
            toast.error(`Vendor ${selectedVendorForDelete.name} deleted`);
            setShowDeleteModal(false);
            setSelectedVendorForDelete(null);
            fetchVendors();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete vendor');
        }
    };

    const filteredVendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vendorDetails?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const activeVendors = vendors.filter(v => v.isActive).length;
    const licensedVendors = vendors.filter(v => v.vendorDetails?.licenseId).length;

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaStore className="admin-accent-text" />
                        Vendor Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage partnerships & seller ecosystem</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="px-4 py-2 admin-accent-bg text-white rounded-lg font-medium text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10"
                >
                    <FaPlus size={14} /> Add Vendor
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Vendors', value: vendors.length, icon: FaUsers, bg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Active Vendors', value: activeVendors, icon: FaFire, bg: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400' },
                    { label: 'Licensed', value: licensedVendors, icon: FaShieldAlt, bg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600 dark:text-purple-400' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`text-xl ${stat.iconColor}`} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stat.value}
                                </h3>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search vendors by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white focus:ring-2 admin-accent-ring admin-accent-border outline-none transition-all"
                />
            </div>

            {/* Vendors Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Vendor Profile</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Contact</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">License</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Limits</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase text-center">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredVendors.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <FaStore className="mx-auto text-4xl text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium">No vendors found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredVendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg admin-accent-bg flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                                    {vendor.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-white text-sm">{vendor.name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <FaBuilding size={8} /> {vendor.vendorDetails?.companyName || 'Freelance'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"><FaUser size={10} className="text-gray-400" /> {vendor.email}</span>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"><FaPhone size={10} className="text-gray-400" /> {vendor.phone || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getVendorDetails(vendor).licenseId ? (
                                                <span className="px-3 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium flex w-fit items-center gap-1.5">
                                                    <FaCheckCircle size={10} /> Licensed
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-medium flex w-fit items-center gap-1.5">
                                                    <FaTimesCircle size={10} /> Unlicensed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {getVendorDetails(vendor).resaleLimit || '0'} <span className="text-xs text-gray-400 font-normal">units</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <span className={`w-2 h-2 rounded-full ${vendor.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleEdit(vendor)}
                                                className="w-8 h-8 inline-flex items-center justify-center rounded-lg admin-accent-bg-soft admin-accent-text hover:admin-accent-bg hover:text-white transition-all shadow-sm mx-1"
                                                title="Edit"
                                            >
                                                <FaEdit size={14} />
                                            </button>

                                            {!getVendorDetails(vendor).licenseId ? (
                                                <button
                                                    onClick={() => handleGrantLicenseClick(vendor)}
                                                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm mx-1"
                                                    title="Grant License"
                                                >
                                                    <FaShieldAlt size={14} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRevokeLicenseClick(vendor)}
                                                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm mx-1"
                                                    title="Revoke License"
                                                >
                                                    <FaBan size={14} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDeleteClick(vendor)}
                                                className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm mx-1"
                                                title="Delete Vendor"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>

                    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-700">
                        {/* Modal Header */}
                        <div className="p-6 admin-accent-bg text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <FaStore className="text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{editingVendor ? 'Edit Vendor' : 'New Vendor'}</h2>
                                    <p className="text-xs text-blue-100">Partner Management</p>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                                <FaTimes />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Account Details */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Details</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Full Name *</label>
                                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Email *</label>
                                            <input type="email" required disabled={editingVendor} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm disabled:opacity-50" placeholder="vendor@example.com" />
                                        </div>
                                    </div>
                                    {!editingVendor && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Password *</label>
                                            <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="Secure password" />
                                        </div>
                                    )}
                                </div>

                                {/* Business Profile */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Profile</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Phone</label>
                                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="+1 (555) 000-0000" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Company</label>
                                            <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="Company name" />
                                        </div>
                                    </div>
                                </div>

                                {/* License (new only) */}
                                {!editingVendor && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initial License</span>
                                            <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Resale Limit</label>
                                                <input type="number" value={formData.resaleLimit} onChange={(e) => setFormData({ ...formData, resaleLimit: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border shadow-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Max Price</label>
                                                <input type="number" value={formData.maxRetailPrice} onChange={(e) => setFormData({ ...formData, maxRetailPrice: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border shadow-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Days</label>
                                                <input type="number" value={formData.validityDays} onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border shadow-sm" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {editingVendor && (
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="isActive" className="text-sm font-bold text-slate-700 dark:text-white cursor-pointer">Active Status</label>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 rounded-2xl admin-accent-bg text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:opacity-90 hover:-translate-y-0.5 transition-all active:scale-95"
                                    >
                                        {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* License Confirmation Modal */}
            {showLicenseModal && selectedVendorForLicense && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLicenseModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 p-6 transform transition-all">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaShieldAlt className="text-3xl text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Grant Vendor License</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to grant a license to <span className="font-bold text-gray-800 dark:text-gray-200">{selectedVendorForLicense.name}</span>?
                            </p>
                            <p className="text-xs text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                This will assign a default <b className="text-gray-600 dark:text-gray-300">1-Year Standard License</b> with a 100-unit resale limit.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLicenseModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmGrantLicense}
                                className="flex-1 py-3 px-4 rounded-xl admin-accent-bg text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <FaShieldAlt size={14} /> Grant License
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Confirmation Modal */}
            {showRevokeModal && selectedVendorForRevoke && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRevokeModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 p-6 transform transition-all">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaBan className="text-3xl text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Revoke Vendor License</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to revoke the license from <span className="font-bold text-gray-800 dark:text-gray-200">{selectedVendorForRevoke.name}</span>?
                            </p>
                            <p className="text-xs text-gray-400 mt-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                                This will remove their selling privileges immediately.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRevokeModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRevokeLicense}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                <FaBan size={14} /> Revoke License
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedVendorForDelete && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 p-6 transform transition-all">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTrash className="text-3xl text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Vendor</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete <span className="font-bold text-red-600">{selectedVendorForDelete.name}</span>?
                            </p>
                            <p className="text-xs text-red-500 mt-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100">
                                This action is permanent. All associated vendor data will be removed.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteVendor}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                <FaTrash size={14} /> Delete Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;
