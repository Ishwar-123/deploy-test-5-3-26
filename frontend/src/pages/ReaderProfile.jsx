import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaSave, FaKey } from 'react-icons/fa';
import toast from '../utils/sweetalert';
import authService from '../services/auth';

const ReaderProfile = () => {
    const { user, login, changePin } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        password: '',
        confirmPassword: ''
    });

    // PIN Change state
    const [pinData, setPinData] = useState({
        currentPin: '',
        newPin: '',
        confirmNewPin: ''
    });
    const [pinLoading, setPinLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                currentPassword: '',
                password: '',
                confirmPassword: ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePinChange = (e) => {
        const { name, value } = e.target;
        if (value && !/^\d*$/.test(value)) return;
        if (value.length > 6) return;
        setPinData({ ...pinData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password) {
            if (!formData.currentPassword) {
                toast.error("Current password is required to set a new password");
                setLoading(false);
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error("New passwords don't match");
                setLoading(false);
                return;
            }
        }

        try {
            const updateData = {
                name: formData.name,
            };

            if (formData.password) {
                updateData.password = formData.password;
                updateData.currentPassword = formData.currentPassword;
            }

            const response = await authService.updateProfile(updateData);

            if (response.success) {
                toast.success('Profile updated successfully');
                setIsEditing(false);
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    password: '',
                    confirmPassword: ''
                }));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = async (e) => {
        e.preventDefault();

        if (!pinData.currentPin || pinData.currentPin.length !== 6) {
            toast.error('Current PIN must be 6 digits');
            return;
        }
        if (!pinData.newPin || pinData.newPin.length !== 6) {
            toast.error('New PIN must be 6 digits');
            return;
        }
        if (pinData.newPin !== pinData.confirmNewPin) {
            toast.error("New PINs don't match");
            return;
        }

        setPinLoading(true);
        try {
            await changePin(pinData.currentPin, pinData.newPin);
            setPinData({ currentPin: '', newPin: '', confirmNewPin: '' });
        } catch (error) {
            // Error already handled
        } finally {
            setPinLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-16 px-4 md:px-6 animate-fade-in font-sans selection:bg-[#3D52A0] selection:text-white min-h-screen">
            <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2 relative pb-4 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-16 after:h-1 after:bg-[#3D52A0]">
                Account Settings
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-12 max-w-2xl font-light text-lg">
                Manage your personal information, security preferences, and account details.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-sm border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center shadow-sm relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 group-hover:from-[#3D52A0] group-hover:to-[#ffcc00] transition-all duration-500"></div>

                        <div className="relative mb-6">
                            <div className="h-32 w-32 bg-gray-100 dark:bg-[#222] rounded-full flex items-center justify-center text-4xl font-bold font-serif text-[#3D52A0] shadow-inner mb-4 overflow-hidden border-4 border-white dark:border-[#333]">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-1 tracking-wide">{user?.name}</h2>
                        <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-sm mb-6">
                            {user?.role || 'Valued Reader'}
                        </span>

                        <div className="w-full border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Joined</span>
                                <span className="font-bold text-gray-900 dark:text-gray-300">Dec 2025</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Membership</span>
                                <span className="font-bold text-[#3D52A0]">{user?.currentPlanName || 'Free Tier'}</span>
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-8 w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest hover:bg-[#3D52A0] dark:hover:bg-[#3D52A0] hover:text-white dark:hover:text-white transition-all shadow-lg shadow-black/10 dark:shadow-none"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Column: Details / Form */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Personal Information */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                            <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white uppercase tracking-wide">Personal Information</h3>
                            {isEditing && (
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        if (user) {
                                            setFormData({
                                                name: user.name || '',
                                                email: user.email || '',
                                                currentPassword: '',
                                                password: '',
                                                confirmPassword: ''
                                            });
                                        }
                                    }}
                                    className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest border-b border-transparent hover:border-red-500 pb-0.5"
                                >
                                    Cancel Editing
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#3D52A0] transition-colors">
                                            <FaUser />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-sm bg-gray-50 dark:bg-[#222] text-gray-900 dark:text-white disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-[#111] dark:disabled:text-gray-600 focus:border-[#3D52A0] focus:ring-0 transition-all font-medium text-sm outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                            <FaEnvelope />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            disabled={true}
                                            className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-sm bg-gray-100 dark:bg-[#111] text-gray-400 dark:text-gray-600 cursor-not-allowed font-medium text-sm outline-none"
                                        />
                                    </div>
                                    <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-wide font-bold">Email cannot be changed for security reasons.</p>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="animate-fade-in">
                                    <div className="h-px bg-gray-100 dark:bg-gray-800 w-full my-8"></div>
                                    <h4 className="text-md font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-6">Security Settings</h4>

                                    <div className="space-y-6 mb-8">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#3D52A0] transition-colors">
                                                    <FaLock className="text-red-500 opacity-70" />
                                                </div>
                                                <input
                                                    type="password"
                                                    name="currentPassword"
                                                    value={formData.currentPassword}
                                                    onChange={handleChange}
                                                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-sm bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-[#3D52A0] focus:ring-0 transition-all font-medium text-sm outline-none"
                                                    placeholder="Required to set new password"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#3D52A0] transition-colors">
                                                        <FaLock />
                                                    </div>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-sm bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-[#3D52A0] focus:ring-0 transition-all font-medium text-sm outline-none"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#3D52A0] transition-colors">
                                                        <FaLock />
                                                    </div>
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-sm bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-[#3D52A0] focus:ring-0 transition-all font-medium text-sm outline-none"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-3 bg-[#3D52A0] text-white rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-[#3D52A0]/30"
                                        >
                                            {loading ? 'Processing...' : <><FaSave /> Save Changes</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* ============ CHANGE PIN SECTION ============ */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 shadow-sm">
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#3D52A0] to-[#7091E6] rounded-lg flex items-center justify-center">
                                <FaKey className="text-white text-sm" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white uppercase tracking-wide">Change PIN</h3>
                                <p className="text-xs text-gray-400 font-medium">Update your 6-digit security PIN</p>
                            </div>
                        </div>

                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Current PIN</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#3D52A0] transition-colors">
                                        <FaLock className="text-red-500 opacity-70" />
                                    </div>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        name="currentPin"
                                        value={pinData.currentPin}
                                        onChange={handlePinChange}
                                        maxLength={6}
                                        className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-sm bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-[#3D52A0] focus:ring-0 transition-all font-medium text-sm outline-none tracking-[0.5em]"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">New PIN</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#3D52A0] transition-colors">
                                            <FaKey />
                                        </div>
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            name="newPin"
                                            value={pinData.newPin}
                                            onChange={handlePinChange}
                                            maxLength={6}
                                            className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-sm bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-[#3D52A0] focus:ring-0 transition-all font-medium text-sm outline-none tracking-[0.5em]"
                                            placeholder="••••••"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Confirm New PIN</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#3D52A0] transition-colors">
                                            <FaKey />
                                        </div>
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            name="confirmNewPin"
                                            value={pinData.confirmNewPin}
                                            onChange={handlePinChange}
                                            maxLength={6}
                                            className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-sm bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-[#3D52A0] focus:ring-0 transition-all font-medium text-sm outline-none tracking-[0.5em]"
                                            placeholder="••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={pinLoading}
                                    className="px-8 py-3 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] text-white rounded-sm font-bold text-xs uppercase tracking-widest hover:from-[#7091E6] hover:to-[#3D52A0] transition-all flex items-center gap-2 shadow-lg shadow-[#3D52A0]/30"
                                >
                                    {pinLoading ? 'Updating...' : <><FaKey /> Update PIN</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReaderProfile;
