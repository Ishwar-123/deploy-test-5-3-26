import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaBook, FaFilePdf, FaImage, FaStar, FaChevronRight, FaFilter, FaRocket, FaFire, FaBolt } from 'react-icons/fa';
import toast from '../../utils/sweetalert';
import { motion, AnimatePresence } from 'framer-motion';
import * as admin from '../../services/admin';
import FileUpload from '../../components/FileUpload';
import ConfirmModal from '../../components/ConfirmModal';
import { BOOK_CATEGORIES } from '../../utils/constants';

const Books = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bookToDelete, setBookToDelete] = useState(null);
    const [editingBook, setEditingBook] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        author: '',
        description: '',
        category: 'Civil Engineering',
        language: 'English',
        pageCount: 0,
        retailPrice: 0,
        wholesalePrice: 0,
        coverImage: '',
        fileUrl: '',
        isbn: '',
        publisher: '',
        catalogUrl: '',
        previewPages: [1, 2],
        additionalImages: [],
        manualRating: 0.0,
        useManualRating: false
    });
    const [tempUploadedFiles, setTempUploadedFiles] = useState({
        fileUrl: null,
        coverImage: null,
        catalogUrl: null
    });
    // Key to force re-mount of FileUpload component to clear it after upload
    const [uploadKey, setUploadKey] = useState(0);

    const handleAddPhoto = (result) => {
        if (result) {
            const newImages = Array.isArray(result) ? result : [result];
            setFormData(prev => ({
                ...prev,
                additionalImages: [...(prev.additionalImages || []), ...newImages]
            }));
            // Increment key to reset the uploader
            setUploadKey(prev => prev + 1);
            toast.success(`${newImages.length} photo(s) added to gallery`);
        }
    };

    const handleRemovePhoto = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            additionalImages: prev.additionalImages.filter((_, index) => index !== indexToRemove)
        }));
    };

    useEffect(() => {
        fetchBooks();
    }, [searchTerm]);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await admin.getAllBooks({ search: searchTerm });
            setBooks(response.data.books || []);
        } catch (error) {
            toast.error(error.message || 'Failed to fetch books');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.author || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }
        if (!formData.coverImage) {
            toast.error('Please upload a cover image');
            return;
        }
        if (!formData.fileUrl) {
            toast.error('Please upload a book file (PDF/EPUB)');
            return;
        }

        try {
            if (editingBook) {
                await admin.updateBook(editingBook.id, formData);
                toast.success('Book updated successfully!');
            } else {
                await admin.createBook(formData);
                toast.success('Book created successfully!');
            }
            setShowModal(false);
            resetForm();
            setTempUploadedFiles({ fileUrl: null, coverImage: null });
            fetchBooks();
        } catch (error) {
            toast.error(error.message || 'Failed to save book');
        }
    };

    const handleEdit = (book) => {
        setEditingBook(book);
        // Parse previewPages from DB
        let parsedPreviewPages = [1, 2];
        if (book.previewPages) {
            try {
                parsedPreviewPages = typeof book.previewPages === 'string' ? JSON.parse(book.previewPages) : book.previewPages;
                if (!Array.isArray(parsedPreviewPages) || parsedPreviewPages.length === 0) {
                    parsedPreviewPages = [book.previewStartPage || 1, book.previewEndPage || 2];
                }
            } catch (e) {
                parsedPreviewPages = [book.previewStartPage || 1, book.previewEndPage || 2];
            }
        } else {
            parsedPreviewPages = [book.previewStartPage || 1, book.previewEndPage || 2];
        }
        setFormData({
            title: book.title || '',
            subtitle: book.subtitle || '',
            author: book.author || '',
            description: book.description || '',
            category: book.category || 'Civil Engineering',
            language: book.language || 'English',
            pageCount: book.pageCount || 0,
            retailPrice: book.retailPrice || 0,
            wholesalePrice: book.wholesalePrice || 0,
            coverImage: book.coverImage || '',
            fileUrl: book.fileUrl || '',
            isbn: book.isbn || '',
            publisher: book.publisher || '',
            catalogUrl: book.catalogUrl || '',
            previewPages: parsedPreviewPages,
            manualRating: book.manualRating || 0.0,
            useManualRating: book.useManualRating || false,
            additionalImages: (() => {
                if (Array.isArray(book.additionalImages)) return book.additionalImages;
                try {
                    return typeof book.additionalImages === 'string' ? JSON.parse(book.additionalImages) : [];
                } catch (e) {
                    return [];
                }
            })()
        });
        setShowModal(true);
    };

    const handleDelete = (book) => {
        setBookToDelete(book);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!bookToDelete) return;
        try {
            await admin.deleteBook(bookToDelete.id);
            toast.success('Book deleted successfully!');
            fetchBooks();
        } catch (error) {
            toast.error(error.message || 'Failed to delete book');
        } finally {
            setBookToDelete(null);
            setShowDeleteModal(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            author: '',
            description: '',
            category: 'Civil Engineering',
            language: 'English',
            pageCount: 0,
            retailPrice: 0,
            wholesalePrice: 0,
            coverImage: '',
            fileUrl: '',
            isbn: '',
            publisher: '',
            catalogUrl: '',
            previewPages: [1, 2],
            manualRating: 0.0,
            useManualRating: false
        });
        setEditingBook(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
        setTempUploadedFiles({ fileUrl: null, coverImage: null, catalogUrl: null });
    };

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaBook className="admin-accent-text" />
                        Books Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your entire book catalog</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 admin-accent-bg text-white rounded-lg font-medium text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10"
                >
                    <FaPlus size={14} /> Add Book
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Books', value: books.length, icon: FaBook, bg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Active Books', value: books.filter(b => b.fileUrl).length, icon: FaFilePdf, bg: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400' },
                    { label: 'Categories', value: new Set(books.map(b => b.category)).size, icon: FaFilter, bg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600 dark:text-purple-400' }
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
                    placeholder="Search by title, author, or ISBN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white focus:ring-2 admin-accent-ring admin-accent-border outline-none transition-all"
                />
            </div>

            {/* Books Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Cover</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Book Details</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Category</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Pricing</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-5 h-20 bg-gray-50 dark:bg-gray-700"></td>
                                    </tr>
                                ))
                            ) : books.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <FaBook className="mx-auto text-4xl text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium">No books found in the collection.</p>
                                    </td>
                                </tr>
                            ) : (
                                books.map((book) => (
                                    <tr key={book.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-16 shrink-0">
                                                <img
                                                    src={book.coverImage || 'https://via.placeholder.com/300x450'}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-gray-700"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 min-w-[200px]">
                                            <p className="font-semibold text-gray-800 dark:text-white mb-0.5 truncate">{book.title}</p>
                                            <p className="text-xs text-gray-500">{book.author}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-md admin-accent-bg-soft admin-accent-text text-xs font-medium">
                                                {book.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{book.retailPrice}</span>
                                                <span className="text-xs text-gray-400">W: ₹{book.wholesalePrice}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(book)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg admin-accent-bg-soft admin-accent-text hover:admin-accent-bg hover:text-white transition-all shadow-sm"
                                                >
                                                    <FaEdit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(book)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
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

                    <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-700">
                        {/* Modal Header */}
                        <div className="p-6 admin-accent-bg text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <FaBook className="text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
                                    <p className="text-xs text-blue-100">{editingBook ? `ID: ${editingBook.id}` : 'Fill in the book details'}</p>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                                <FaTimes />
                            </button>
                        </div>

                        {/* Scrollable Form */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                {/* File Uploads */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3 mb-4">
                                            <FaFilePdf className="text-indigo-500" />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">eBook File</span>
                                        </div>
                                        <FileUpload
                                            type="pdf"
                                            label="Drop PDF or EPUB here"
                                            currentFile={formData.fileUrl}
                                            onUploadComplete={(url, metadata) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    fileUrl: url,
                                                    pageCount: metadata?.pageCount || prev.pageCount
                                                }));
                                            }}
                                        />
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3 mb-4">
                                            <FaImage className="text-indigo-500" />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Cover Image</span>
                                        </div>
                                        <FileUpload
                                            type="cover"
                                            label="Upload Cover (JPEG/PNG)"
                                            currentFile={formData.coverImage}
                                            onUploadComplete={(url) => setFormData({ ...formData, coverImage: url })}
                                        />
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 lg:col-span-2">
                                        <div className="flex items-center gap-3 mb-4">
                                            <FaFilePdf className="text-emerald-500" />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Product Catalog (Optional)</span>
                                            <span className="text-[10px] text-slate-400 normal-case tracking-normal ml-auto italic">Specific catalog for this book</span>
                                        </div>
                                        <FileUpload
                                            type="pdf"
                                            label="Upload Book Catalog (PDF)"
                                            currentFile={formData.catalogUrl}
                                            onUploadComplete={(url) => setFormData({ ...formData, catalogUrl: url })}
                                        />
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Basic Information</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Title *</label>
                                            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="Enter book title..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Subtitle</label>
                                            <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="Book subtitle (optional)..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Author *</label>
                                            <input type="text" required value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="Author name..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Category *</label>
                                            <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all shadow-sm">
                                                {BOOK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Language</label>
                                                <input type="text" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border shadow-sm" placeholder="English" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Pages</label>
                                                <input type="number" value={formData.pageCount} onChange={(e) => setFormData({ ...formData, pageCount: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border shadow-sm" placeholder="0" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Description</label>
                                        <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border transition-all resize-none shadow-sm" placeholder="Book synopsis..."></textarea>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pricing & ISBN</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Retail (₹) *</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <input type="number" required value={formData.retailPrice} onChange={(e) => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 pl-9 text-sm font-black text-indigo-600 dark:text-indigo-400 outline-none focus:admin-accent-border transition-all shadow-sm" placeholder="0" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Wholesale (₹) *</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <input type="number" required value={formData.wholesalePrice} onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 pl-9 text-sm font-black text-slate-700 dark:text-slate-300 outline-none focus:admin-accent-border shadow-sm" placeholder="0" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">ISBN</label>
                                            <input type="text" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:admin-accent-border shadow-sm" placeholder="978-3-16..." />
                                        </div>
                                    </div>
                                </div>


                                {/* Additional Photos (Gallery) */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Other Photos (Gallery)</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                        <div className="mb-6">
                                            <FileUpload
                                                key={`gallery-upload-${uploadKey}`}
                                                type="cover" // treating as image
                                                label="Add Photo(s) to Gallery"
                                                onUploadComplete={handleAddPhoto}
                                                multiple={true} // Enable multiple select
                                            />
                                        </div>

                                        {/* Gallery Grid */}
                                        {formData.additionalImages && formData.additionalImages.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                {formData.additionalImages.map((imgUrl, index) => (
                                                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                                                        <img
                                                            src={imgUrl}
                                                            alt={`Gallery ${index + 1}`}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemovePhoto(index)}
                                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-transform hover:scale-110 shadow-lg"
                                                                title="Remove Photo"
                                                            >
                                                                <FaTrash size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                                                            #{index + 1}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {(!formData.additionalImages || formData.additionalImages.length === 0) && (
                                            <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
                                                No additional photos added yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Preview Pages Selection */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preview Pages (Public Access)</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-100 dark:border-blue-900/30">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                <FaBook className="text-white text-lg" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1">Public Preview Settings</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">Choose how many and which specific pages users can preview without purchase</p>
                                            </div>
                                        </div>

                                        {/* Add page input */}
                                        <div className="flex gap-3 mb-4">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={formData.pageCount || 999}
                                                    id="newPreviewPage"
                                                    className="w-full bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm font-black text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500 transition-all shadow-sm"
                                                    placeholder="Enter page number..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = parseInt(e.target.value);
                                                            if (val && val > 0 && !formData.previewPages.includes(val)) {
                                                                setFormData({ ...formData, previewPages: [...formData.previewPages, val].sort((a, b) => a - b) });
                                                                e.target.value = '';
                                                            } else if (formData.previewPages.includes(val)) {
                                                                toast.warning(`Page ${val} is already added`);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const input = document.getElementById('newPreviewPage');
                                                    const val = parseInt(input.value);
                                                    if (val && val > 0 && !formData.previewPages.includes(val)) {
                                                        setFormData({ ...formData, previewPages: [...formData.previewPages, val].sort((a, b) => a - b) });
                                                        input.value = '';
                                                    } else if (formData.previewPages.includes(val)) {
                                                        toast.warning(`Page ${val} is already added`);
                                                    }
                                                }}
                                                className="px-5 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                            >
                                                <FaPlus size={12} /> Add
                                            </button>
                                        </div>

                                        {/* Selected pages */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {formData.previewPages.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic py-2">No preview pages selected. Users won't be able to preview this book.</p>
                                            ) : (
                                                formData.previewPages.map((page, idx) => (
                                                    <div key={idx} className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2 shadow-sm group hover:border-red-300 dark:hover:border-red-700 transition-colors">
                                                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">Page {page}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, previewPages: formData.previewPages.filter((_, i) => i !== idx) })}
                                                            className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all text-xs"
                                                        >
                                                            <FaTimes size={8} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-blue-200 dark:border-blue-800">
                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                <strong className="text-blue-600 dark:text-blue-400">Preview: </strong>
                                                {formData.previewPages.length > 0
                                                    ? `${formData.previewPages.length} page${formData.previewPages.length > 1 ? 's' : ''} — ${formData.previewPages.map(p => `Page ${p}`).join(', ')}`
                                                    : 'No pages selected'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Manual Rating Settings */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating Override</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></span>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                                                    <FaStar className="text-white text-lg" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1">Manual Rating</h4>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Override the calculated average rating</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.useManualRating}
                                                    onChange={(e) => setFormData({ ...formData, useManualRating: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                            </label>
                                        </div>

                                        <div className={`transition-all duration-300 ${formData.useManualRating ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 ml-2">Displayed Rating (0.0 - 5.0)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="5"
                                                    step="0.1"
                                                    value={formData.manualRating}
                                                    onChange={(e) => setFormData({ ...formData, manualRating: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-white dark:bg-gray-900 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm font-black text-amber-600 dark:text-amber-400 outline-none focus:border-amber-500 transition-all shadow-sm"
                                                    disabled={!formData.useManualRating}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
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
                                        {editingBook ? 'Update Book' : 'Publish Book'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div >
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Book"
                message={`Are you sure you want to remove "${bookToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div >
    );
};

export default Books;
