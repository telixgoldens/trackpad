import React from "react";
import { motion } from "framer-motion";

const Landing = ({ onStart }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="container text-center py-5"
  >
    <div className="row py-5">
      <div className="col-lg-8 mx-auto mt-5">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="badge bg-info text-dark rounded-pill px-4 mb-4 fw-black tracking-widest uppercase italic"
        >
          Institutional Grade Execution
        </motion.div>
        <h1
          className="display-1 fw-black text-white mb-4 italic tracking-tighter"
          style={{ lineHeight: 0.85 }}
        >
          TRADE THE <br />{" "}
          <span style={{ color: "var(--primary-blue)" }}>PULSE.</span>
        </h1>
        <p
          className="lead text-secondary mb-5 fw-bold"
          style={{ maxWidth: "600px", margin: "0 auto" }}
        >
          Real-time volatility analysis and neural routing. Enter the next
          generation of option derivatives.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <button onClick={onStart} className="btn btn-gradient px-5 py-3">
            OPEN TERMINAL
          </button>
          <button className="btn btn-outline-light px-5 py-3 rounded-4 fw-bold">
            MARKET DOCS
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

export default Landing;
