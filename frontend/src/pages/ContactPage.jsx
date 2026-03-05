import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import {
    FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaWhatsapp,
    FaGlobe, FaArrowRight, FaCheckCircle, FaCircleNotch
} from 'react-icons/fa';

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }
    })
};

const ContactPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Compose mailto link as fallback (no backend needed)
        await new Promise(r => setTimeout(r, 900));
        const mailtoLink = `mailto:charotar@cphbooks.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
        window.location.href = mailtoLink;
        setLoading(false);
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitted(false), 5000);
    };

    const contactItems = [
        {
            icon: FaMapMarkerAlt,
            label: 'Address',
            gradient: 'from-[#3D52A0] to-[#5a6fbc]',
            lines: [
                { text: 'Charotar Publishing House Pvt. Ltd.', bold: true },
                { text: 'Opposite Amul Dairy,' },
                { text: 'Old Civil Court Road,' },
                { text: 'Anand 388001 (Gujarat) India' },
            ],
            href: 'https://maps.google.com/?q=Charotar+Publishing+House+Anand'
        },
        {
            icon: FaPhoneAlt,
            label: 'Phone',
            rotation: '-rotate-12 group-hover:rotate-0',
            gradient: 'from-[#7091E6] to-[#8B5CF6]',
            lines: [
                { label: 'Office:', text: '+91 99249 78998', href: 'tel:+919924978998' },
                { label: 'WhatsApp:', text: '+91 99249 78998', href: 'https://wa.me/919924978998' },
            ],
        },
        {
            icon: FaEnvelope,
            label: 'Email',
            gradient: 'from-[#f59e0b] to-[#ef4444]',
            lines: [
                { text: 'charotar@cphbooks.com', href: 'mailto:charotar@cphbooks.com' },
            ],
        },
        {
            icon: FaGlobe,
            label: 'Website',
            gradient: 'from-[#25D366] to-[#128C7E]',
            lines: [
                { text: 'cphbooks.in', href: 'https://cphbooks.in' },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1123] font-sans text-[#1f2937] dark:text-[#EDE8F5] transition-colors duration-300">
            <TopBar />
            <Navbar />

            {/* ── HERO ── */}
            <section className="relative overflow-hidden pt-24 pb-28 bg-gradient-to-br from-[#3D52A0] via-[#5a6fbc] to-[#8B5CF6]">
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-20 right-0 w-[400px] h-[400px] bg-[#8B5CF6]/30 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                        <span className="inline-block px-5 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-bold uppercase tracking-[0.3em] mb-6 border border-white/20">
                            We'd love to hear from you
                        </span>
                    </motion.div>
                    <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                        className="text-4xl md:text-6xl font-serif font-bold text-white mb-5 leading-tight tracking-tight">
                        Contact Us
                    </motion.h1>
                    <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                        className="text-white/75 text-lg max-w-xl mx-auto leading-relaxed font-medium">
                        Reach out to Charotar Publishing House — we're always happy to help with enquiries, orders, and feedback.
                    </motion.p>
                </div>
            </section>

            {/* ── CONTACT CARDS ── */}
            <section className="py-20 bg-gradient-to-b from-[#EDE8F5]/50 to-white dark:from-[#1a1a2e]/50 dark:to-[#0f1123]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {contactItems.map((item, i) => (
                            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                                className="bg-white dark:bg-[#1a1a2e] border border-[#8697C4]/15 dark:border-[#3D52A0]/25 rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-400 group">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className={`text-white text-2xl transition-transform duration-500 ${item.rotation || ''}`} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8697C4] mb-3">{item.label}</p>
                                <div className="space-y-1.5">
                                    {item.lines.map((line, j) => (
                                        <div key={j} className="text-sm leading-snug">
                                            {line.label && (
                                                <span className="text-[#8697C4] text-xs font-semibold mr-1">{line.label}</span>
                                            )}
                                            {line.href ? (
                                                <a href={line.href}
                                                    target={line.href.startsWith('http') ? '_blank' : undefined}
                                                    rel={line.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                                    className={`${line.bold ? 'font-bold text-[#1f2937] dark:text-white' : 'font-medium text-[#3D52A0] dark:text-[#7091E6] hover:underline'} transition-colors`}>
                                                    {line.text}
                                                </a>
                                            ) : (
                                                <span className={`${line.bold ? 'font-bold text-[#1f2937] dark:text-white' : 'text-slate-500 dark:text-[#ADBBDA] font-medium'}`}>
                                                    {line.text}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MAP + FORM ── */}
            <section className="py-4 pb-24 bg-white dark:bg-[#0f1123]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

                        {/* LEFT — Google Map */}
                        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                            className="rounded-3xl overflow-hidden shadow-2xl border border-[#8697C4]/15 dark:border-[#3D52A0]/25 h-full min-h-[450px]">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d28016.885366760052!2d72.966722!3d22.563677!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e4c203a30c561%3A0xeb69529430b6385b!2sCharotar%20Publishing%20House%20Private%20Limited!5e1!3m2!1sen!2sin!4v1772283271838!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0, minHeight: '450px' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Charotar Publishing House Location"
                                className="w-full h-full"
                            />
                        </motion.div>

                        {/* RIGHT — Contact Form */}
                        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                            className="bg-white dark:bg-[#1a1a2e] border border-[#8697C4]/15 dark:border-[#3D52A0]/25 rounded-3xl p-8 md:p-10 shadow-xl">

                            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#7091E6] mb-2 block">Send a Message</span>
                            <h2 className="text-3xl font-serif font-bold text-[#1f2937] dark:text-white mb-2">Tell Us Your Message</h2>
                            <p className="text-sm text-slate-500 dark:text-[#8697C4] mb-8 font-medium">Fill out the form and we'll get back to you within 24 hours.</p>

                            {submitted ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center gap-4 py-16 text-center">
                                    <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                        <FaCheckCircle className="text-green-500 text-3xl" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#1f2937] dark:text-white">Message Sent!</h3>
                                    <p className="text-sm text-slate-500 dark:text-[#8697C4]">Your email client has been opened. We'll respond shortly.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Name */}
                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors ml-1">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                            required
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-semibold text-gray-900 dark:text-white placeholder-slate-400"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors ml-1">
                                            Your Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="you@example.com"
                                            required
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-semibold text-gray-900 dark:text-white placeholder-slate-400"
                                        />
                                    </div>

                                    {/* Subject */}
                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors ml-1">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="Book enquiry, Order status..."
                                            required
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-semibold text-gray-900 dark:text-white placeholder-slate-400"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors ml-1">
                                            Your Message <span className="normal-case text-slate-300">(optional)</span>
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={formData.message}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Write your message here..."
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-semibold text-gray-900 dark:text-white placeholder-slate-400 resize-none"
                                        />
                                    </div>

                                    {/* Submit */}
                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-4 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] hover:from-[#7091E6] hover:to-[#3D52A0] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#3D52A0]/20 hover:shadow-2xl disabled:opacity-60 relative overflow-hidden group/btn"
                                    >
                                        <span className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                                        {loading
                                            ? <FaCircleNotch className="animate-spin text-lg" />
                                            : <><span>Send Message</span><FaArrowRight className="text-xs group-hover/btn:translate-x-1 transition-transform" /></>
                                        }
                                    </motion.button>

                                    <p className="text-center text-[11px] text-slate-400 dark:text-[#8697C4] font-medium">
                                        Or reach us directly on{' '}
                                        <a href="https://wa.me/919924978998" target="_blank" rel="noopener noreferrer"
                                            className="text-green-500 font-bold hover:underline inline-flex items-center gap-1">
                                            <FaWhatsapp /> WhatsApp
                                        </a>
                                    </p>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
