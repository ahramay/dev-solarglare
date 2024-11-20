import React, { useEffect, useState } from "react";
import { auth } from "../../firebase";

const ShowToken: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          setAccessToken(token);
        } catch (error) {
          console.error("Error fetching token:", error);
          setAccessToken("Failed to fetch token");
        }
      } else {
        setAccessToken("No user logged in");
      }
    };

    fetchToken();
  }, [auth.currentUser]);

  return (
    <div>
      <h3>User Name: {auth.currentUser?.displayName || "No user logged in"}</h3>
      <h3>User ID: {auth.currentUser?.uid || "No user logged in"}</h3>
      <h3>Access Token: {accessToken}</h3>
    </div>
  );
};

export default ShowToken;
