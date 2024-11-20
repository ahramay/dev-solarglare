import React, { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import { Image } from "react-bootstrap";
import Logo from "../../images/logo.svg";
import Dropdown from "react-bootstrap/Dropdown";
import HamburgerIcon from "../../images/hamburgerIcon.png";
import Settings from "../../images/solar_settings-linear.png";
import Logout from "../../images/logout.png";
import Security from "../../images/security.png";
import Billing from "../../images/biling.png";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/");
    });
  };
  return (
    <React.Fragment>
      <Container
        fluid
        className="navbar d-flex justify-content-between py-1 px-1 align-items-center"
      >
        <Link to="https://pv-glarecheck.com/" className="text-decoration-none">
          <div className="d-flex align-items-center">
            <Image className="mx-2 " src={Logo} alt="logo" />
            {/* <p className="solarCalc">Solar Calc</p> */}
          </div>
        </Link>

        <Dropdown>
          <div className="d-sm-flex  align-items-center d-none">
            <p className="myProfile">{auth.currentUser?.displayName}</p>
            <Dropdown.Toggle className="imgDropdown" variant="none">
              {/* {auth.currentUser && auth.currentUser.photoURL && ( */}
              <Image
                className="mx-2"
                src={`${auth.currentUser?.photoURL}`}
                roundedCircle
                width={40}
                alt="profilePic"
              />
              {/* )} */}
            </Dropdown.Toggle>
          </div>
          <Dropdown.Menu className="mt-3 p-2">
            <Dropdown.Item className="navDropDown d-flex align-items-center">
              <Link
                to="/profilesetting"
                className="text-dark text-decoration-none d-flex align-items-center"
              >
                <Image width={20} src={Settings} />
                <span className="mx-2">Settings</span>
              </Link>
            </Dropdown.Item>
            <Dropdown.Item className="navDropDown mt-2">
              <Link
                to="/security"
                className="text-dark text-decoration-none d-flex align-items-center"
              >
                <Image width={20} src={Security} />
                <span className="mx-2">Security</span>
              </Link>
            </Dropdown.Item>
            <Dropdown.Item className="navDropDown mt-2">
              <Link
                to="/biling"
                className="text-dark text-decoration-none d-flex align-items-center"
              >
                <Image width={20} src={Billing} />
                <span className="mx-2">Billing</span>
              </Link>
            </Dropdown.Item>
            <Dropdown.Item
              onClick={handleLogout}
              className="navDropDown d-flex align-items-center mt-2"
            >
              <Image width={20} src={Logout} />
              <span className="mx-2">Logout</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <div className="d-sm-none me-3 mt-2">
          <Image
            className="mb-2 cursor-pointer"
            src={HamburgerIcon}
            roundedCircle
            width={20}
            alt="profilePic"
          />
        </div>
      </Container>
    </React.Fragment>
  );
};

export default Navbar;
