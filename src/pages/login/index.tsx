import React, { useEffect, useState } from "react";
import GoogleLogin from "../../components/pages/googleLogin";
import RegistrationNavbar from "../../components/shared/registrationNavbar";
import RegistrationFooter from "../../components/shared/registrationFooter";
import { Button } from "react-bootstrap";
import { Image } from "react-bootstrap";
import FacebookIcon from "../../images/logos_facebook.png";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/shared/loader";
import { Link } from "react-router-dom";
import Backarrow from "../../images/ion_arrow-back.png";
import { signInWithPopup } from "firebase/auth";
import { auth, facebookProvider } from "../../firebase";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [facebookError, setfacebookError] = useState("");
  const [loader, setLoader] = useState(false);
  const [forgetPassword, setForgetPassword] = useState(false);
  const navigate = useNavigate();
  // handle Input Value
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const facebookLogin = () => {
    signOut(auth);
    signInWithPopup(auth, facebookProvider)
      .then((result) => {
        navigate("/dashboard");
      })
      .catch((error: Error) => {
        console.error(error);
        setfacebookError(`Error in facebook sign `);
      });
  };

  const handleLogin = async () => {
    setForgetPassword(false);
    setLoader(true);
    setError("");
    await signInWithEmailAndPassword(auth, formData.email, formData.password)
      .then(() => {
        navigate("/dashboard");
        setLoader(false);
      })
      .catch(() => {
        setError("Invalid Email or Password");
        setForgetPassword(true);
        setLoader(false);
      });
  };

  useEffect(() => {
    if (auth.currentUser) {
      navigate("/dashboard");
    }
  }, [auth.currentUser]);
  return (
    <React.Fragment>
      <RegistrationNavbar />
      <div className="text-center my-5">
        <div className="d-flex align-items-center mb-3">
          <Link
            style={{ width: "fit-content", position: "absolute" }}
            className="text-decoration-none"
            to="/registered"
          >
            <div className="mx-3 d-flex align-items-center">
              <Image src={Backarrow} alt="back_arrow" />
              <h1 className="d-none d-sm-inline  mx-2 backToDashboard my-0">
                Sign up
              </h1>
            </div>
          </Link>
          {/* <h1 className="newProjects mx-auto pe-5">Welcome Back</h1> */}
        </div>
        <form>
          <input
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document.getElementById("password")?.focus();
              }
            }}
            name="email"
            onChange={handleInputChange}
            className="loginInput my-3"
            type="email"
            placeholder="Email"
          />
          <br />
          <input
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
            id="password"
            name="password"
            onChange={handleInputChange}
            className="loginInput my-3"
            type="password"
            placeholder="Password"
          />
          <br />
          <small className="text-danger error">{error} </small>
        </form>
        <p className="loginOR mt-1">Or</p>
        <GoogleLogin />
        <br />
        <Button
          onClick={facebookLogin}
          className="facebookLogin my-3 "
          variant="none"
        >
          <Image width={20} className="pb-1 mx-2" src={FacebookIcon} /> Facebook
        </Button>
        <br />
        <small className="error d-block">{facebookError}</small>
        <br />
        {forgetPassword && (
          <small
            onClick={() => navigate("/resetpassword")}
            className="forgetpassword"
          >
            Forgot login credentials?
          </small>
        )}
        <br />
        <Button onClick={handleLogin} className="login my-5">
          {loader ? (
            <span className="d-flex justify-content-center">
              {" "}
              <Loader />
            </span>
          ) : (
            "Login"
          )}
        </Button>
      </div>
      <RegistrationFooter />
    </React.Fragment>
  );
};

export default Login;
