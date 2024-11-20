import React, { useState } from "react";
import RegistrationFooter from "../../components/shared/registrationFooter";
import RegistrationNavbar from "../../components/shared/registrationNavbar";
import { Button } from "react-bootstrap";
import { Image } from "react-bootstrap";
import GoogleLogin from "../../components/pages/googleLogin";
import FacebookIcon from "../../images/logos_facebook.png";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/shared/loader";
import { getAuth, fetchSignInMethodsForEmail } from "firebase/auth";
import Backarrow from "../../images/ion_arrow-back.png";
import { Link } from "react-router-dom";

const Registered: React.FC = () => {
  const auth = getAuth();
  const [email, setEmail] = useState("");
  const [loader, setLoader] = useState(false);
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
      await fetchSignInMethodsForEmail(auth, email).then((methods) => {
        if (methods.length > 0) {
          setLoader(false);
          setError("Email address is already in use.");
        } else {
          setLoader(false);
          localStorage.setItem("userEmail", email);
          navigate("/register");
        }
      });
    } catch (error) {
      setLoader(false);
      setError("Something is wrong please try again");
    }
  };

  return (
    <React.Fragment>
      <RegistrationNavbar />
      <div className="text-center my-5">
        <div className="d-flex my-3 align-items-center ">
          <Link
            style={{ width: "fit-content", position: "absolute" }}
            className="text-decoration-none"
            to="/login"
          >
            <div className="ms-3 d-flex align-items-center">
              <Image className="mb-3 me-1" src={Backarrow} width={20} height={20} alt="back_arrow" />
              <p className="d-none d-sm-inline mx-1 backToDashboard">Login</p>
            </div>
          </Link>
          <h1 className="newProjects mx-auto pe-5">Register</h1>
        </div>
        <input
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              checkEmail();
            }
          }}
          onChange={handelEmail}
          className="loginInput my-3"
          type="email"
          placeholder="Email"
        />

        <span className="text-danger d-block error">{error}</span>
        <br />
        <p className="loginOR">Or</p>
        <GoogleLogin />
        <br />
        <Button className="facebookLogin my-3 " variant="none">
          <Image width={20} className="pb-1 mx-2" src={FacebookIcon} /> Facebook
        </Button>
        <br />
        <Button variant="none" className="login" onClick={checkEmail}>
          {loader ? (
            <span className="d-flex justify-content-center">
              {" "}
              <Loader />
            </span>
          ) : (
            "Register"
          )}
        </Button>
      </div>
      <RegistrationFooter />
    </React.Fragment>
  );
};
export default Registered;
