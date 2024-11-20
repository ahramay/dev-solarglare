import React, { useState } from "react";
import RegistrationFooter from "../../components/shared/registrationFooter";
import RegistrationNavbar from "../../components/shared/registrationNavbar";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { useSearchParams } from "react-router-dom";
import Loader from "../../components/shared/loader";
import { Button } from "react-bootstrap";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const ChangePassword: React.FC = () => {
  const [loader, setLoader] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const actionCode = searchParams.get("oobCode");

  const handleResetPassword = () => {
    const passwordRegex = /(?=.*[a-zA-Z])(?=.*[0-9]).+/;
    let formValid = true;
    if (!passwordRegex.test(newPassword)) {
      formValid = false;
      setError("Password must contain at least 1 letter and 1 number");
    }
    if (newPassword.length < 8) {
      formValid = false;
      setError("Password must be at least 8 characters long");
    }
    if (newPassword !== repeatPassword) {
      formValid = false;
      setError("Password and Repeat Password must be same");
    }

    if (actionCode && formValid) {
      setLoader(true);
      verifyPasswordResetCode(auth, actionCode)
        .then(() => {
          confirmPasswordReset(auth, actionCode, newPassword).then((resp) => {
            navigate("/login");
            setLoader(false);
          });
        })

        .catch((e) => {
          setError("Something wrong plesae try again");
          console.log(e);
          setLoader(false);
        });
    } else {
      setError("Something wrong plesae try again");
      setLoader(false);
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
        <div>
          <input
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document.getElementById("repeatPassword")?.focus();
              }
            }}
            onChange={(e) => {
              const value = e.target.value.trim();
              setNewPassword(value);
            }}
            name="password"
            className="loginInput d-block my-4"
            type="password"
            placeholder="New password"
          />
          <input
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleResetPassword();
              }
            }}
            id="repeatPassword"
            onChange={(e) => {
              const value = e.target.value.trim();
              setRepeatPassword(value);
            }}
            name="password"
            className="loginInput d-block mt-4 mb-2"
            type="password"
            placeholder="Repeat new password"
          />
          <small className="error">{error} </small>
        </div>

        <Button onClick={handleResetPassword} className="login ">
          {loader ? (
            <span className="d-flex justify-content-center">
              <Loader />
            </span>
          ) : (
            "Confirm"
          )}
        </Button>
      </div>

      <RegistrationFooter />
    </React.Fragment>
  );
};
export default ChangePassword;
