import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import { FaMapMarkerAlt, FaWhatsapp, FaEnvelope, FaGlobe, FaTrophy, FaBook, FaUsers, FaStar, FaArrowRight } from 'react-icons/fa';

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }
    })
};

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1123] font-sans text-[#1f2937] dark:text-[#EDE8F5] transition-colors duration-300">
            <TopBar />
            <Navbar />

            {/* ── HERO ── */}
            <section className="relative overflow-hidden pt-24 pb-28 bg-gradient-to-br from-[#3D52A0] via-[#5a6fbc] to-[#8B5CF6]">
                {/* Decorative blobs */}
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-20 right-0 w-[400px] h-[400px] bg-[#8B5CF6]/30 rounded-full blur-[80px] pointer-events-none" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                        <span className="inline-block px-5 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-bold uppercase tracking-[0.3em] mb-6 border border-white/20">
                            Est. in Anand, Gujarat · India
                        </span>
                    </motion.div>
                    <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                        className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight tracking-tight">
                        Charotar Publishing<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ADBBDA] to-white">House Pvt. Ltd.</span>
                    </motion.h1>
                    <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                        className="text-white/75 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                        Pioneer Publisher of Engineering Textbooks in India — serving the future generation with knowledge that matters.
                    </motion.p>

                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
                        className="flex flex-wrap justify-center gap-4 mt-10">
                        <a href="https://cphbooks.in" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#3D52A0] rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                            Visit Website <FaArrowRight className="text-xs" />
                        </a>
                        <a href="mailto:charotar@cphbooks.com"
                            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white border border-white/25 rounded-2xl font-bold text-sm backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                            Contact Us
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* ── STATS BAR ── */}
            <section className="bg-[#3D52A0] dark:bg-[#1a1a2e]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
                        {[
                            { icon: FaBook, value: '50+', label: 'Publications' },
                            { icon: FaUsers, value: '1M+', label: 'Students Reached' },
                            { icon: FaTrophy, value: '2', label: 'National Awards' },
                            { icon: FaStar, value: '40+', label: 'Years of Excellence' },
                        ].map((stat, i) => (
                            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                                className="flex flex-col items-center justify-center py-8 px-4 text-center text-white">
                                <stat.icon className="text-2xl text-[#ADBBDA] mb-2" />
                                <span className="text-3xl font-serif font-bold">{stat.value}</span>
                                <span className="text-xs font-semibold text-white/60 uppercase tracking-widest mt-1">{stat.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── OUR STORY ── */}
            <section className="py-24 bg-white dark:bg-[#0f1123]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                        {/* Text */}
                        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#7091E6] mb-4 block">Our Story</span>
                            <h2 className="text-4xl font-serif font-bold text-[#1f2937] dark:text-white mb-8 leading-tight">
                                Serving the Future Generation of India
                            </h2>
                            <div className="space-y-5 text-[15px] leading-[1.85] text-slate-600 dark:text-[#ADBBDA] font-medium">
                                <p>
                                    <strong className="text-[#3D52A0] dark:text-[#7091E6]">Pioneer Publisher of Engineering textbooks in India,</strong> Charotar Publishing House Pvt. Ltd. — ANAND is serving the future generation of the country with invaluable educational textbooks on engineering subjects written by eminent Indian professors who have specialised in their respective fields.
                                </p>
                                <p>
                                    The prices of the books are kept to the minimum possible, as good as subsidised, in an effort to bring them within the reach of the average Indian student, which is CHAROTAR's basic idea — however, <strong className="text-[#3D52A0] dark:text-[#7091E6]">no compromise on quality has ever been made.</strong>
                                </p>
                                <p>
                                    There are more than fifty publications on various engineering subjects which are known and written in a lucid language, giving step-by-step treatment of the subject matter with neat and clear self-explanatory diagrams.
                                </p>
                            </div>

                            {/* Divider quote */}
                            <blockquote className="mt-10 pl-6 border-l-4 border-[#7091E6] italic text-[#3D52A0] dark:text-[#7091E6] text-base font-semibold">
                                "Knowledge within the reach of every Indian student — that is CHAROTAR's mission."
                            </blockquote>
                        </motion.div>

                        {/* Visual Card */}
                        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                            className="relative flex justify-center">
                            {/* Background card */}
                            <div className="absolute top-4 left-4 w-full h-full rounded-3xl bg-[#7091E6]/15 dark:bg-[#3D52A0]/20 border border-[#7091E6]/20" />
                            <div className="relative z-10 bg-gradient-to-br from-[#EDE8F5] to-white dark:from-[#1a1a2e] dark:to-[#0f1123] border border-[#8697C4]/20 dark:border-[#3D52A0]/30 rounded-3xl p-10 shadow-2xl max-w-sm w-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#3D52A0] to-[#7091E6] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#3D52A0]/30">
                                    <FaBook className="text-white text-2xl" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-[#1f2937] dark:text-white mb-3">Engineering Education First</h3>
                                <p className="text-sm text-slate-500 dark:text-[#ADBBDA] leading-relaxed">
                                    Every book is authored by eminent Indian professors with deep expertise in their respective engineering domains.
                                </p>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    {['Lucid Language', 'Step-by-Step', 'Clear Diagrams', 'Affordable'].map(tag => (
                                        <span key={tag} className="text-[11px] font-bold text-[#3D52A0] dark:text-[#7091E6] bg-[#3D52A0]/10 dark:bg-[#7091E6]/10 px-3 py-1.5 rounded-xl text-center">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── AWARD SECTION ── */}
            <section className="py-24 bg-gradient-to-br from-[#EDE8F5] to-white dark:from-[#1a1a2e] dark:to-[#0f1123]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#7091E6] mb-3 block">Recognition</span>
                        <h2 className="text-4xl font-serif font-bold text-[#1f2937] dark:text-white">Award-Winning Excellence</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            {
                                icon: FaTrophy,
                                gradient: 'from-[#f59e0b] to-[#d97706]',
                                title: 'Best Publisher Award',
                                body: 'Won the prestigious award for Best Publisher in Technical Publication from the Federation of Publishers and Booksellers Association of India.',
                                badge: 'Federation of Publishers & Booksellers — India'
                            },
                            {
                                icon: FaTrophy,
                                gradient: 'from-[#7091E6] to-[#3D52A0]',
                                title: 'Best Publication Award',
                                body: 'Recognised for Best Publication in Technical category at the Gujarat Book Fair — a testament to CHAROTAR\'s commitment to quality engineering education.',
                                badge: 'Gujarat Book Fair'
                            }
                        ].map((award, i) => (
                            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                                className="relative bg-white dark:bg-[#1a1a2e] rounded-3xl p-8 border border-[#8697C4]/20 dark:border-[#3D52A0]/30 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group">
                                {/* Glow */}
                                <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${award.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />

                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${award.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                                    <award.icon className="text-white text-xl" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-[#1f2937] dark:text-white mb-3">{award.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-[#ADBBDA] leading-relaxed mb-5">{award.body}</p>
                                <span className={`inline-block text-[11px] font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${award.gradient} text-white`}>
                                    {award.badge}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CONTACT SECTION ── */}
            <section className="py-24 bg-white dark:bg-[#0f1123]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#7091E6] mb-3 block">Get In Touch</span>
                        <h2 className="text-4xl font-serif font-bold text-[#1f2937] dark:text-white">Reach Out to Us</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: FaMapMarkerAlt,
                                label: 'Address',
                                value: 'Opposite Amul Dairy, Old Civil Court Road, Anand 388 001, India',
                                href: 'https://maps.google.com/?q=Charotar+Publishing+House+Anand',
                                color: 'from-[#3D52A0] to-[#5a6fbc]'
                            },
                            {
                                icon: FaWhatsapp,
                                label: 'WhatsApp',
                                value: '+91 99249 78998',
                                href: 'https://wa.me/919924978998',
                                color: 'from-[#25D366] to-[#128C7E]'
                            },
                            {
                                icon: FaEnvelope,
                                label: 'Email',
                                value: 'charotar@cphbooks.com',
                                href: 'mailto:charotar@cphbooks.com',
                                color: 'from-[#7091E6] to-[#8B5CF6]'
                            },
                            {
                                icon: FaGlobe,
                                label: 'Website',
                                value: 'cphbooks.in',
                                href: 'https://cphbooks.in',
                                color: 'from-[#f59e0b] to-[#ef4444]'
                            },
                        ].map((item, i) => (
                            <motion.a key={i} href={item.href} target="_blank" rel="noopener noreferrer"
                                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                                className="group bg-white dark:bg-[#1a1a2e] border border-[#8697C4]/20 dark:border-[#3D52A0]/30 rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-400 flex flex-col items-start gap-4 cursor-pointer">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className="text-white text-lg" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8697C4] mb-1">{item.label}</p>
                                    <p className="text-sm font-semibold text-[#1f2937] dark:text-[#EDE8F5] leading-snug">{item.value}</p>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="py-20 bg-gradient-to-r from-[#3D52A0] to-[#8B5CF6] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                        Explore Our Digital Library
                    </motion.h2>
                    <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                        className="text-white/75 text-base mb-8 max-w-xl mx-auto">
                        Discover 50+ engineering textbooks and publications, now available digitally on our platform.
                    </motion.p>
                    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}>
                        <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#3D52A0] rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                            Browse Books <FaArrowRight className="text-xs" />
                        </Link>
                    </motion.div>
                </div>
            </section>

        </div>
    );
};

export default AboutPage;
