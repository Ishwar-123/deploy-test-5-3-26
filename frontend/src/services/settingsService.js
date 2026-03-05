import axios from 'axios';
import { API_URL } from '../utils/constants';

const getCatalogUrl = async () => {
    const response = await axios.get(`${API_URL}/settings/catalog`);
    return response.data;
};

const uploadCatalog = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/settings/catalog`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

const getGST = async () => {
    const response = await axios.get(`${API_URL}/settings/gst`);
    return response.data;
};

const updateGST = async (gst) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/settings/gst`, { gst }, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

const getSecuritySettings = async () => {
    const response = await axios.get(`${API_URL}/settings/security`);
    return response.data;
};

const updateSecuritySettings = async (screenshotProtection) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/settings/security`, { screenshotProtection }, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

export default { getCatalogUrl, uploadCatalog, getGST, updateGST, getSecuritySettings, updateSecuritySettings };
