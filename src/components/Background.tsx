
import { useEffect, useState } from 'react';

const Background = () => {
    // PlayStation shapes
    const shapes = ['○', '△', '□', '×'];
    const colors = [
        'text-red-500/20',
        'text-emerald-500/20',
        'text-purple-500/20',
        'text-blue-500/20'
    ];

    // Static set of shapes to ensure consistent server/client rendering if needed, 
    // but for a background we can just map simple indices
    const backgroundElements = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        shape: shapes[i % shapes.length],
        color: colors[i % colors.length],
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        duration: `${10 + Math.random() * 10}s`,
        size: `${20 + Math.random() * 30}px`
    }));

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-50 bg-background">
            {/* Overlay Gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95 z-0" />

            {/* Glow Orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse-glow" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

            {/* Floating Shapes */}
            {backgroundElements.map((el) => (
                <div
                    key={el.id}
                    className={`absolute font-display font-bold ${el.color} select-none`}
                    style={{
                        left: el.left,
                        top: el.top,
                        fontSize: el.size,
                        animation: `ps-float ${el.duration} ease-in-out infinite`,
                        animationDelay: el.animationDelay,
                        opacity: 0.15 // Base low opacity
                    }}
                >
                    {el.shape}
                </div>
            ))}

            {/* Grid Pattern Overlay (optional, usually adds nice tech feel) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_70%,transparent_100%)] opacity-20" />
        </div>
    );
};

export default Background;
