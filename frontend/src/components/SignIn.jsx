import React from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";

const SignIn = ({ onSwitch, onBack, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log("Sign In Success:", data);
    localStorage.setItem("trackpad_user", data.email);
    if (onSuccess) onSuccess(data.email);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="container"
    >
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="glass-card">
            <h2 className="text-center fw-black mb-1 uppercase italic tracking-tighter">
              ACCESS PORTAL
            </h2>
            <p className="text-center text-secondary small mb-4">
              Establishing secure market link...
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-3">
                <label className="small fw-bold text-secondary mb-1">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@nexus.com"
                  {...register("email", {
                    required: "Email required",
                    pattern: /^\S+@\S+$/i,
                  })}
                />
                {errors.email && (
                  <div className="error-text">{errors.email.message}</div>
                )}
              </div>

              <div className="mb-2">
                <label className="small fw-bold text-secondary mb-1">
                  SECURITY KEY
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  {...register("password", { required: "Password required" })}
                />
                {errors.password && (
                  <div className="error-text">{errors.password.message}</div>
                )}
              </div>

              <div className="text-start mb-4">
                <a
                  href="#"
                  className="small fw-bold text-info text-decoration-none"
                >
                  FORGET PASSWORD?
                </a>
              </div>

              <button type="submit" className="btn btn-gradient w-100 mb-3">
                AUTHORIZE LOGIN
              </button>
            </form>

            <p className="text-center small text-secondary mt-3">
              UNREGISTERED?{" "}
              <button
                onClick={onSwitch}
                className="btn btn-link p-0 small fw-bold text-white text-decoration-none"
              >
                OPEN ACCOUNT
              </button>
            </p>
            <button
              onClick={onBack}
              className="btn btn-link w-100 text-secondary small text-decoration-none mt-2"
            >
              CANCEL LINK
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignIn;
