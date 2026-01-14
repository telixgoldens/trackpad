import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

const SignUp = ({ onSwitch, onBack, onSuccess }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch("password");

  const onSubmit = (data) => {
    console.log("Sign Up Success:", data);
    // Store user session
    localStorage.setItem('trackpad_user', data.email);
    // Call success callback to navigate to dashboard
    if (onSuccess) onSuccess(data.email);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -50 }} 
      className="container"
    >
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="glass-card">
            <h2 className="text-center fw-black mb-1 uppercase italic tracking-tighter">NEW PROTOCOL</h2>
            <p className="text-center text-secondary small mb-4">Initialize your digital asset identity</p>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-3">
                <label className="small fw-bold text-secondary mb-1">EMAIL</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="name@nexus.com"
                  {...register("email", { required: "Required", pattern: /^\S+@\S+$/i })}
                />
                {errors.email && <div className="error-text">INVALID EMAIL</div>}
              </div>
              
              <div className="mb-3">
                <label className="small fw-bold text-secondary mb-1">PASSWORD</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Create Key"
                  {...register("password", { required: "Required", minLength: 8 })}
                />
                {errors.password && <div className="error-text">MIN 8 CHARACTERS</div>}
              </div>

              <div className="mb-4">
                <label className="small fw-bold text-secondary mb-1">VERIFY PASSWORD</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Confirm Key"
                  {...register("verify", { required: "Required", validate: v => v === password || "Keys mismatch" })}
                />
                {errors.verify && <div className="error-text">{errors.verify.message}</div>}
              </div>
              
              <button type="submit" className="btn btn-gradient w-100 mb-3">INITIALIZE SYNC</button>
            </form>
            
            <p className="text-center small text-secondary mt-3">
              ESTABLISHED? <button onClick={onSwitch} className="btn btn-link p-0 small fw-bold text-white text-decoration-none">HANDSHAKE NOW</button>
            </p>
            <button onClick={onBack} className="btn btn-link w-100 text-secondary small text-decoration-none mt-2">EXIT</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignUp;