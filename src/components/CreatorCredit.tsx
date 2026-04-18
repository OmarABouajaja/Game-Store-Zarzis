import { motion, AnimatePresence } from "framer-motion";
import { Linkedin, X, Code, Terminal } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Professional creator credit footer
 * Supports two variants:
 * - "static": Positioned in-flow for homepage footer
 * - "floating": Fixed position for dashboard pages with collapse functionality
 */
interface CreatorCreditProps {
    variant?: "static" | "floating";
}

export const CreatorCredit = ({ variant = "floating" }: CreatorCreditProps) => {
    const isStatic = variant === "static";
    // Default to collapsed for floating variant
    const [isExpanded, setIsExpanded] = useState(isStatic);

    // Load collapsed state from localStorage for floating variant
    useEffect(() => {
        if (!isStatic) {
            const saved = localStorage.getItem("creatorCreditExpanded");
            if (saved !== null) {
                setIsExpanded(saved === "true");
            } else {
                setIsExpanded(false);
            }
        }
    }, [isStatic]);

    const toggleExpanded = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newState = !isExpanded;
        setIsExpanded(newState);
        if (!isStatic) {
            localStorage.setItem("creatorCreditExpanded", String(newState));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={isStatic ? "flex justify-center py-4" : "fixed bottom-4 right-4 z-50"}
        >
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    // Expanded state - full badge
                    <motion.div
                        key="expanded"
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative flex items-center"
                    >
                        <motion.a
                            href="https://www.linkedin.com/in/omar-abouajaja"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 ps-4 pe-10 py-2.5 rounded-full bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(0,180,255,0.15)] hover:border-cyan-500/30 transition-all duration-300 group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg">
                                <Terminal className="w-3.5 h-3.5 text-white" />
                            </div>

                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
                                    Developed by
                                </span>
                                <span className="text-xs font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent group-hover:from-cyan-100 group-hover:to-blue-100 transition-all mt-0.5">
                                    Omar Abouajaja
                                </span>
                            </div>
                        </motion.a>

                        {/* Elegant Close Button */}
                        {!isStatic && (
                            <button
                                onClick={toggleExpanded}
                                className="absolute right-2 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                                title="Minimize"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </motion.div>
                ) : (
                    // Collapsed state - Premium floating orb
                    <motion.button
                        key="collapsed"
                        initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleExpanded}
                        className="group relative w-11 h-11 rounded-full bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:border-cyan-500/50 transition-all duration-300 flex items-center justify-center overflow-hidden"
                    >
                        {/* Animated Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Icon */}
                        <Code className="w-5 h-5 text-slate-300 group-hover:text-cyan-400 transition-colors duration-300" />

                        {/* Notification Dot */}
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
