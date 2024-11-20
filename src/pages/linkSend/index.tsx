import React from "react";
import RegistrationFooter from "../../components/shared/registrationFooter";
import RegistrationNavbar from "../../components/shared/registrationNavbar";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
const LinkSend: React.FC = () => {
  return (
    <React.Fragment>
      <RegistrationNavbar />
      <div
        style={{ height: "90vh" }}
        className="d-flex flex-column justify-content-center align-items-center "
      >
        <h1 className="text-center" >
          Link sent <br /> Check your inbox
        </h1>
        <Link to="/" ><Button className="login">Back to menu</Button></Link>
      </div>
      <RegistrationFooter />
    </React.Fragment>
  );
};

export default LinkSend;
