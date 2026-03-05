const BackgroundAnimation = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Gradient Orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-float"
                style={{
                    background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)',
                    animationDelay: '-5s'
                }}
            ></div>

            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl animate-float"
                style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
                    animationDelay: '-10s'
                }}
            ></div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl animate-float"
                style={{
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
                    animationDelay: '-15s'
                }}
            ></div>

            {/* Floating Particles */}
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-purple-400/20 rounded-full animate-float"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 20}s`,
                        animationDuration: `${15 + Math.random() * 10}s`
                    }}
                ></div>
            ))}

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}
            ></div>
        </div>
    );
};

export default BackgroundAnimation;
