import { useState, useEffect } from 'react';
import { getBookSubmissions, approveSubmission, rejectSubmission } from '../../services/admin';
import toast from '../../utils/sweetalert';
import { FaFileAlt, FaCheck, FaTimes, FaEye, FaSearch } from 'react-icons/fa';
import ConfirmModal from '../../components/ConfirmModal';

const Submissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    // Modal states
    const [approveModal, setApproveModal] = useState({ isOpen: false, id: null });
    const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchSubmissions();
    }, [filter]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await getBookSubmissions({ status: filter });
            setSubmissions(response.data.submissions || []);
        } catch (error) {
            console.error('Failed to fetch submissions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            await approveSubmission(approveModal.id);
            toast.success('Submission approved!');
            fetchSubmissions();
        } catch (error) {
            toast.error('Failed to approve submission');
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.warning('Please provide a reason for rejection');
            return;
        }

        try {
            await rejectSubmission(rejectModal.id, { reason: rejectReason });
            toast.success('Submission rejected');
            fetchSubmissions();
            setRejectModal({ isOpen: false, id: null });
            setRejectReason('');
        } catch (error) {
            toast.error('Failed to reject submission');
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FaFileAlt className="admin-accent-text" />
                            Book Submissions
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and manage incoming book requests • {submissions.length} Items</p>
                    </div>
                    <div className="flex gap-2">
                        {['pending', 'approved', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${filter === status
                                    ? 'admin-accent-bg text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content list */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                            <FaFileAlt className="text-2xl text-blue-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No {filter} submissions</h3>
                        <p className="text-sm text-gray-500">New submissions will appear here for review.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Book Details</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Vendor</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Submitted</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {submissions.map((sub) => (
                                    <tr
                                        key={sub.id || sub._id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-14 rounded bg-gray-200 shadow-sm overflow-hidden shrink-0">
                                                    {sub.coverImage ? (
                                                        <img src={sub.coverImage} className="w-full h-full object-cover" alt="Cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><FaFileAlt /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 dark:text-white line-clamp-1 text-sm">{sub.title}</h4>
                                                    <p className="text-xs text-gray-500">{sub.category}</p>
                                                    <p className="text-xs font-bold text-green-600">₹{sub.price}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-opacity-10 admin-accent-bg flex items-center justify-center admin-accent-text text-xs font-bold">
                                                    {sub.vendor?.name?.charAt(0) || 'V'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{sub.vendor?.name}</p>
                                                    <p className="text-xs text-gray-400">{sub.vendor?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {new Date(sub.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium border w-fit block ${sub.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                                sub.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                                    'bg-orange-50 text-orange-600 border-orange-200'
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {sub.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => setApproveModal({ isOpen: true, id: sub.id || sub._id })}
                                                            className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors border border-green-200"
                                                            title="Approve"
                                                        >
                                                            <FaCheck size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectModal({ isOpen: true, id: sub.id || sub._id })}
                                                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors border border-red-200"
                                                            title="Reject"
                                                        >
                                                            <FaTimes size={12} />
                                                        </button>
                                                    </>
                                                )}
                                                <button className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors border border-gray-200">
                                                    <FaEye size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Approve Confirmation Modal */}
            <ConfirmModal
                isOpen={approveModal.isOpen}
                onClose={() => setApproveModal({ isOpen: false, id: null })}
                onConfirm={handleApprove}
                title="Approve Submission"
                message="Are you sure you want to approve this book submission? It will be published to the platform immediately."
                confirmText="Approve Book"
                type="success"
            />

            {/* Custom Reject Modal */}
            {rejectModal.isOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectModal({ isOpen: false, id: null })}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="bg-red-600 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FaTimes /> Reject Submission
                            </h2>
                            <button onClick={() => setRejectModal({ isOpen: false, id: null })} className="hover:text-red-100">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Please provide a reason for rejecting this submission. This will be sent to the vendor.
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-red-500 transition-all resize-none shadow-sm min-h-[120px] mb-6"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setRejectModal({ isOpen: false, id: null })}
                                    className="flex-1 py-3 text-gray-500 font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:opacity-90 hover:-translate-y-0.5 transition-all"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Submissions;
