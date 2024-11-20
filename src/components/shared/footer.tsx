import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => (
  <React.Fragment>
    <div
      className="container-fluid px-4 py-1"
      style={{ backgroundColor: "#F8FAFD", position: "fixed", bottom: "0px" }}
    >
      <div className="d-none d-sm-flex justify-content-between align-items-center">
      <Link to={"https://pv-glarecheck.com"} className="footerText d-none d-sm-block my-auto text-decoration-none">
          &copy; PV-GlareCheck.com {new Date().getFullYear()}
        </Link>

        <div className="privacyPolicydiv text-center">
          <Link
            className="text-decoration-none footerText d-inline-block mx-2 my-auto"
            to="https://pv-glarecheck.com/privacy-policy"
          >
            Privacy Policy
          </Link>
          <Link
            className="text-decoration-none footerText d-inline-block mx-2 my-auto"
            to="https://pv-glarecheck.com/impressum"
          >
            Impressum
          </Link>
        </div>

        <Link
          className="text-decoration-none"
          to="https://pv-glarecheck.com/contact"
        >
          <p className="footerText my-auto">Contact&nbsp;us</p>
        </Link>
      </div>
      <div className="d-flex d-sm-none mt-1 justify-content-between align-tems-center">
        <Link
          className="text-decoration-none footerText d-inline-block my-auto"
          to="https://pv-glarecheck.com/contact"
        >
          Contact&nbsp;us
        </Link>
        <div>
          <Link
            className="text-decoration-none footerText d-inline-block my-auto"
            to="https://pv-glarecheck.com/privacy-policy"
          >
            Privacy Policy
          </Link>
          &nbsp;
          <Link
            className="text-decoration-none footerText d-inline-block my-auto"
            to="https://pv-glarecheck.com/impressum"
          >
            Impressum{" "}
          </Link>
        </div>
      </div>
    </div>
  </React.Fragment>
);

export default Footer;
