import React, { useEffect, useState } from "react";
import OrientationPanel from "../../components/pages/orientationPanel";
import LandingNav from "../../components/pages/landingNav";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Image1 from "../../images/image 7.png";
import CallAction from "../../components/pages/callAction";
import LandingPricing from "../../components/pages/landingPricing";
import ClientSlider from "../../components/pages/clientSlider";
import SollutionSlider from "../../components/pages/sollutionSlider";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
const LandingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [shouldRender, setShouldRender] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const actionMode = searchParams.get("oobCode");

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
  }, [searchParams, navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !location.state) {
        navigate("/dashboard");
      } else if (location.state === "logout") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => unsubscribe();
  }, [navigate, location.state]);

  return (
    <React.Fragment>
      {shouldRender && isAuthenticated && (
        <div>
          <LandingNav />
          <Container className="mt-4">
            <Row className="align-items-center justify-content-center m-auto">
              <Col
                xs={12}
                md={6}
                className="d-md-block d-flex align-items-center justify-content-center"
              >
                <div>
                  <p className="lanAppName ms-2">APP NAME</p>
                  <h1 className="lanEasySolar">
                    App for easy solar <br /> glare calculating
                  </h1>
                  <p className="lanGlareText">
                    Calculate the glare of an existing or planned <br /> PV
                    system easy
                  </p>
                  <Button
                    className="lanTryNow mt-4 d-none d-md-block"
                    variant="none"
                  >
                    Try Now
                  </Button>
                </div>
              </Col>
              <Col
                className="d-md-block d-flex align-items-center justify-content-center"
                xs={12}
                md={6}
              >
                <div>
                  <Image className="lanImage1" src={Image1} /> <br />
                  <Button
                    className="lanTryNow mt-4 d-block d-md-none"
                    variant="none"
                  >
                    Try Now
                  </Button>
                </div>
              </Col>
            </Row>
          </Container>
          <h1 className="container lanSolution mt-5 py-5">Solution</h1>
          <SollutionSlider />
          <OrientationPanel />
          <CallAction />
          <LandingPricing />
          <ClientSlider />
          <footer className="mt-5 pt-5 bg-light">
            <Container className="py-5 my-3">
              <h1 className="lanFootHeading">FINAL CTA TEXT</h1>
              <p className="lanFootText">
                Solar glare calculations for tilted PV areas involve taking into
                account the inclination angle of the
              </p>
              <p className="lanFootText">
                By purchasing the detailed report of glare you get:
              </p>
              <Button className="lanTryNow mt-4" variant="none">
                Try Now
              </Button>
            </Container>
            <div className="d-flex justify-content-sm-evenly justify-content-between align-items-center px-3 pt-2 pb-1">
              <p className="lanFooterText d-none d-sm-block m-0 p-0">
                &copy;&nbsp;Sonwinn&nbsp;GmbH&nbsp;2023
              </p>
              <p className="lanFooterText ms-0 ms-sm-auto m-0 p-0">
                Privacy Policy
              </p>
              <p className="lanFooterText me-0 me-sm-auto ps-sm-3 m-0 p-0">
                Impressum
              </p>
              <p className="lanFooterText m-0 p-0">Contact&nbsp;us</p>
            </div>
            <div className="pb-1 pt-0 m-0 d-sm-none d-block">
              <hr className="my-2" />
              <p className="p-0 m-0 lanFooterText text-center">
                &copy;&nbsp;Sonwinn&nbsp;GmbH&nbsp;2023
              </p>
            </div>
          </footer>
        </div>
      )}
    </React.Fragment>
  );
};

export default LandingPage;
