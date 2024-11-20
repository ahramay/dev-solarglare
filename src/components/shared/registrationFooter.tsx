import React from "react";
import FooterIcon from "../../images/image 3 (1).png";
import { Link } from "react-router-dom";

const RegistrationFooter: React.FC = () => (
  <React.Fragment>
    <div
      className="container-fluid px-4 py-1"
      style={{ backgroundColor: "#F8FAFD", position: "fixed", bottom: "0px" }}
    >
      <div className="d-none d-sm-flex justify-content-between align-items-center">
        <Link
          to={"https://pv-glarecheck.com"}
          className="text-decoration-none footerText d-none d-sm-block my-auto"
        >
          <img
            width={15}
            className="d-inline mb-1"
            src={FooterIcon}
            alt="footer_Icon"
          />
          PV-GlareCheck.com {new Date().getFullYear()}
        </Link>
        <Link to="https://pv-glarecheck.com">
          <div className="privacyPolicydiv text-center">
            <Link
              to="https://pv-glarecheck.com/privacy-policy"
              className="text-decoration-none footerText d-inline-block my-auto"
            >
              Privacy Policy{" "}
            </Link>
            <Link
              to="https://pv-glarecheck.com/impressum"
              className="text-decoration-none footerText d-inline-block mx-2 my-auto"
            >
              Impressum
            </Link>
          </div>
        </Link>
        <Link
          to="https://pv-glarecheck.com/contact"
          className="text-decoration-none footerText my-auto"
        >
          Contact&nbsp;us
        </Link>
      </div>

      <div className="d-flex d-sm-none mt-1 justify-content-between align-tems-center">
        <Link
          to="https://pv-glarecheck.com/contact"
          className="text-decoration-none footerText my-auto"
        >
          Contact&nbsp;us
        </Link>
        <div>
          <Link
            to="https://pv-glarecheck.com/privacy-policy"
            className="text-decoration-none footerText d-inline-block me-2 my-auto"
          >
            Privacy Policy
          </Link>
          <Link
            to="https://pv-glarecheck.com/impressum"
            className="text-decoration-none footerText d-inline-block my-auto"
          >
            Impressum
          </Link>
        </div>
      </div>
    </div>
  </React.Fragment>
);

export default RegistrationFooter;
