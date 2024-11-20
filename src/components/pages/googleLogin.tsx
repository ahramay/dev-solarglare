import React, { useState } from "react";
import { Button } from "react-bootstrap";
import GoogleIcon from "../../images/flat-color-icons_google.png";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { Image } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";

const GoogleLogin: React.FC = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleGoogleSignIn = async () => {
    signInWithPopup(auth, googleProvider)
      .then(async () => {
        navigate("/dashboard");
      })
      .catch(() => {
        setError(`Error in google sign `);
      });
  };
  return (
    <React.Fragment>
      <Button
        className="googleLogin"
        variant="none"
        onClick={handleGoogleSignIn}
      >
        <Image width={20} className="pb-1 mx-2" src={GoogleIcon} /> Google
      </Button>
      <small className="error d-block">{error}</small>
    </React.Fragment>
  );
};

export default GoogleLogin;
