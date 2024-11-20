/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 09/10/2024 - 19:46:20
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 09/10/2024
    * - Author          : 
    * - Modification    : 
**/
import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapPage from "./pages/Map/MapPage";
import Dashboard from "./pages/dashboard";
import NewProject from "./pages/newProject";
import ActiveProjects from "./pages/activeProjects";
import Trash from "./pages/trash";
import ArchieveProject from "./pages/archievedprojects";
import MyReports from "./pages/myreports";
import Start from "./pages/start";
import Login from "./pages/login";
import Registered from "./pages/registered";
import Register from "./pages/register";
import ResetPassword from "./pages/resetPassword";
import LinkSend from "./pages/linkSend";
import ChangePassword from "./pages/changePassword";
import ProjectOverview from "./pages/projectOverview";
import UnpaidProject from "./pages/unpaidProject";
import PaidProject from "./pages/paidProject";
import LandingPage from "./pages/landingPage";
import Payment from "./pages/payment";
import { auth } from "./firebase";
import Newpdf from "./pages/newPdf";
import ShowToken from "./pages/showToken/ShowToken";
import Security from "./pages/security";
import ProfileSetting from "./pages/profileSetting";
import Biling from "./pages/biling";
import { onAuthStateChanged } from "firebase/auth";
import { useState } from "react";
import DeleteProfile from "./pages/deleteProfile";
function App() {
  const [user, setUserData] = useState("");
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setUserData(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<LandingPage />} /> */}
        <Route path="/map_page" element={<MapPage />} />
        {user && <Route path="/dashboard" element={<Dashboard />} />}
        <Route path="/newproject" element={<NewProject />} />
        <Route path="/activeproject" element={<ActiveProjects />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/archievedProject" element={<ArchieveProject />} />
        <Route path="/myreports" element={<MyReports />} />
        <Route path="/" element={<Start />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registered" element={<Registered />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/linksend" element={<LinkSend />} />
        <Route path="/changepassword" element={<ChangePassword />} />
        <Route path="/projectoverview" element={<ProjectOverview />} />
        <Route path="/unpaidproject" element={<UnpaidProject />} />
        <Route path="/paidproject" element={<PaidProject />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/pdf" element={<Newpdf />} />
        <Route path="/createTokens" element={<ShowToken />} />
        <Route path="/security" element={<Security />} />
        <Route path="/profilesetting" element={<ProfileSetting />} />
        <Route path="/delprofile" element={<DeleteProfile />} />
        <Route path="/biling" element={<Biling />} />
        <Route path="/*" element={<Start />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
