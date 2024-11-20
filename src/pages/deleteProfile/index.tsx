import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Image } from "react-bootstrap";
import Backarrow from "../../images/ion_arrow-back.png";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import { useSearchParams } from "react-router-dom";
import { auth, db } from "../../firebase"; // import auth
import {
  reauthenticateWithCredential,
  sendEmailVerification,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { toast } from "react-toastify";
import {
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import Loader from "../../components/shared/loader";

const DeleteProfile: React.FC = () => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loader, setLoader] = useState(false);
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const navigate = useNavigate();

  const handleDeleteProfile = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("User is not authenticated");
      }

      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      const actionCodeSettings = {
        url: `http://localhost:3000/delprofile?uid=${user.uid}`,
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);
      navigate("/linksend");
    } catch (error: any) {
      console.error("Error deleting user:", error);

      if (error.code === "auth/too-many-requests") {
        setMessage("Something went wrong. Please try again later.");
      } else {
        setMessage("Your password is incorrect.");
      }
    }
  };

  const deleteUserAccount = async () => {
    setLoader(true);
    try {
      // Check if the user is authenticated before proceeding
      if (!auth.currentUser) {
        throw new Error("User is not authenticated");
      }

      // Delete user account

      const queries = [
        query(collection(db, "paidReport"), where("userId", "==", uid)),
        query(collection(db, "projects"), where("userId", "==", uid)),
      ];

      const querySnapshots = await Promise.all(queries.map(getDocs));

      const deletionPromises = querySnapshots.flatMap((snapshot) =>
        snapshot.docs.map((doc) => deleteDoc(doc.ref))
      );

      await Promise.all(deletionPromises);
      await deleteUser(auth?.currentUser);

      toast.success("User data deleted successfully");
      setLoader(false);
      navigate("/");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error in deleting successfully");
      setLoader(false);
    }
  };

  return (
    <div>
      {!uid ? (
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
                <p className="d-none d-sm-inline mx-1 backToDashboard">
                  Dashboard
                </p>
              </div>
            </Link>
            <h1 className="newProjects mx-auto pe-5">Delete Profile</h1>
          </div>
          <div className="d-flex justify-content-center align-items-center flex-column">
            <label className="deletePass" htmlFor="deletePass">
              <span className="d-block">Enter Password</span>
              <input
                type="password"
                id="deletePass"
                value={password}
                onChange={(e) => {
                  setMessage("");
                  setPassword(e.target.value);
                }}
              />
              <small className="text-danger error d-block ms-2">
                {message}
              </small>
            </label>
            <button className="deletePassbtn" onClick={handleDeleteProfile}>
              DELETE PROFILE
            </button>
          </div>
          <Footer />
        </div>
      ) : (
        <div className="deleteConfirmation">
          <section>
            <h1>Are you sure you want to delete your account</h1>
            <div className="d-flex justify-content-between align-items-center mt-5">
              <button className="confirmBtn" onClick={deleteUserAccount}>
                {loader ? (
                  <span className="d-flex justify-content-center">
                    {" "}
                    <Loader />
                  </span>
                ) : (
                  "Confirm"
                )}
              </button>
              <button
                className="cancelBtn"
                onClick={() => {
                  navigate("/dashboard");
                }}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default DeleteProfile;
