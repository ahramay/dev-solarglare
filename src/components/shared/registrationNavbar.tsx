import React from "react";
import Container from "react-bootstrap/Container";
import { Image } from "react-bootstrap";
import Logo from "../../images/logo.svg";
import { Link } from "react-router-dom";
const RegistrationNavbar = () => (
  <React.Fragment>
    <Container
      fluid
      className="navbar d-flex justify-content-between py-1 px-3 align-items-center"
    >
      <Link to="https://pv-glarecheck.com/" className="text-decoration-none">
        <div className="d-flex align-items-center">
          <Image className="mx-2" src={Logo} alt="logo" />
          {/* <p className="solarCalc">Solar Calc</p> */}
        </div>
      </Link>
      <div className="align-items-center ">
        <span className="regEN">EN</span> / <span className="regDU">DE</span>
      </div>
    </Container>
  </React.Fragment>
);

export default RegistrationNavbar;
