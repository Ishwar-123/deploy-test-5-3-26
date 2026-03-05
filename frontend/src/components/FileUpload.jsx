import { useState } from 'react';
import { FaCloudUploadAlt, FaFilePdf, FaImage, FaCheckCircle, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../utils/constants';
import { pdfjs } from 'react-pdf';

// Initialize PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FileUpload = ({ onUploadComplete, type = 'pdf', label, currentFile, multiple = false }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(currentFile || null);
    const [error, setError] = useState(null);

    const getPDFPageCount = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            return pdf.numPages;
        } catch (error) {
            console.error('Error getting PDF page count:', error);
            return null;
        }
    };

    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);

        // Multiple file upload logic
        if (multiple && type === 'cover') {
            const formData = new FormData();
            // Validate all files
            for (let i = 0; i < files.length; i++) {
                if (!files[i].type.startsWith('image/')) {
                    setError('Please upload only image files');
                    setUploading(false);
                    return;
                }
                formData.append('covers', files[i]);
            }

            try {
                const token = localStorage.getItem('token');
                const response = await axios.post(
                    `${API_URL}/upload/cover/multiple`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                        onUploadProgress: (progressEvent) => {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            setProgress(percentCompleted);
                        }
                    }
                );

                const uploadedUrls = response.data.data.files.map(file => file.url);
                // For multiple files, we don't set a single 'uploadedFile' state to show preview
                // Instead we immediately callback and let parent handle it
                onUploadComplete(uploadedUrls);
                setUploading(false);
                setProgress(0);
                return;
            } catch (error) {
                console.error('Multiple upload error:', error);
                setError(error.response?.data?.message || 'Upload failed');
                setUploading(false);
                setProgress(0);
                return;
            }
        }

        // Single file upload logic (original)
        const file = files[0];

        // Validate file type
        if (type === 'pdf' && !['application/pdf', 'application/epub+zip'].includes(file.type)) {
            setError('Please upload a PDF or EPUB file');
            return;
        }

        if (type === 'cover' && !file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        let metadata = {};
        if (type === 'pdf' && file.type === 'application/pdf') {
            const pageCount = await getPDFPageCount(file);
            if (pageCount) {
                metadata.pageCount = pageCount;
            }
        }

        const formData = new FormData();
        formData.append(type, file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/upload/${type}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    }
                }
            );

            const uploadedUrl = response.data.data.url;
            setUploadedFile(uploadedUrl);
            onUploadComplete(uploadedUrl, metadata);
            setUploading(false);
            setProgress(0);
        } catch (error) {
            console.error('Upload error:', error);
            setError(error.response?.data?.message || 'Upload failed');
            setUploading(false);
            setProgress(0);
        }
    };

    const removeFile = async () => {
        // Delete from Cloudinary if it's a Cloudinary URL
        if (uploadedFile && uploadedFile.includes('cloudinary.com')) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
                    `${API_URL}/upload/delete`,
                    { fileUrl: uploadedFile },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                console.log('File deleted from Cloudinary:', uploadedFile);
            } catch (error) {
                console.error('Error deleting file from Cloudinary:', error);
            }
        }

        setUploadedFile(null);
        onUploadComplete('');
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label}
                </label>
            )}

            {!uploadedFile ? (
                <div className="relative">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 group bg-white dark:bg-gray-900 shadow-sm">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {type === 'pdf' ? (
                                <FaFilePdf className="w-12 h-12 mb-3 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                                <FaImage className="w-12 h-12 mb-3 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                            )}
                            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-semibold admin-accent-text">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                                {type === 'pdf' ? 'PDF or EPUB (max 50MB)' : 'JPG, PNG or WEBP (max 5MB)'}
                            </p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept={type === 'pdf' ? '.pdf,.epub' : 'image/*'}
                            onChange={handleUpload}
                            disabled={uploading}
                            multiple={multiple}
                        />
                    </label>

                    {uploading && (
                        <div className="mt-4 bg-white dark:bg-gray-950 rounded-2xl p-5 border-2 border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uploading File...</span>
                                <span className="text-sm font-black admin-accent-text">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div
                                    className="admin-accent-bg h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                            <FaTimes className="flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-950 rounded-2xl p-4 border-2 border-emerald-100 dark:border-emerald-900/30 shadow-sm shadow-emerald-500/5">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <FaCheckCircle className="text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">File Ready</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                {uploadedFile.split('/').pop()}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate font-mono mt-0.5">
                                {uploadedFile.substring(0, 50)}...
                            </p>
                        </div>
                        <button
                            onClick={removeFile}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            title="Remove file"
                        >
                            <FaTimes size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
