import React from "react";
import ivm from "../assets/images (6) 2.png";
import facebook from "../assets/facebook.png";
import instagram from "../assets/teenyicons_instagram-solid.png";
import gmail from "../assets/mdi_gmail.png";
import '../styles/Footer.css'


 
const Footer = () => {
  return (
    <>
      <div className="row  justify-content-between footer">
        <div className="col-lg-4">
          <img src={ivm} alt="ivm-pic" />
          <p className="sub">
            Subscribe to our newsletter to be one of the first to receive
            updates on Trackpad
          </p>
          <h5>Newsletter Sign Up</h5>
          <input type="email" placeholder="Email Address" name="" id="mail" />
          <label className="btn email-btn" htmlFor="mail">
            Email Address
          </label>
        </div>
       
        <div className="col-lg-3">
            <h5>Contact</h5>
          <div className="d-flex">
            <img src={facebook} alt="facebook" />
            <p>@trackpad</p>
          </div>
          <div className="d-flex">
            <img src={instagram} alt="instagram" />
            <p>@trackpad</p>
          </div>
          <div className="d-flex">
            <img src={gmail} alt="gmail" />
            <p>hr@goldensblockchain.xyz</p>
          </div>
        </div>
        <hr/>
      </div>
    </>
  );
};

export default Footer;