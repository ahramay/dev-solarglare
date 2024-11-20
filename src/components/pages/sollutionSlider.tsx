import React from "react";
import Slider from "react-slick";
import FluentBoxImage from "../../images/fluent_box-24-regular.png";
import LeftArrow from "../../images/uiw_right.png";
import RightArrow from "../../images/uiw_right (1).png";
import Container from "react-bootstrap/Container";
import Image from "react-bootstrap/Image";
const SollutionSlider: React.FC = () => {
  const customeSlider = React.createRef<Slider>();
  const Next = () => {
    customeSlider.current?.slickNext();
  };

  const Previous = () => {
    customeSlider.current?.slickPrev();
  };
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 2,
    arrows: false,
    responsive:[
        {
            breakpoint: 992,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
               }    
               },
               {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1,
                   }    
                   },
                ]
            };
            return (
                <React.Fragment>
      <Container>
        <div className="container w-100 d-flex justify-content-center align-items-center">
          <div style={{cursor:"pointer"}} className="mx-2">
            
            <Image
              className="cliArrow"
              onClick={Previous}
              src={LeftArrow}
              alt="leftArrow"
            />
          </div>
          <div style={{ width: "90%" }}>
            <Slider ref={customeSlider} {...settings}>
              <div className="d-flex flex-column align-items-center align-items-md-start">
                <Image className="lanFluentBox" src={FluentBoxImage} />
                <h3 className="lanScrollHeading">App solution 1</h3>
                <p className="lanScrolltext w-75 text-center text-md-start">
                  Solar glare calculations for tilted PV areas involve taking
                  into account the inclination angle of the solar panels.
                </p>
              </div>
              <div className="d-flex flex-column align-items-center align-items-md-start">
                <Image className="lanFluentBox" src={FluentBoxImage} />
                <h3 className="lanScrollHeading">App solution 1</h3>
                <p className="lanScrolltext w-75 text-center text-md-start">
                  Solar glare calculations for tilted PV areas involve taking
                  into account the inclination angle of the solar panels.
                </p>
              </div>
              <div className="d-flex flex-column align-items-center align-items-md-start">
                <Image className="lanFluentBox" src={FluentBoxImage} />
                <h3 className="lanScrollHeading">App solution 1</h3>
                <p className="lanScrolltext w-75 text-center text-md-start">
                  Solar glare calculations for tilted PV areas involve taking
                  into account the inclination angle of the solar panels.
                </p>
              </div>
              <div className="d-flex flex-column align-items-center align-items-md-start">
                <Image className="lanFluentBox" src={FluentBoxImage} />
                <h3 className="lanScrollHeading">App solution 1</h3>
                <p className="lanScrolltext w-75 text-center text-md-start">
                  Solar glare calculations for tilted PV areas involve taking
                  into account the inclination angle of the solar panels.
                </p>
              </div>
            </Slider>
          </div>
          <div style={{cursor:"pointer"}} className="mx-2">
            <Image
              className="cliArrow"
              onClick={Next}
              src={RightArrow}
              alt="rightArrow"
            />
          </div>
        </div>
      </Container>
    </React.Fragment>
  );
};
export default SollutionSlider;
