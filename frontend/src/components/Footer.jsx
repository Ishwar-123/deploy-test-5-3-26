import { FaFacebookF, FaTwitter, FaInstagram, FaMapMarkerAlt, FaEnvelope, FaPinterest, FaLinkedinIn, FaVimeoV, FaWhatsapp, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="relative bg-white dark:bg-[#0f1123] text-[#1f2937] dark:text-[#EDE8F5] pt-16 pb-8 overflow-hidden font-sans border-t border-slate-100 dark:border-white/5">
            {/* Subtle Gradient Overlays */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#3D52A0]/20 to-transparent"></div>
            <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#3D52A0]/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#8B5CF6]/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-16 mb-12">

                    {/* ── COLUMN 1: BRAND ── */}
                    <div className="lg:col-span-5 space-y-6">
                        <Link to="/" className="inline-block transition-transform hover:scale-[1.02]">
                            <img src="/logo.png" alt="Charotar Publishing House" className="h-12 w-auto object-contain" />
                        </Link>
                        <p className="text-slate-500 dark:text-[#8697C4] text-[13px] leading-relaxed max-w-sm font-medium">
                            Setting the standard in engineering education since 1944. Charotar Publishing House provides world-class digital and print resources for the modern learner.
                        </p>

                        {/* Compact Contact Info */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-start gap-3 group">
                                <FaMapMarkerAlt className="mt-1 text-[#3D52A0] dark:text-[#7091E6] shrink-0 text-xs" />
                                <span className="text-slate-500 dark:text-[#ADBBDA] text-[12px] leading-snug">
                                    Opposite Amul Dairy, Anand 388 001, Gujarat, India
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <a href="mailto:charotar@cphbooks.com" className="flex items-center gap-2 text-slate-500 dark:text-[#ADBBDA] hover:text-[#3D52A0] dark:hover:text-[#7091E6] transition-colors text-[12px] font-semibold">
                                    <FaEnvelope className="text-[#3D52A0] dark:text-[#7091E6]" /> charotar@cphbooks.com
                                </a>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <a href="tel:+919924978998" className="flex items-center gap-2 text-slate-500 dark:text-[#ADBBDA] hover:text-[#3D52A0] dark:hover:text-[#7091E6] transition-colors text-[12px] font-semibold">
                                    <FaWhatsapp className="text-[#25D366]" /> +91 99249 78998
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* ── COLUMN 2: QUICK LINKS ── */}
                    <div className="lg:col-span-3">
                        <h4 className="text-[#1f2937] dark:text-white font-bold text-[10px] uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                            <span className="w-8 h-px bg-[#3D52A0]"></span>
                            Information
                        </h4>
                        <ul className="grid grid-cols-1 gap-y-3">
                            {[
                                { label: 'About Company', href: '/about' },
                                { label: 'Contact Support', href: '/contact' },
                                { label: 'Privacy Policy', href: '/privacy' },
                                { label: 'Terms of Service', href: '/terms' },
                            ].map(item => (
                                <li key={item.label}>
                                    <Link
                                        to={item.href}
                                        className="text-slate-500 dark:text-[#ADBBDA] hover:text-[#3D52A0] dark:hover:text-[#7091E6] transition-all flex items-center gap-2 group text-[13px] font-medium"
                                    >
                                        <FaChevronRight className="text-[8px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#3D52A0]" />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── COLUMN 3: CONNECT ── */}
                    <div className="lg:col-span-4 space-y-6">
                        <h4 className="text-[#1f2937] dark:text-white font-bold text-[10px] uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                            <span className="w-8 h-px bg-[#7091E6]"></span>
                            Connect With Us
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                            {[
                                { icon: FaFacebookF, href: 'https://www.facebook.com/charotar', color: 'hover:bg-[#1877F2]' },
                                { icon: FaTwitter, href: 'https://twitter.com/cphpl1511', color: 'hover:bg-[#1DA1F2]' },
                                { icon: FaInstagram, href: 'https://www.instagram.com/charotarpub/', color: 'hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7]' },
                                { icon: FaPinterest, href: 'https://in.pinterest.com/charotar/', color: 'hover:bg-[#E60023]' },
                                { icon: FaLinkedinIn, href: 'https://www.linkedin.com/in/charotar', color: 'hover:bg-[#0A66C2]' },
                                { icon: FaVimeoV, href: 'https://vimeo.com/charotar', color: 'hover:bg-[#1AB7EA]' },
                            ].map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 group ${item.color} hover:text-white transition-all duration-300 shadow-sm`}
                                >
                                    <item.icon className="text-sm transition-transform group-hover:scale-110" />
                                </a>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-[#8697C4] font-medium leading-relaxed italic">
                            Building a legacy of engineering knowledge. Connect with us for updates on new releases and academic resources.
                        </p>
                    </div>
                </div>

                {/* ── BOTTOM BAR ── */}
                <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[11px] text-slate-400 dark:text-[#8697C4] font-bold tracking-wider uppercase">
                            © {new Date().getFullYear()} Charotar Publishing House Pvt. Ltd.
                        </p>
                        <p className="text-[10px] text-slate-300 dark:text-[#526085] font-medium">
                            Authorized Digital Merchant • Anand, Gujarat
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/privacy" className="text-[10px] font-black uppercase tracking-widest text-[#8697C4] hover:text-[#3D52A0] transition-colors">Privacy Policy</Link>
                        <span className="w-px h-3 bg-slate-200 dark:bg-white/10"></span>
                        <Link to="/terms" className="text-[10px] font-black uppercase tracking-widest text-[#8697C4] hover:text-[#3D52A0] transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
