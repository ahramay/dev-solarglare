import React from "react";
import { Link } from "react-router-dom";
import Image1 from "../../images/Rectangle 2081.png"
import Button from "react-bootstrap/Button";
import {Container,Col,Row,Image} from "react-bootstrap";
import FluentBoxImage from "../../images/fluent_box-24-regular.png";
import SollutionSlider from "./sollutionSlider";
const CallAction: React.FC = () => {
  return (
    <React.Fragment>
       <div className="container text-center mt-5 pt-5 d-flex flex-column justify-content-center align-items-center CallAction">
        <h1>Call to action heading </h1>
        <p>Solar glare calculations for tilted PV areas involve taking into account the inclination angle of the solar panels.</p>
        <div>
          <Link to="/login" className="text-decoration-none">
            <Button className="landingLog" variant="none">
              Log in
            </Button>
          </Link>
          <Link to="/registered" className="text-decoration-none">
            <Button className="landingSign" variant="none">
              Sign up
            </Button>
          </Link>
        </div>
       </div>
       <Container>
        <Row className="justify-content-center align-items-center mt-2 pt-5">
          <Col className="d-flex justify-content-center align-items-center callActionDiv" lg={5} xl={4}>
          <Image className="d-flex justify-content-center callActionImage" src={Image1} alt=""/>
          </Col>
          <Col lg={7} xl={8} className="ps-5">
          <Row className="d-none d-md-flex mt-4 mt-lg-0">
            <Col md={6}>
            <div className="d-flex flex-column align-items-center align-items-md-start">
                <Image className="lanFluentBox actionFluentBox" src={FluentBoxImage} />
                <h3 className="lanScrollHeading">App solution 1</h3>
                <p className="lanScrolltext text-center text-md-start">
                  Solar glare calculations for tilted PV areas involve taking
                  into account the inclination angle of the solar panels.
                </p>
              </div>
            </Col>
            <Col md={6}>
            <div className="d-flex flex-column align-items-center align-items-md-start">
                <Image className="lanFluentBox" src={FluentBoxImage} />
                <h3 className="lanScrollHeading">App solution 1</h3>
                <p className="lanScrolltext text-center text-md-start">
                  Solar glare calculations for tilted PV areas involve taking
                  into account the inclination angle of the solar panels.
                </p>
              </div>
            </Col>
            <Col md={6}>
            <div className="d-flex flex-column align-items-center align-items-md-start">
                <Image className="lanFluentBox" src={FluentBoxImage} />
                <h3 className="lanScrollHeading">App solution 1</h3>
                <p className="lanScrolltext text-center text-md-start">
                  Solar glare calculations for tilted PV areas involve taking
                  into account the inclination angle of the solar panels.
                </p>
              </div>
            </Col>
            <Col md={6}>
            <div className="d-flex flex-column align-items-center align-items-md-start">
                <Image className="lanFluentBox" src={FluentBoxImage} />
                <h3 className="lanScrollHeading">App solution 1</h3>
                <p className="lanScrolltext text-center text-md-start">
                  Solar glare calculations for tilted PV areas involve taking
                  into account the inclination angle of the solar panels.
                </p>
              </div>
            </Col>
          </Row>
          </Col>
        </Row>
       </Container>
        <div className="d- d-md-none">
        <SollutionSlider/>
        </div>
    </React.Fragment>
  );
};
export default CallAction;
