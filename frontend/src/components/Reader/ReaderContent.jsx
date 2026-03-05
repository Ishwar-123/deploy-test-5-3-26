import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const ReaderContent = ({
    content,
    fontSize,
    fontFamily,
    lineHeight,
    onScroll
}) => {
    const contentRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (contentRef.current && onScroll) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
                onScroll(scrollPercentage);
            }
        };

        const element = contentRef.current;
        if (element) {
            element.addEventListener('scroll', handleScroll);
            return () => element.removeEventListener('scroll', handleScroll);
        }
    }, [onScroll]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            ref={contentRef}
            className="h-full overflow-y-auto reader-scrollbar px-4 md:px-8 py-8 md:py-12"
            style={{
                backgroundColor: 'var(--reader-content-bg)',
            }}
        >
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className={`reader-font-${fontFamily}`}
                    style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: lineHeight,
                        color: 'var(--reader-text)',
                    }}
                >
                    {/* Chapter Title */}
                    <h2
                        className="text-2xl md:text-4xl font-bold mb-8"
                        style={{ color: 'var(--reader-text)' }}
                    >
                        {content.title}
                    </h2>

                    {/* Chapter Content */}
                    <div className="space-y-6">
                        {content.paragraphs.map((paragraph, index) => (
                            <motion.p
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: 0.3 + (index * 0.05),
                                    ease: 'easeOut'
                                }}
                                className="text-justify"
                                style={{
                                    color: 'var(--reader-text)',
                                    marginBottom: '1.5em'
                                }}
                            >
                                {paragraph}
                            </motion.p>
                        ))}
                    </div>

                    {/* End of Chapter Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        className="text-center mt-16 mb-8"
                    >
                        <div
                            className="inline-block px-6 py-2 rounded-full text-xs font-bold"
                            style={{
                                backgroundColor: 'var(--reader-border)',
                                color: 'var(--reader-text-secondary)',
                            }}
                        >
                            End of Chapter
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ReaderContent;
