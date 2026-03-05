import { motion } from 'framer-motion';

const ProgressIndicator = ({ progress }) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1">
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full origin-left"
                style={{
                    backgroundColor: 'var(--reader-accent)',
                    boxShadow: '0 0 10px var(--reader-accent)'
                }}
            />
        </div>
    );
};

export default ProgressIndicator;
