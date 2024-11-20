import React, { useState, useEffect } from "react";
import RegistrationFooter from "../../components/shared/registrationFooter";
import RegistrationNavbar from "../../components/shared/registrationNavbar";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Start: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [shouldRender, setShouldRender] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const actionMode = searchParams.get("oobCode");
    const continueUrl = searchParams.get("continueUrl");
    if (continueUrl) {
      const urlParams = new URLSearchParams(continueUrl.split("?")[1]);
      const uid = urlParams.get("uid");
      navigate(`/delprofile?uid=${uid}`);
    } else {
      switch (mode) {
        case "resetPassword":
          navigate(`/changepassword/?oobCode=${actionMode}`);
          break;
        case "verifyEmail":
          navigate(`/dashboard/?oobCode=${actionMode}`);
          break;
        default:
          setShouldRender(true);
      }
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // signOut(auth)
        navigate("/dashboard");
      }else{
        setShouldRender(true);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <React.Fragment>
      <RegistrationNavbar />
      {shouldRender &&
      <div
        className="d-flex align-items-center flex-column justify-content-center"
        style={{ height: "90svh" }}
      >
        <h1 className="regLetsStart">Let's get started</h1> <br />
        <div className="d-flex flex-column flex-sm-row  justify-content-center align-items-center">
          <Link to="/login">
            <Button className="reglogin m-3" variant="none">
              Login
            </Button>
          </Link>
          <Link to="/registered">
            <Button className="reg m-3" variant="none">
              Register
            </Button>
          </Link>
        </div>
      </div>
}
      <RegistrationFooter />
    </React.Fragment>
  );
};

export default Start;
