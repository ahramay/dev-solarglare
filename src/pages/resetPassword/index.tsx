import React, { useState } from "react";
import RegistrationFooter from "../../components/shared/registrationFooter";
import RegistrationNavbar from "../../components/shared/registrationNavbar";
import { Button } from "react-bootstrap";
import Loader from "../../components/shared/loader";
import { useNavigate } from "react-router-dom";
import {
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../firebase";
const ResetPassword: React.FC = () => {
  const [loader, setLoader] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handelEmail = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const email = e.target.value.trim();
    setEmail(email);
    setError("");
  };

  const checkEmail = async () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    try {
      setLoader(true);
      setError("");

      if (!emailRegex.test(email)) {
        setLoader(false);
        setError("Invalid Email Address");
        return;
      }
      await fetchSignInMethodsForEmail(auth, email).then(async (methods) => {
        if (methods.length === 0) {
          setLoader(false);
          setError("Invalid Email Address");
        } else {
          await sendPasswordResetEmail(auth, email);
          setLoader(false);
          navigate("/linksend");
        }
      });
    } catch (error) {
      setLoader(false);
      setError("Something went wrong please try again");
    }
  };

  return (
    <React.Fragment>
      <RegistrationNavbar />
      <div
        style={{ height: "90vh" }}
        className="d-flex flex-column align-items-center justify-content-evenly"
      >
        <h1 className="">Reset Password</h1>
        {/* <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}> */}
        <div>
          <input
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                checkEmail();
              }
            }}
            onChange={handelEmail}
            name="email"
            className="loginInput d-block"
            type="email"
            placeholder="Email Address"
          />
          <small className="error">{error} </small>
        </div>

        <Button onClick={checkEmail} className="login ">
          {loader ? (
            <span className="d-flex justify-content-center">
              <Loader />
            </span>
          ) : (
            "Confirm"
          )}
        </Button>
      </div>
      {/* </div> */}

      <RegistrationFooter />
    </React.Fragment>
  );
};

export default ResetPassword;
