import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import { FaGavel, FaUserCheck, FaBan, FaRegHandshake, FaHistory } from 'react-icons/fa';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }
    })
};

const TermsPage = () => {
    const sections = [
        {
            title: "1. Acceptance of Terms",
            icon: FaUserCheck,
            content: "By accessing or using the Charotar Publishing House e-book platform, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services."
        },
        {
            title: "2. User Accounts",
            icon: FaRegHandshake,
            content: "You are responsible for maintaining the confidentiality of your account credentials. All activities occurring under your account are your responsibility. You must provide accurate and complete information during registration."
        },
        {
            title: "3. Intellectual Property",
            icon: FaGavel,
            content: "All content provided on this platform, including e-books, text, graphics, and logos, is the property of Charotar Publishing House or its content suppliers and protected by copyright laws. Unauthorized reproduction or distribution is strictly prohibited."
        },
        {
            title: "4. Prohibited Conduct",
            icon: FaBan,
            content: "Users may not engage in any activity that interferes with or disrupts our services. This includes attempting to bypass any security measures, reverse engineering the platform, or using automated systems to access content without permission."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1123] font-sans text-[#1f2937] dark:text-[#EDE8F5] transition-colors duration-300">
            <TopBar />
            <Navbar />

            {/* HERO */}
            <section className="relative pt-24 pb-20 bg-gradient-to-br from-[#8B5CF6] to-[#7091E6] overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-white/20">
                            Legal Guidelines
                        </span>
                    </motion.div>
                    <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                        className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
                        Terms & Conditions
                    </motion.h1>
                    <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                        className="text-white/80 text-lg font-medium max-w-2xl mx-auto">
                        Please read these terms carefully before using our platform. Your use of the service constitutes agreement to these terms.
                    </motion.p>
                </div>
            </section>

            {/* CONTENT */}
            <section className="py-20 max-w-4xl mx-auto px-4">
                <div className="grid gap-12">
                    {sections.map((section, i) => (
                        <motion.div
                            key={i}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            custom={i}
                            className="flex flex-col md:flex-row gap-6 md:gap-10 pb-12 border-b border-slate-100 dark:border-white/5 last:border-0"
                        >
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#8B5CF6]/5 dark:bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
                                <section.icon className="text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif font-bold mb-4 text-[#1f2937] dark:text-white">
                                    {section.title}
                                </h2>
                                <p className="text-slate-500 dark:text-[#ADBBDA] leading-relaxed text-[15px] font-medium">
                                    {section.content}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* LAST UPDATED */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="mt-12 p-8 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center gap-4 text-slate-400 dark:text-[#8697C4]"
                >
                    <FaHistory className="text-lg" />
                    <p className="text-xs font-bold uppercase tracking-widest">
                        Last Updated: December 2023
                    </p>
                </motion.div>
            </section>
        </div>
    );
};

export default TermsPage;
