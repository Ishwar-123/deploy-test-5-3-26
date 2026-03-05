import Swal from 'sweetalert2';

// Create a Toast mixin for standard notifications
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    background: '#ffffff',
    color: '#1f2937',
    showClass: {
        popup: 'animate__animated animate__fadeInRight animate__faster'
    },
    hideClass: {
        popup: 'animate__animated animate__fadeOutRight animate__faster'
    },
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);

        // Apply custom glassmorphic styles
        toast.style.borderRadius = '16px';
        toast.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        toast.style.border = '1px solid rgba(255, 255, 255, 0.2)';

        if (document.documentElement.classList.contains('dark')) {
            toast.style.background = 'rgba(31, 41, 55, 0.95)';
            toast.style.color = '#ffffff';
            toast.style.backdropFilter = 'blur(10px)';
        }
    }
});

/**
 * Enhanced Notification Utility using SweetAlert2
 * Provides a similar interface to react-toastify for easier migration
 */
const showAlert = {
    /**
     * Show a transient toast notification
     */
    success: (message) => {
        Toast.fire({
            icon: 'success',
            title: message
        });
    },
    error: (message) => {
        Toast.fire({
            icon: 'error',
            title: message
        });
    },
    info: (message) => {
        Toast.fire({
            icon: 'info',
            title: message
        });
    },
    warning: (message) => {
        Toast.fire({
            icon: 'warning',
            title: message
        });
    },

    /**
     * Show a full modal alert (Premium experience)
     */
    modal: (title, text, icon = 'success') => {
        return Swal.fire({
            title,
            text,
            icon,
            confirmButtonColor: '#3D52A0',
            background: document.documentElement.classList.contains('dark') ? '#1a1a2e' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
            customClass: {
                popup: 'rounded-2xl border-none shadow-2xl font-sans'
            }
        });
    },

    /**
     * Show a confirmation dialog
     */
    confirm: (title, text, confirmButtonText = 'Yes', cancelButtonText = 'Cancel') => {
        return Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3D52A0',
            cancelButtonColor: '#d33',
            confirmButtonText,
            cancelButtonText,
            background: document.documentElement.classList.contains('dark') ? '#1a1a2e' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
            customClass: {
                popup: 'rounded-2xl border-none shadow-2xl font-sans'
            }
        });
    }
};

export default showAlert;
export { showAlert as toast }; // Alias for easier migration
