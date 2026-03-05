import { useState, useEffect } from 'react';
import { getAllReaders, toggleBlockReader } from '../../services/admin';
import toast from '../../utils/sweetalert';
import { FaUser, FaEnvelope, FaBan, FaCheck, FaSearch } from 'react-icons/fa';
import ConfirmModal from '../../components/ConfirmModal';

const Readers = () => {
    const [readers, setReaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, reader: null, action: null });

    useEffect(() => {
        fetchReaders();
    }, []);

    const fetchReaders = async () => {
        setLoading(true);
        try {
            const response = await getAllReaders();
            setReaders(response.data.readers || response.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async () => {
        const { reader, action } = confirmModal;
        try {
            await toggleBlockReader(reader.id || reader._id);
            toast.success(`User ${action === 'unblock' ? 'unblocked' : 'blocked'} successfully`);
            fetchReaders();
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const filteredReaders = readers.filter(reader =>
        reader.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reader.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FaUser className="admin-accent-text" />
                            Reader Management
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor and manage registered book readers • {readers.length} Users</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search readers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 admin-accent-ring admin-accent-border text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Readers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 h-48 animate-pulse border border-gray-200 dark:border-gray-700"></div>
                    ))
                ) : filteredReaders.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <FaUser className="text-4xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No readers found matching "{searchTerm}"</p>
                    </div>
                ) : (
                    filteredReaders.map((reader) => (
                        <div
                            key={reader.id || reader._id}
                            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-semibold ${reader.isBlocked ? 'bg-red-100 text-red-600' : 'admin-accent-bg text-white shadow-sm'}`}>
                                        {reader.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{reader.name}</h3>
                                        <p className="text-xs text-gray-400">Joined {new Date(reader.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {reader.isBlocked && (
                                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-medium">Blocked</span>
                                )}
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                    <FaEnvelope className="admin-accent-text" />
                                    <span className="truncate">{reader.email}</span>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase">Subscription</span>
                                    <span className="text-xs font-semibold admin-accent-text">{reader.subscriptionPlan || 'Free'}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setConfirmModal({
                                    isOpen: true,
                                    reader,
                                    action: reader.isBlocked ? 'unblock' : 'block'
                                })}
                                className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${reader.isBlocked
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                    }`}
                            >
                                {reader.isBlocked ? <><FaCheck /> Unblock User</> : <><FaBan /> Block Access</>}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, reader: null, action: null })}
                onConfirm={handleToggleBlock}
                title={confirmModal.action === 'block' ? 'Block User' : 'Unblock User'}
                message={`Are you sure you want to ${confirmModal.action} this user? ${confirmModal.action === 'block' ? 'They will lose access to their account.' : 'They will regain access to their account.'}`}
                confirmText={confirmModal.action === 'block' ? 'Block User' : 'Unblock User'}
                type={confirmModal.action === 'block' ? 'danger' : 'success'}
            />
        </div>
    );
};

export default Readers;
