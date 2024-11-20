import React from "react";
import Image from "react-bootstrap/Image";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image1 from "../../images/Rectangle 2065.png";
import Image2 from "../../images/Rectangle 2067.png";
import CheckImage from "../../images/fluent_checkmark-16-filled.png";

const OrientationPanel: React.FC = () => {
  return (
    <React.Fragment>
      <Container className="mt-5 pt-5">
        <h1 className="orientMainHead">For multiple panel orientations</h1>
        <Row className="mt-5 pt-5 justify-content-center align-items-center">
          <Col md={6} lg={7} xl={6} className="d-md-block d-flex justify-content-center">
            <Image className="orient-Image1" alt="PVarea-Image" src={Image1} />
          </Col>
          <Col md={6} lg={5} xl={6} className="d-md-block d-flex justify-content-center">
            <div >
            <h3 className="orientHeading text-center text-sm-left">Tilted PV Areas</h3>
            <div className="orientSolarGlare" >
              Solar glare calculations for tilted PV areas involve taking into
              account the inclination angle of the solar panels.
            </div>
            <div className="d-flex orientChecked">
              <Image alt="checked-img" className="me-2 align-self-center" src={CheckImage} />
              Vertical Panel Orientation: Accounts for vertical installations.
            </div>
            <div className=" d-flex orientChecked">
              <Image alt="checked-img" className="me-2 align-self-center" src={CheckImage} />
              Reflection Analysis: Evaluates glare from reflections off vertical
              surfaces
            </div>
            <div className="d-flex orientChecked">
              <Image alt="checked-img" className="me-2 align-self-center" src={CheckImage} />
              Sun-Path Diagrams: Visualizes solar trajectory for vertical
              surfaces.
            </div>
            <div className="d-flex  orientChecked">
              <Image alt="checked-img" className="me-2 align-self-center" src={CheckImage} />
             <p> Real-Time Glare Assessment: Considers dynamic sun movement
              throughout the day</p>
            </div>
            </div>
          </Col>
        </Row>
        <Row className="flex-md-row mt-5 flex-column-reverse justify-content-center align-items-center">
          <Col md={6} lg={5} xl={6} className="d-md-block d-flex justify-content-center">
            <div >
            <h3 className="orientHeading text-center text-sm-left">Vertical PV Area</h3>
            <div className="orientSolarGlare" >
            APP NAME accommodates vertical PV installations, such as building-integrated solar panels, balcony panels or solar walls.
            </div>
            <div className="d-flex orientChecked">
              <Image alt="checked-img" className="me-2 align-self-center" src={CheckImage} />
              Vertical Panel Orientation: Accounts for vertical installations.
            </div>
            <div className="d-flex orientChecked">
              <Image alt="checked-img" className="me-2 align-self-center" src={CheckImage} />
              Reflection Analysis: Evaluates glare from reflections off vertical
              surfaces
            </div>
            <div className="d-flex orientChecked">
              <Image alt="checked-img" className="me-2 align-self-center" src={CheckImage} />
              Sun-Path Diagrams: Visualizes solar trajectory for vertical
              surfaces.
            </div>
            <div className="d-flex orientChecked">
              <Image alt="checked-img" className="me-2 align-self-center" src={CheckImage} />
             <p> Real-Time Glare Assessment: Considers dynamic sun movement
              throughout the day</p>
            </div>
            </div>
          </Col>
          <Col md={6} lg={7} xl={6} className="d-md-block d-flex justify-content-center">
            <Image className="orient-Image1" alt="PVarea-Image" src={Image2} />
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  );
};

export default OrientationPanel;
