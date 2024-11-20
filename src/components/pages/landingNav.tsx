import React from "react";
import Container from "react-bootstrap/Container";
import Image from "react-bootstrap/Image";
import Logo from "../../images/logo.png";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
const LandingNav: React.FC = () => {
  return (
    <React.Fragment>
      <Container
        fluid
        className="navbar d-flex justify-content-between py-1 px-3 align-items-center"
      >
        <Link to="/" className="text-decoration-none">
          <div className="d-flex align-items-center">
            <Image className="pt-2" src={Logo} alt="logo" width={50} />
            <p className="solarCalc ms-1 pt-2">Solar Calc</p>
          </div>
        </Link>
        <div className="align-items-center ">
          <span className="regEN">EN</span> / <span className="regDU">DE</span>
        </div>
        <div>
          <Link to="/login" className="text-decoration-none">
            <Button className="landingLog d-none d-sm-inline" variant="none">
              Log in
            </Button>
          </Link>
          <Link to="/registered" className="text-decoration-none">
            <Button className="landingSign" variant="none">
              Sign up
            </Button>
          </Link>
        </div>
      </Container>
    </React.Fragment>
  );
};

export default LandingNav;
