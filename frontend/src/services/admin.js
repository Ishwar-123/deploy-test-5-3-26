import api from './api';

// Dashboard
export const getDashboardStats = async () => {
    return await api.get('/admin/dashboard');
};

// Book Submissions
export const getBookSubmissions = async (params) => {
    return await api.get('/admin/submissions', { params });
};

export const approveSubmission = async (id, data) => {
    return await api.put(`/admin/submissions/${id}/approve`, data);
};

export const rejectSubmission = async (id, data) => {
    return await api.put(`/admin/submissions/${id}/reject`, data);
};

// Books CRUD
export const getAllBooks = async (params) => {
    return await api.get('/admin/books', { params });
};

export const createBook = async (data) => {
    return await api.post('/admin/books', data);
};

export const updateBook = async (id, data) => {
    return await api.put(`/admin/books/${id}`, data);
};

export const deleteBook = async (id) => {
    return await api.delete(`/admin/books/${id}`);
};

export const deleteCloudinaryFile = async (fileUrl) => {
    return await api.post('/upload/delete', { fileUrl });
};

// Vendors
export const getAllVendors = async () => {
    return await api.get('/admin/vendors');
};

export const createVendor = async (data) => {
    return await api.post('/admin/vendors', data);
};

export const updateVendor = async (id, data) => {
    return await api.put(`/admin/vendors/${id}`, data);
};

export const grantLicenseToVendor = async (id, data) => {
    return await api.post(`/admin/vendors/${id}/grant-license`, data);
};

export const revokeLicenseFromVendor = async (id) => {
    return await api.post(`/admin/vendors/${id}/revoke-license`);
};

export const deleteVendor = async (id) => {
    return await api.delete(`/admin/vendors/${id}`);
};

// Packages CRUD
export const getAllPackages = async () => {
    return await api.get('/admin/packages');
};

export const createPackage = async (data) => {
    return await api.post('/admin/packages', data);
};

export const updatePackage = async (id, data) => {
    return await api.put(`/admin/packages/${id}`, data);
};

export const deletePackage = async (id) => {
    return await api.delete(`/admin/packages/${id}`);
};

// Readers
export const getAllReaders = async () => {
    return await api.get('/admin/readers');
};

export const toggleBlockReader = async (id) => {
    return await api.put(`/admin/readers/${id}/toggle-block`);
};

// Orders
export const getAllOrders = async (params) => {
    return await api.get('/admin/orders', { params });
};

// Reports
export const getReports = async (params) => {
    return await api.get('/admin/reports', { params });
};

export const getAuthMonitorData = async () => {
    return await api.get('/admin/auth-monitor');
};

export const unlockUser = async (id) => {
    return await api.post(`/admin/auth-monitor/unlock/${id}`);
};

export const expireOTP = async (id) => {
    return await api.post(`/admin/auth-monitor/expire-otp/${id}`);
};
