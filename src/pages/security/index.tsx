import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Image } from "react-bootstrap";
import Backarrow from "../../images/ion_arrow-back.png";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../firebase";
import Loader from "../../components/shared/loader";
import { toast } from "react-toastify";

const Security: React.FC = () => {
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
  const navigate = useNavigate();
  const [success, setSuccess] = useState<boolean>();
  const [loader, setLoader] = useState<boolean>(false);
  const [error, setError] = useState({
    currentPassword: "",
    newPassword: "",
    repeatNewPassword: "",
  });
  const [userData, setUserData] = useState({
    currentPassword: "",
    newPassword: "",
    repeatNewPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError({
      currentPassword: "",
      newPassword: "",
      repeatNewPassword: "",
    });
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value.trim(),
    }));
  };
  const formValidation = () => {
    let formValid = true;
    let newErrors = {
      currentPassword: "",
      newPassword: "",
      repeatNewPassword: "",
    };

    if (!passwordRegex.test(userData.newPassword)) {
      newErrors.newPassword =
        "Password must include 1 letter, 1 number, and be 8+ characters";
      formValid = false;
    }

    if (userData.newPassword !== userData.repeatNewPassword) {
      newErrors.repeatNewPassword = "Passwords do not match";
      formValid = false;
    }
    setError(newErrors);

    return formValid;
  };

  const handlePasswordChange = async () => {
    setLoader(true);
    const user = auth.currentUser;
    if (user && user.email) {
      const credential = EmailAuthProvider.credential(
        user.email,
        userData.currentPassword
      );
      await reauthenticateWithCredential(user, credential)
        .then(async () => {
          if (formValidation()) {
            await updatePassword(user, userData.newPassword);
            toast.success("Password Updated Successfully");
            signOut(auth).then(() => {
              navigate("/login");
            });
            setLoader(false);
          } else {
            setLoader(false);
          }
        })
        .catch(() => {
          setError({
            currentPassword: "Incorrect current password",
            newPassword: "",
            repeatNewPassword: "",
          });
          setLoader(false);
          setSuccess(true);
        });
    } else {
      toast.error("No user is logged in");
      setLoader(false);
    }
  };

  return (
    <div className="securityDiv">
      <Navbar />
      <div className="d-flex my-3 align-items-center ">
        <Link
          style={{ width: "fit-content", position: "absolute" }}
          className="text-decoration-none"
          to="/dashboard"
        >
          <div className="ms-3 d-flex align-items-center">
            <Image
              className="mb-3 me-1"
              src={Backarrow}
              width={20}
              height={20}
              alt="back_arrow"
            />
            <p className="d-none d-sm-inline mx-1 backToDashboard">Dashboard</p>
          </div>
        </Link>
        <h1 className="newProjects mx-auto pe-5">Security</h1>
      </div>
      <div className="d-flex align-items-center flex-column justify-content-between">
        <section>
          <label htmlFor="oldPassword">
            <span className="d-block mb-2">Current Password</span>
            <input
              type="password"
              className="Securityinput"
              id="oldPassword"
              name="currentPassword"
              value={userData.currentPassword}
              onChange={handleChange}
              required
            />
          </label>
          <small className="error text-danger d-block">
            {error.currentPassword}
          </small>
          <br />
          <label htmlFor="newPassword">
            <span className="d-block mb-2">New Password</span>
            <input
              type="password"
              className="Securityinput"
              id="newPassword"
              name="newPassword"
              value={userData.newPassword}
              onChange={handleChange}
              required
            />
          </label>
          <small className="error text-danger d-block">
            {error.newPassword}
          </small>
          <br />
          <label htmlFor="repeatNewPassword">
            <span className="d-block mb-2">Repeat New Password</span>
            <input
              type="password"
              className="Securityinput"
              id="repeatNewPassword"
              name="repeatNewPassword"
              value={userData.repeatNewPassword}
              onChange={handleChange}
              required
            />
          </label>
          <small className="error text-danger d-block">
            {error.repeatNewPassword}
          </small>
          {success && (
            <Link to="/resetPassword" className="text-decoration-none">
              <p className="forgetPassword">Forget Password?</p>
            </Link>
          )}
        </section>
        <button
          onClick={handlePasswordChange}
          className="securitySaveBtn"
          type="submit"
        >
          {loader ? (
            <span className="d-flex justify-content-center">
              <Loader />
            </span>
          ) : (
            "Save"
          )}
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default Security;
