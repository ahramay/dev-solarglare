import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import CheckImage from "../../images/fluent_checkmark-16-filled.png";
import Button from "react-bootstrap/Button";
import PriceImage from "../../images/15€.png"

const LandingPricing = () => {
  return (
    <React.Fragment>
      <Container className="mt-5 mb-4 pt-3">
        <h1 className="orientMainHead">Pricing</h1>
        <Row className="mt-5 py-3 justify-content-between align-items-center">
          <Col md={6} lg={5} xl={4} >
            <div>
              <small className="pv-solarglare">pv-solarglare</small>
              <h5 className="py-3 pricingHeding">Full report features</h5>
              <p className="pricingText">
                Solar glare calculations for tilted PV areas involve taking into
                account the inclination angle of the solar panels.
              </p>
              <p className="pricingText py-3">By purchasing the detailed report of glare you get:</p>
              <div className="d-flex">
                <Image
                  alt="checked-img"
                  className="me-2 pricingChecked align-self-center"
                  src={CheckImage}
                />
                Precise information
              </div>
              <div className="d-flex">
                <Image
                  alt="checked-img"
                  className="me-2 pricingChecked align-self-center"
                  src={CheckImage}
                />
                Glare information
              </div>
              <div className="d-flex">
                <Image
                  alt="checked-img"
                  className="me-2 pricingChecked align-self-center"
                  src={CheckImage}
                />
                Example information about glare
              </div>
              <div className="d-flex">
                <Image
                  alt="checked-img"
                  className="me-2 pricingChecked align-self-center"
                  src={CheckImage}
                />
                Example information
              </div>
            </div>
          </Col>
          <Col className="gy-5" md={6} lg={5} xl={4}>
           <div className="text-center p-4" style={{width: "100%",height: "535px",borderRadius: "16px",background:"#F5F5F5",}}>
           <h5 className="pt-4 text-center pricingHeding ">Per project text</h5>
           <Image className="pricing15E" alt="price-img" src={PriceImage}/>
           <p className="pricingText">Solar glare calculations for tilted PV areas involve taking into account the angle of the</p>
           <p className="pricingText py-4   ">Solar glare calculations for tilted PV areas involve taking into account the inclination angle of the solar panels.</p>
           <Button className="pricingTryNow" variant="none" >
            Try Now
            </Button>
           </div>
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  );
};

export default LandingPricing;
