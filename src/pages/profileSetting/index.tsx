import React, { useState } from "react";
import Backarrow from "../../images/ion_arrow-back.png";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import { Link, useNavigate } from "react-router-dom";
import { Accordion, Image } from "react-bootstrap";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "../../firebase";
import { updateEmail, updateProfile } from "firebase/auth";
import { toast } from "react-toastify";
import Loader from "../../components/shared/loader";

const ProfileSetting: React.FC = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [loader, setLoader] = useState<boolean>(false);
  const user = auth.currentUser;
  const displayName = user?.displayName;
  const email = user?.email;

  const [firstName, ...lastNameArr] = displayName?.split(" ") || [];
  const lastName = lastNameArr.join(" ");

  const [userData, setUserData] = useState({
    firstName: firstName || "",
    lastName: lastName || "",
    email: email || "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const formValidation = () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    let formValid = true;
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
    };

    if (userData.firstName.trim().length === 0) {
      formValid = false;
      newErrors.firstName = "First Name is required";
    }
    if (userData.lastName.trim().length === 0) {
      formValid = false;
      newErrors.lastName = "Last Name is required";
    }
    // if (!emailRegex.test(userData.email)) {
    //   formValid = false;
    //   newErrors.email = "Invalid Email Address";
    // }
    setErrors(newErrors);
    return formValid;
  };

  const updateUserData = async () => {
    setLoader(true);
    const user = auth.currentUser;
    if (user && formValidation()) {
      try {
        let downloadURL = user.photoURL;

        if (profilePic) {
          const storageRef = ref(storage, `solarCalc/${profilePic.name}`);
          await uploadBytes(storageRef, profilePic);
          downloadURL = await getDownloadURL(storageRef);
        }

        await updateProfile(user, {
          displayName: `${userData.firstName} ${userData.lastName}`,
          photoURL: downloadURL,
        });

        // if (userData.email && userData.email !== user.email) {
        //   await updateEmail(user, userData.email);
        // }
        toast.success("User data updated successfully");
        setLoader(false);
        navigate("/dashboard");
      } catch (error) {
        setLoader(false);
        console.error("Error updating user data:", error);
        toast.success("Error updating user data");
      }
    } else {
      // toast.error("No user is logged in");
      setLoader(false);
    }
  };

  return (
    <div>
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
        <h1 className="newProjects mx-auto pe-5">Profile Setting</h1>
      </div>
      <section className="profileSettingSection">
        <div className="d-flex profileSettingDiv justify-content-between align-items-center">
          <label htmlFor="firstName">
            <span className="d-block mb-2">First Name *</span>
            <input
              type="text"
              className="profileSettingInput"
              id="firstName"
              name="firstName"
              autoComplete="off"
              value={userData?.firstName}
              onChange={handleChange}
              required
            />
            <small className="error text-danger d-block">
              {errors.firstName}
            </small>
          </label>

          <label htmlFor="lastName">
            <span className="d-block mb-2">Last Name *</span>
            <input
              type="text"
              className="profileSettingInput"
              id="lastName"
              name="lastName"
              autoComplete="off"
              value={userData.lastName}
              onChange={handleChange}
              required
            />
            <small className="error text-danger d-block">
              {errors.lastName}
            </small>
          </label>
        </div>
        <div className="d-flex profileSettingDiv justify-content-between align-items-center mt-2">
          <label htmlFor="email">
            <span className="d-block mb-2">Email *</span>
            <input
              type="text"
              className="profileSettingInput"
              id="email"
              name="email"
              autoComplete="off"
              value={userData.email}
              readOnly
              disabled
              // onChange={handleChange}
              required
            />
            {/* <small className="error text-danger d-block">{errors.email}</small> */}
          </label>
          <label htmlFor="phoneNumber">
            <span className="d-block mb-2">Phone</span>
            <input
              type="number"
              className="profileSettingInput"
              id="phoneNumber"
              name="phoneNumber"
              autoComplete="off"
              value={userData.phoneNumber}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div className="mt-4">
          <label
            style={{ fontSize: "16px", fontWeight: "600" }}
            className="d-block mb-2"
          >
            Profile Picture
          </label>
          <div className="d-flex justify-content-center align-items-center profileSetting-upload-container">
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
              style={{ cursor: "pointer" }}
              src={`${user?.photoURL}`}
            />
            {profilePic ? (
              <img
                width={50}
                src={URL.createObjectURL(profilePic)}
                alt="Selected Profile Pic"
                className="selected-image"
              />
            ) : (
              user?.photoURL && (
                <img
                  style={{ borderRadius: "50px" }}
                  width={50}
                  src={user?.photoURL}
                  alt="Default Profile Pic"
                  className="selected-image"
                />
              )
            )}
          </div>
        </div>
        <Accordion className="profileSettingAccordian">
          <Accordion.Item eventKey="0">
            <Accordion.Header>I’m a business customer</Accordion.Header>
            <Accordion.Body className="px-0">
              <div className="profileSettingDiv">
                <label htmlFor="companyName">
                  <span className="d-block mb-2">Company Name *</span>
                  <input
                    type="text"
                    className="companyNameInput"
                    id="companyName"
                    name="companyName"
                    autoComplete="off"
                    //   value={userData.currentPassword}
                    //   onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="d-flex profileSettingDiv justify-content-between align-items-center my-3">
                <label htmlFor="Country">
                  <span className="d-block mb-2">Country *</span>
                  <input
                    type="text"
                    className="profileSettingInput"
                    id="Country"
                    name="Country"
                    autoComplete="off"
                    //   value={userData.currentPassword}
                    //   onChange={handleChange}
                    required
                  />
                </label>
                <label htmlFor="city">
                  <span className="d-block mb-2">City *</span>
                  <input
                    type="text"
                    className="profileSettingInput"
                    id="city"
                    name="city"
                    autoComplete="off"
                    //   value={userData.currentPassword}
                    //   onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="d-flex profileSettingDiv justify-content-between align-items-center">
                <label htmlFor="street">
                  <span className="d-block mb-2">Street *</span>
                  <input
                    type="text"
                    className="profileSettingInput"
                    id="street"
                    name="street"
                    autoComplete="off"
                    //   value={userData.currentPassword}
                    //   onChange={handleChange}
                    required
                  />
                </label>
                <label htmlFor="vatNumber">
                  <span className="d-block mb-2">VAT Number *</span>
                  <input
                    type="text"
                    className="profileSettingInput"
                    id="vatNumber"
                    name="vatnumber"
                    autoComplete="off"
                    //   value={userData.currentPassword}
                    //   onChange={handleChange}
                    required
                  />
                </label>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <button onClick={updateUserData} className="saveProfileSetting">
          {loader ? (
            <span className="d-flex justify-content-center">
              <Loader />
            </span>
          ) : (
            "Save profile setting"
          )}
        </button>
        <Link to="/delprofile" className="delprofile">
          DELETE PROFILE
        </Link>
      </section>
      <Footer />
    </div>
  );
};

export default ProfileSetting;
