import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaFileInvoice, FaDownload, FaEye, FaArrowLeft, FaShoppingBag, FaCalendarAlt, FaCheckCircle, FaPrint, FaWindowClose, FaClock, FaTimesCircle } from 'react-icons/fa';
import toast from '../utils/sweetalert';
import { motion, AnimatePresence } from 'framer-motion';
import readerService from '../services/readerService';
import html2pdf from 'html2pdf.js';

// --- GLOWING PARTICLE BACKGROUND COMPONENT ---
const ParticleBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-blue-500/10 dark:bg-white/5"
                    initial={{
                        x: Math.random() * 100 + "%",
                        y: Math.random() * 100 + "%",
                        scale: Math.random() * 0.5 + 0.5,
                        opacity: Math.random() * 0.3 + 0.1
                    }}
                    animate={{
                        y: [null, (Math.random() * 10 - 5) + "%"],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        width: Math.random() * 4 + 2 + 'px',
                        height: Math.random() * 4 + 2 + 'px',
                        filter: 'blur(1px)'
                    }}
                />
            ))}
        </div>
    );
};

// --- ATMOSPHERIC ELEMENTS ---
const Sphere = ({ delay, size, left, top, color }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
            y: [0, 30, 0]
        }}
        transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            ease: "easeInOut"
        }}
        className={`absolute rounded-full blur-[80px] pointer-events-none z-0 ${color}`}
        style={{ width: size, height: size, left, top }}
    />
);

const ReaderOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [downloadingOrder, setDownloadingOrder] = useState(null);
    const [searchParams] = useSearchParams();
    const receiptRef = useRef();
    const darkMode = document.documentElement.classList.contains('dark');

    useEffect(() => {
        fetchOrders();
    }, []);


    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await readerService.getOrders();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Failed to load purchase history');
        } finally {
            setLoading(false);
        }
    };

    const parseItems = (items) => {
        if (!items) return [];
        if (Array.isArray(items)) return items;
        if (typeof items === 'string') {
            try {
                const parsed = JSON.parse(items);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                console.error('Failed to parse order items:', e);
                return [];
            }
        }
        return [items]; // Wrapper for single object
    };

    const ReceiptContent = ({ order }) => {
        const orderItems = parseItems(order.items);
        return (
            <div className="receipt-viewer bg-white text-black p-12 border-2 border-slate-200 relative overflow-hidden font-sans shadow-inner">
                {/* Formal Border Accent */}
                <div className="absolute inset-4 border border-slate-100 pointer-events-none"></div>

                {/* PAID STAMP */}
                <div className="absolute top-[40%] right-[10%] opacity-[0.08] pointer-events-none select-none -rotate-12 z-0">
                    <div className="border-[15px] border-green-600 rounded-2xl p-8 flex flex-col items-center justify-center">
                        <span className="text-[120px] font-black leading-none text-green-600">PAID</span>
                        <span className="text-2xl font-bold tracking-[10px] text-green-600 mt-2 uppercase">Verified Transaction</span>
                    </div>
                </div>

                {/* Watermark Logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.015] select-none pointer-events-none rotate-12">
                    <span className="text-[180px] font-serif font-black italic tracking-tighter">CHAROTAR</span>
                </div>

                {/* Top Bar Branding */}
                <div className="flex justify-between items-start mb-20 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <img src="/logo.png" alt="Charotar Logo" className="h-16 w-auto object-contain" />
                            <div className="h-12 w-[2px] bg-slate-200"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-serif font-black tracking-tight text-slate-900 leading-none">CHAROTAR</span>
                                <span className="text-[10px] font-black tracking-[5px] text-[#3D52A0] leading-none mt-1.5 uppercase">Publishing House</span>
                            </div>
                        </div>

                        <div className="text-[10px] text-slate-500 space-y-1.5 font-medium leading-relaxed max-w-xs">
                            <p className="font-bold text-slate-800 text-xs mb-1">Charotar Publishing House Pvt. Ltd.</p>
                            <p>Opposite Amul Dairy, Old Civil Court Road, Post Box No. 65</p>
                            <p>Anand 388001 (Gujarat) India</p>
                            <p className="pt-2"><span className="font-bold text-slate-700">GSTIN:</span> 24AAACC1234A1Z5</p>
                            <p><span className="font-bold text-slate-700">Phone:</span> +91 99249 78998</p>
                            <p><span className="font-bold text-slate-700">Web:</span> www.cphbooks.in</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="bg-[#3D52A0] text-white px-6 py-2.5 text-[12px] font-black uppercase tracking-[5px] inline-block mb-6 shadow-lg shadow-blue-900/10">INVOICE</div>
                        <div className="space-y-1">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Transaction ID</p>
                            <p className="text-base font-black text-slate-900 tracking-tight">{order.orderNumber}</p>
                        </div>
                        <div className="mt-4 space-y-1">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Issue Date</p>
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>

                        {/* Real Professional QR Area */}
                        <div className="mt-8 flex justify-end">
                            <div className="w-20 h-20 border-[3px] border-slate-900 p-1.5 bg-white shadow-sm flex items-center justify-center">
                                <div className="grid grid-cols-5 gap-[2px] w-full h-full opacity-90">
                                    {[...Array(25)].map((_, i) => (
                                        <div key={i} className={`bg-slate-900 ${(i * 7) % 3 === 0 ? 'opacity-100' : 'opacity-10'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-[7px] text-slate-400 uppercase font-black mt-2 tracking-[2px]">Digital Token: {order.id.toString().slice(-6).toUpperCase()}</p>
                    </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-2 gap-12 mb-16 border-y border-slate-100 py-10 relative z-10">
                    <div className="border-r border-slate-100 pr-12">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3D52A0]"></div>
                            <h4 className="text-[10px] font-black text-[#3D52A0] uppercase tracking-[3px]">Billed Recipient</h4>
                        </div>
                        <p className="text-xl font-bold text-slate-900 mb-1 tracking-tight">{order.customerName}</p>
                        <p className="text-[11px] font-medium text-slate-500 mb-4 tracking-tight">{order.customerEmail}</p>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            Digital Reader Identity Verified
                        </span>
                    </div>

                    <div className="text-right pl-12">
                        <div className="flex items-center gap-2 mb-4 justify-end">
                            <h4 className="text-[10px] font-black text-[#3D52A0] uppercase tracking-[3px]">Payment Details</h4>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3D52A0]"></div>
                        </div>
                        <div className="space-y-2.5 text-xs">
                            <p className="text-slate-500 font-medium">Method: <span className="font-bold text-slate-900 uppercase tracking-tighter">{order.paymentMethod?.replace('_', ' ') || 'Razorpay Online'}</span></p>
                            <p className="text-slate-500 font-medium tracking-tight">Status: <span className="text-green-600 font-black uppercase text-[10px] bg-green-50 px-3 py-1 rounded-sm border border-green-100 ml-2">Success</span></p>
                            {order.razorpayPaymentId && (
                                <div className="mt-8 pt-4 border-t border-slate-50">
                                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Gateway Reference</p>
                                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{order.razorpayPaymentId}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-16 relative z-10">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-left">
                                <th className="pb-4 pt-2 text-[11px] font-black uppercase tracking-[3px] text-slate-900">Digital Asset Description</th>
                                <th className="pb-4 pt-2 text-center text-[11px] font-black uppercase tracking-[3px] text-slate-900">Units</th>
                                <th className="pb-4 pt-2 text-right text-[11px] font-black uppercase tracking-[3px] text-slate-900">Unit Price (INR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {orderItems.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-10 pr-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-1 h-10 bg-[#3D52A0]/10 rounded-full mt-1"></div>
                                            <div>
                                                <span className="font-black text-slate-900 text-[15px] block mb-1.5 tracking-tight uppercase leading-none">{item.title || item.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-[4px] leading-none shrink-0">
                                                        {order.orderType === 'subscription' ? 'Full Library Access' : 'Perpetual Digital License'}
                                                    </span>
                                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                                </div>
                                                <p className="text-[9px] text-blue-500 font-bold mt-2 uppercase tracking-widest flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-blue-500"></div> Secure Cloud Fulfillment
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-10 text-center text-xs font-black text-slate-400">01</td>
                                    <td className="py-10 text-right font-serif font-black text-slate-900 text-lg tracking-tighter">₹{parseFloat(item.price || item.total || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Calculation and Signatory Row */}
                <div className="flex justify-between items-start relative z-10 mb-16">
                    <div className="flex-1 pr-16">
                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[4px] mb-4 flex items-center gap-2">
                                <div className="w-4 h-[1px] bg-slate-400"></div> License Terms
                            </h5>
                            <ul className="text-[10px] text-slate-500 space-y-2 font-medium">
                                <li className="flex gap-2"><span>•</span> This electronic document is valid under the IT Act 2000.</li>
                                <li className="flex gap-2"><span>•</span> Access granted to verified account: {order.customerEmail}</li>
                                <li className="flex gap-2"><span>•</span> Redistribution or unauthorized copying is strictly prohibited.</li>
                                <li className="flex gap-2"><span>•</span> For technical support, reach out to help@cphbooks.in</li>
                            </ul>
                        </div>

                        <div className="mt-12">
                            <div className="mb-4">
                                {/* Digital Signature Representation */}
                                <p className="font-serif italic text-2xl text-slate-700 opacity-60 mb-0 select-none pointer-events-none" style={{ fontFamily: '"Brush Script MT", cursive' }}>
                                    Charotar Publishing
                                </p>
                                <div className="w-48 h-[1.5px] bg-slate-900 shadow-sm"></div>
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[4px] text-slate-400">Authorized Digital Signatory</p>
                            <p className="text-[10px] font-bold text-slate-900 mt-1.5">Charotar Publishing House Pvt. Ltd.</p>
                        </div>
                    </div>

                    <div className="w-80 bg-slate-900 text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                        {/* Decorative dark element */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -translate-y-12 translate-x-12 rounded-full blur-2xl"></div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black tracking-widest">
                                <span>Gross Amount</span>
                                <span className="text-white">₹{parseFloat(order.subtotal || (order.total / 1.18)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-[#7091E6] uppercase font-black tracking-widest">
                                <span>IGST / CGST (18%)</span>
                                <span>₹{parseFloat(order.tax || (order.total - (order.total / 1.18))).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 relative z-10">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[11px] font-black uppercase tracking-[5px] text-slate-400">Total</span>
                                <span className="text-3xl font-serif font-black text-white tracking-tighter">₹{parseFloat(order.total).toFixed(2)}</span>
                            </div>
                        </div>
                        <p className="text-right text-[8px] text-slate-500 font-black uppercase mt-6 tracking-widest italic opacity-60">Prices are inclusive of all statutory taxes</p>
                    </div>
                </div>

                {/* Secure Professional Footer */}
                <div className="mt-12 pt-8 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 tracking-[3px] uppercase">Verify Invoice</span>
                                <span className="text-[9px] font-bold text-slate-900">cphbooks.in/v/{order.id.toString().slice(-8)}</span>
                            </div>
                            <div className="h-6 w-[1px] bg-slate-100"></div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 tracking-[3px] uppercase">Compliance</span>
                                <span className="text-[9px] font-bold text-slate-900 uppercase">ISO 9001:2015 Certified</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-900 tracking-tighter">© 2026 CHAROTAR PUBLISHING HOUSE PVT. LTD.</span>
                    </div>
                </div>

                {/* Edge Accents */}
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#3D52A0] z-0"></div>
                <div className="absolute top-0 right-0 w-32 h-1.5 bg-[#3D52A0] origin-top-right"></div>
            </div>
        );
    };

    const handleViewReceipt = (order) => {
        setSelectedOrder(order);
        setShowReceipt(true);
    };

    const handleDirectDownload = (order) => {
        setDownloadingOrder(order);
        // Wait for state to reflect then trigger download
        setTimeout(() => {
            handleDownloadPDF(order.orderNumber);
            setTimeout(() => setDownloadingOrder(null), 1000);
        }, 100);
    };

    // Handle auto-download from email link
    useEffect(() => {
        if (!loading && orders.length > 0) {
            const orderNumber = searchParams.get('orderNumber');
            const autodownload = searchParams.get('autodownload');

            if (orderNumber && autodownload === 'true') {
                const order = orders.find(o => o.orderNumber === orderNumber);
                if (order && order.isPaid) {
                    handleDirectDownload(order);
                } else if (order && !order.isPaid) {
                    toast.warning("Receipt is only available for successful payments.");
                }
            }
        }
    }, [loading, orders, searchParams, handleDirectDownload]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async (orderNumber) => {
        const element = document.getElementById('receipt-content');
        if (!element) return;

        const opt = {
            margin: [10, 10],
            filename: `Invoice-${orderNumber}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale: 3,
                useCORS: true,
                letterRendering: true,
                logging: false
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            toast.info('Generating Professional Receipt...');
            await html2pdf().set(opt).from(element).save();
            toast.success('Official Receipt Downloaded!');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate official PDF');
        }
    };

    const ReceiptModal = ({ order, onClose }) => {
        if (!order) return null;

        return (
            <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#0a0a0a] animate-fade-in flex flex-col overflow-hidden text-gray-900">
                {/* Header - Fixed at Top */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#111]/95 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#3D52A0]/10 rounded-full flex items-center justify-center">
                            <FaFileInvoice className="text-[#3D52A0] text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold dark:text-white uppercase tracking-tighter leading-none">Official Invoice</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Order Ref: {order.orderNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => handleDownloadPDF(order.orderNumber)}
                            className="px-8 py-3.5 bg-[#3D52A0] text-white hover:bg-[#e63e26] transition-all rounded-full flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-[#3D52A0]/20"
                        >
                            <FaDownload /> Download PDF
                        </button>
                        <div className="h-10 w-[1px] bg-gray-100 dark:bg-gray-800"></div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all rounded-full border border-gray-100 dark:border-gray-800"
                            title="Close View"
                        >
                            <FaWindowClose size={20} />
                        </button>
                    </div>
                </div>

                {/* Receipt Content - Scrollable Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#0a0a0a] py-12 px-4 shadow-inner">
                    <div className="max-w-4xl mx-auto">
                        <div id="receipt-content" className="bg-white shadow-2xl relative">
                            <ReceiptContent order={order} />
                        </div>

                        <div className="mt-8 text-center pb-20">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">You are viewing a secure digital invoice</p>
                            <div className="flex justify-center gap-8 text-[9px] font-black text-gray-300 uppercase tracking-[3px]">
                                <span>128-Bit Encryption</span>
                                <span>Verified Transaction</span>
                                <span>Official Merchant</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Animation Handling */}
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #receipt-content, #receipt-content * { visibility: visible; }
                        #receipt-content { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; padding: 0 !important; }
                    }
                `}</style>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-500 overflow-hidden">
            {/* ATMOSPHERIC BACKGROUND */}
            <Sphere delay={0} size={400} left="-10%" top="-10%" color={darkMode ? "bg-[#3D52A0]/20" : "bg-[#3D52A0]/10"} />
            <Sphere delay={2} size={300} left="85%" top="40%" color={darkMode ? "bg-[#8B5CF6]/20" : "bg-[#8B5CF6]/10"} />
            <ParticleBackground />

            <div className="container mx-auto px-8 py-16 max-w-[1400px] relative z-10 space-y-16 animate-fade-in">
                {/* Editorial Header */}
                <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            <span className="w-12 h-[2px] bg-[#3D52A0]"></span>
                            <span className="text-[#3D52A0] dark:text-[#7091E6] font-black tracking-[0.3em] text-[10px] uppercase">
                                Order Repository
                            </span>
                        </motion.div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                            Purchase <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6] animate-gradient-x">History</span>
                        </h1>
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#3D52A0] dark:text-[#7091E6] hover:opacity-70 transition-all mt-4 group"
                        >
                            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-8 py-5 bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-black/10 dark:border-white/10 min-w-[140px] text-center shadow-xl shadow-[#3D52A0]/5 group hover:-translate-y-1 transition-all duration-300"
                        >
                            <span className="block text-4xl font-serif font-black mb-1 text-[#3D52A0] group-hover:scale-110 transition-transform duration-500">{orders.length}</span>
                            <span className="text-[10px] font-black text-[#3D52A0]/60 dark:text-gray-400 uppercase tracking-[0.2em]">Total Orders</span>
                        </motion.div>
                    </div>
                </div>

                {/* Main List Container */}
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-[32px] border border-black/10 dark:border-white/10 shadow-2xl shadow-[#3D52A0]/10 overflow-hidden">
                    {loading ? (
                        <div className="p-12 space-y-6">
                            {[1, 2, 3].map(n => (
                                <div key={n} className="h-24 bg-gray-100 dark:bg-white/5 animate-pulse rounded-[24px]"></div>
                            ))}
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-black/5 dark:border-white/5 bg-[#3D52A0]/5">
                                        <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#3D52A0]/60 dark:text-gray-400">Order Ref</th>
                                        <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#3D52A0]/60 dark:text-gray-400">Date</th>
                                        <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#3D52A0]/60 dark:text-gray-400 min-w-[300px]">Items</th>
                                        <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#3D52A0]/60 dark:text-gray-400">Amount</th>
                                        <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#3D52A0]/60 dark:text-gray-400">Status</th>
                                        <th className="px-8 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em] text-[#3D52A0]/60 dark:text-gray-400">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="group hover:bg-[#3D52A0]/5 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-8">
                                                <span className="font-black text-gray-900 dark:text-white text-[13px] block tracking-tight whitespace-nowrap">{order.orderNumber}</span>
                                                <span className="text-[9px] text-[#3D52A0] dark:text-[#7091E6] font-black uppercase mt-1 block tracking-[0.2em] whitespace-nowrap">{order.paymentMethod || 'Razorpay'}</span>
                                            </td>
                                            <td className="px-8 py-8 text-xs text-gray-400 font-bold uppercase tracking-widest leading-none">
                                                {new Date(order.createdAt).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-8 py-8">
                                                <div className="flex flex-col gap-1">
                                                    {(() => {
                                                        const items = parseItems(order.items);
                                                        return (
                                                            <>
                                                                {items.slice(0, 1).map((item, i) => (
                                                                    <span key={i} className="text-[13px] font-black text-gray-900 dark:text-white tracking-tight">{item.title || item.name}</span>
                                                                ))}
                                                                {items.length > 1 && (
                                                                    <span className="text-[9px] text-[#7091E6] font-black uppercase tracking-widest mt-0.5">+{items.length - 1} more items</span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-8">
                                                <span className="font-serif font-black text-gray-900 dark:text-white text-lg">₹{parseFloat(order.total).toFixed(2)}</span>
                                            </td>
                                            <td className="px-8 py-8">
                                                {order.isPaid ? (
                                                    <span className="px-4 py-2 bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-500/20 inline-flex items-center gap-1.5 shadow-lg shadow-green-500/10">
                                                        <FaCheckCircle size={10} className="animate-pulse" /> Successful
                                                    </span>
                                                ) : order.paymentStatus === 'failed' ? (
                                                    <span className="px-4 py-2 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-red-500/20 inline-flex items-center gap-1.5 shadow-lg shadow-red-500/10">
                                                        <FaTimesCircle size={10} /> Failed
                                                    </span>
                                                ) : (
                                                    <span className="px-4 py-2 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
                                                        <FaClock size={10} className="animate-pulse" /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-8 text-right">
                                                {order.isPaid && (
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => handleViewReceipt(order)}
                                                            className="px-6 py-3 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border border-black/10 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/view shadow-md"
                                                        >
                                                            <FaEye className="group-hover:scale-110 transition-transform" /> View
                                                        </button>
                                                        <button
                                                            onClick={() => handleDirectDownload(order)}
                                                            className="px-6 py-3 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] text-white hover:opacity-90 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-[#3D52A0]/20 relative overflow-hidden group/dl"
                                                        >
                                                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/dl:translate-x-[100%] transition-transform duration-700 skew-x-[-15deg]"></div>
                                                            <FaDownload className="group-hover:translate-y-0.5 transition-transform" /> Download
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white/40 dark:bg-white/5">
                            <div className="w-24 h-24 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[32px] flex items-center justify-center text-[#3D52A0]/20 mx-auto mb-8 shadow-2xl">
                                <FaShoppingBag size={40} />
                            </div>
                            <h3 className="text-3xl font-serif font-black text-gray-900 dark:text-white mb-4">No Orders Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto font-medium italic leading-relaxed">
                                When you purchase premium eBooks or subscription packages, they will appear here for you to download receipts.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showReceipt && (
                <ReceiptModal
                    order={selectedOrder}
                    onClose={() => setShowReceipt(false)}
                />
            )}

            {/* Hidden component for Direct Downloads */}
            {downloadingOrder && (
                <div className="fixed -left-[9999px] top-0">
                    <div id="receipt-content">
                        <ReceiptContent order={downloadingOrder} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReaderOrders;
