import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Interactive3DBackground: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Memoize particles to prevent re-creation on every render
    const particles = useMemo(() => {
        const count = isMobile ? 8 : 15;
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            size: Math.random() * (isMobile ? 120 : 200) + 50,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: Math.random() * 20 + 20,
            color: i % 3 === 0 ? 'rgba(0, 255, 255, 0.03)' : i % 3 === 1 ? 'rgba(255, 0, 255, 0.03)' : 'rgba(147, 51, 234, 0.03)',
            moveX: Math.random() * 100 - 50,
            moveY: Math.random() * 100 - 50,
        }));
    }, [isMobile]);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] bg-background">
            {/* Mesh Gradient base */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    background: `radial-gradient(circle at 20% 30%, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
                       radial-gradient(circle at 80% 70%, rgba(255, 0, 255, 0.15) 0%, transparent 50%)`
                }}
            />

            {/* Animated Particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full blur-[80px]"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        backgroundColor: p.color,
                        willChange: 'transform, opacity', // Performance hint
                    }}
                    animate={{
                        x: [0, p.moveX, 0],
                        y: [0, p.moveY, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />
        </div>
    );
};

export default React.memo(Interactive3DBackground);
