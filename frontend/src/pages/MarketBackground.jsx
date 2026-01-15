import React from "react";
import { motion } from "framer-motion";

const MarketBackground = () => {
  const gridStyle = {
    position: "absolute",
    inset: 0,
    backgroundImage: `radial-gradient(circle, rgba(0, 210, 255, 0.1) 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
    opacity: 0.4,
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#000",
        zIndex: -1,
      }}
    >
      <div style={gridStyle} />
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", opacity: 0.3 }}
      >
        <motion.path
          d="M0,400 L200,350 L400,450 L600,200 L800,380 L1000,100 L1200,300 L1440,200"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="100%" stopColor="#3a0ca3" />
          </linearGradient>
        </defs>
      </svg>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: "4px",
            height: "4px",
            background: "#00d2ff",
            borderRadius: "50%",
            boxShadow: "0 0 15px #00d2ff",
          }}
          initial={{
            x:
              Math.random() *
              (typeof window !== "undefined" ? window.innerWidth : 1440),
            y:
              Math.random() *
              (typeof window !== "undefined" ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, -100, 100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default MarketBackground;
