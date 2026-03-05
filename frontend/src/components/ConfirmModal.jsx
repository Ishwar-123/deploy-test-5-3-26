import { FaTimes, FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaTrash } from 'react-icons/fa';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning' // warning, danger, success, info
}) => {
    if (!isOpen) return null;

    const typeConfig = {
        warning: {
            icon: FaExclamationTriangle,
            headerBg: 'bg-orange-600',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            buttonBg: 'bg-orange-600 hover:bg-orange-700'
        },
        danger: {
            icon: FaTrash,
            headerBg: 'bg-red-600',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700'
        },
        success: {
            icon: FaCheckCircle,
            headerBg: 'bg-green-600',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            buttonBg: 'bg-green-600 hover:bg-green-700'
        },
        info: {
            icon: FaInfoCircle,
            headerBg: 'bg-blue-600',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            buttonBg: 'bg-blue-600 hover:bg-blue-700'
        }
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className={`${config.headerBg} p-6 text-white flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <Icon className="text-lg" />
                        </div>
                        <h2 className="text-xl font-bold">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
                        {message}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 rounded-lg ${config.buttonBg} text-white font-medium transition-colors text-sm`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
