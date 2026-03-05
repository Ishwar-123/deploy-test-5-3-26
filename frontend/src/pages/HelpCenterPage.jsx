import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import { FaQuestionCircle, FaBookOpen, FaUndo, FaUserAlt, FaCreditCard, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }
    })
};

const HelpCenterPage = () => {
    const categories = [
        {
            title: "Getting Started",
            icon: FaBookOpen,
            gradient: "from-blue-500 to-cyan-500",
            questions: [
                "How do I create an account?",
                "How to purchase an e-book?",
                "System requirements for reading"
            ]
        },
        {
            title: "Account & Security",
            icon: FaUserAlt,
            gradient: "from-purple-500 to-indigo-500",
            questions: [
                "Resetting your password",
                "Updating profile information",
                "Two-factor authentication"
            ]
        },
        {
            title: "Payments & Refunds",
            icon: FaCreditCard,
            gradient: "from-emerald-500 to-teal-500",
            questions: [
                "Accepted payment methods",
                "Refund policy details",
                "Billing history issues"
            ]
        },
        {
            title: "Returns & Exchanges",
            icon: FaUndo,
            gradient: "from-orange-500 to-red-500",
            questions: [
                "Digital product return policy",
                "Exchanging for a physical copy",
                "Content access errors"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1123] font-sans text-[#1f2937] dark:text-[#EDE8F5] transition-colors duration-300">
            <TopBar />
            <Navbar />

            {/* HERO */}
            <section className="relative pt-24 pb-28 bg-gradient-to-br from-[#3D52A0] via-[#5a6fbc] to-[#8B5CF6] overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-white/20">
                            Support & FAQ
                        </span>
                    </motion.div>
                    <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                        className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
                        How can we help you?
                    </motion.h1>
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="relative max-w-xl mx-auto">
                        <input
                            type="text"
                            placeholder="Search for help..."
                            className="w-full px-6 py-4 rounded-2xl bg-white/95 dark:bg-[#1a1a2e]/95 border-none shadow-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-4 focus:ring-white/20 transition-all outline-none"
                        />
                        <FaQuestionCircle className="absolute right-6 top-1/2 -translate-y-1/2 text-[#3D52A0] text-xl" />
                    </motion.div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={i}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            custom={i}
                            className="bg-white dark:bg-[#1a1a2e] border border-slate-100 dark:border-white/5 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-400 group"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
                                <cat.icon className="text-white text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold mb-4 text-[#1f2937] dark:text-white">{cat.title}</h3>
                            <ul className="space-y-3">
                                {cat.questions.map((q, j) => (
                                    <li key={j} className="text-sm font-medium text-slate-500 dark:text-[#8697C4] hover:text-[#3D52A0] dark:hover:text-[#7091E6] transition-colors cursor-pointer flex items-center gap-2 group/li">
                                        <div className="w-1 h-1 rounded-full bg-slate-300 group-hover/li:bg-[#3D52A0] transition-colors" />
                                        {q}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* CONTACT CTA */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="mt-20 p-10 bg-gradient-to-br from-[#EDE8F5] to-white dark:from-[#1a1a2e] dark:to-[#0f1123] rounded-[2.5rem] border border-[#8697C4]/10 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-serif font-bold text-[#1f2937] dark:text-white mb-2">Still need help?</h2>
                        <p className="text-slate-500 dark:text-[#ADBBDA] font-medium">Our support team is available 24/7 to assist you.</p>
                    </div>
                    <Link to="/contact" className="px-8 py-4 bg-[#3D52A0] text-white rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:bg-[#7091E6] transition-all flex items-center gap-3">
                        Contact Support <FaArrowRight className="text-xs" />
                    </Link>
                </motion.div>
            </section>
        </div>
    );
};

export default HelpCenterPage;
