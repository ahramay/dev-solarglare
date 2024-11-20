import React, { useEffect, useState } from "react";
import RegistrationFooter from "../../components/shared/registrationFooter";
import RegistrationNavbar from "../../components/shared/registrationNavbar";
import { Button } from "react-bootstrap";
import { auth, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Loader from "../../components/shared/loader";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import Alert from "react-bootstrap/Alert";
import Backarrow from "../../images/ion_arrow-back.png";
import { Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    foreName: "",
    password: "",
    repeatPassword: "",
  });
  const [formData, setFormData] = useState({
    email: localStorage.getItem("userEmail") || " ",
    firstName: "",
    foreName: "",
    password: "",
    repeatPassword: "",
  });

  const checkValidation = (form: any) => {
    const passwordRegex = /(?=.*[a-zA-Z])(?=.*[0-9]).+/;
    let formValid = true;
    const newErrors = {
      firstName: "",
      foreName: "",
      password: "",
      repeatPassword: "",
    };

    if (formData.firstName.trim().length === 0) {
      formValid = false;
      newErrors.firstName = "First Name is required";
    }
    if (formData.foreName.trim().length === 0) {
      formValid = false;
      newErrors.foreName = "Fore Name is required";
    }
    if (!passwordRegex.test(formData.password.trim())) {
      formValid = false;
      newErrors.password =
        "Password must contain at least 1 letter and 1 number";
    } else if (formData.password.trim().length < 8) {
      formValid = false;
      newErrors.password = "Password must be at least 8 characters long";
    }
    if (formData.password !== formData.repeatPassword) {
      formValid = false;
      newErrors.repeatPassword = "Password and Repeat Password must be same";
    }

    setErrors(newErrors);
    return { formValid };
  };

  //get form data and set in usestate
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: "",
    });
  };

  // addUserData in firebase
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setAlertSuccess(false);
    if (checkValidation(e.target).formValid) {
      try {
        setLoader(true);
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        if (profilePic) {
          const storageRef = ref(storage, `solarCalc/${profilePic.name}`);
          await uploadBytes(storageRef, profilePic);
          const downloadURL = await getDownloadURL(storageRef);
          await updateProfile(user, {
            displayName: `${formData.firstName} ${formData.foreName}`,
            photoURL: downloadURL,
          });
        } else {
          await updateProfile(user, {
            displayName: `${formData.firstName} ${formData.foreName}`,
            photoURL:
              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
          });
        }

        await sendEmailVerification(user);
        setLoader(false);
        setAlertSuccess(true);
      } catch (error) {
        setLoader(false);
        console.error("Error in sending message:", error);
        console.error("Error uploading file:", error);
      }
    }
  };

  useEffect(() => {
    if (alertSuccess) {
      const timeout = setTimeout(() => {
        navigate("/login");
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [alertSuccess]);

  return (
    <React.Fragment>
      <RegistrationNavbar />
      <div className="mb-2 mt-5 d-flex align-items-center ">
        <Link
          style={{ width: "fit-content", position: "absolute" }}
          className="text-decoration-none"
          to="/registered"
        >
          <div className="mx-3 d-flex align-items-center">
            <Image className="mb-3" src={Backarrow} alt="back_arrow" />
            <p className="d-none d-sm-inline  mx-2 backToDashboard">Back</p>
          </div>
        </Link>
        <h1 className="newProjects mx-auto">Register</h1>
      </div>
      <div className="d-flex justify-content-center">
        <form>
          <div className="d-flex justify-content-center">
            <div>
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    document.getElementById("foreName")?.focus();
                  }
                }}
                name="firstName"
                onChange={handleInputChange}
                required
                className="registerFname me-2 mt-4"
                type="text"
                placeholder="Name *"
              />
              <small className="error text-danger d-block">
                {errors.firstName}
              </small>
            </div>
            <div>
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    document.getElementById("password")?.focus();
                  }
                }}
                id="foreName"
                name="foreName"
                onChange={handleInputChange}
                required
                className="registerLname ms-2 mt-4"
                type="text"
                placeholder="Forename *"
              />
              <small className="text-danger error d-block ms-2">
                {errors.foreName}
              </small>
            </div>
          </div>
          <input
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document.getElementById("repeatPassword")?.focus();
              }
            }}
            id="password"
            name="password"
            onChange={handleInputChange}
            required
            className="loginInput mt-4"
            type="password"
            placeholder="Password *"
          />
          <small className="text-danger error d-block">{errors.password}</small>

          <input
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document.getElementById("fileInput")?.focus();
              }
            }}
            id="repeatPassword"
            onChange={handleInputChange}
            required
            name="repeatPassword"
            className="loginInput mt-4"
            type="password"
            placeholder="Repeat Password *"
          />
          <small className="text-danger error d-block">
            {errors.repeatPassword}
          </small>

          <div className="my-3">
            <div className="d-flex justify-content-center align-items-center register-upload-container">
              <input
                name="profilePic"
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                  if (e.target.files && e.target.files[0]) {
                    const selectedFile = e.target.files[0];
                    setProfilePic(selectedFile);
                  }
                }}
                type="file"
                className="file-input"
                id="fileInput"
                accept="image/*"
              />
              {profilePic ? (
                <img
                  width={50}
                  src={URL.createObjectURL(profilePic)}
                  alt="Selected Profile Pic"
                  className="selected-image"
                />
              ) : (
                <label htmlFor="fileInput" className="upload-text">
                  <span className="upload-icon"></span>
                  Click here to upload profile picture
                </label>
              )}
            </div>
            <Alert
              className="mt-3"
              style={{ fontFamily: "lato" }}
              show={alertSuccess}
              variant={"success"}
            >
              Please Verify Your Email Address
            </Alert>
            <Button onClick={handleSubmit} className="registerCont my-5">
              {loader ? (
                <span className="d-flex justify-content-center">
                  <Loader />
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </div>
      <RegistrationFooter />
    </React.Fragment>
  );
};

export default Register;
