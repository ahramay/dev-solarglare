import React from "react";
import Slider from "react-slick";
import ClientImage from "../../images/Rectangle 2082.png"
import LeftArrow from "../../images/tabler_chevron-left.png"
import RightArrow from "../../images/tabler_chevron-left (1).png"
import Image from "react-bootstrap/Image";


const ClientSlider:React.FC = ()=>{
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
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows:false,
        }
    return(
        <React.Fragment>
       <h1 className="container mt-5 mb-4 pt-3 ClientSlidehead">In our clients words</h1>
     <div className="container w-100 mt-5 d-flex justify-content-center align-items-center">
    <div className="clLeftArr mx-1">
        <Image className="cliArrow" onClick={Previous} src={LeftArrow} alt="leftArrow" />
    </div>
            <div style={{width:"90%"}}>
            <Slider ref={customeSlider} {...settings}>
            <div className="d-flex flex-column flex-md-row justify-content-center align-items-center">
                 <Image width={140} height={140} src={ClientImage} alt="profilePic" />
                 <div className="px-3 mt-md-0 mt-3">
                    <small className="client">sunrun,ceo</small>
                    <h5  className="py-2 clientName">Frank Muller</h5>
                    <p className="clientContent">PV Solar glare gives me complete glare calculation whenever I’m making a plan for solar farm.</p>
                 </div>
                 </div>
                 <div className="d-flex flex-column flex-md-row justify-content-center align-items-center">
                 <Image width={140} height={140} src={ClientImage} alt="profilePic" />
                 <div className="px-3 mt-md-0 mt-3">
                    <small className="client">sunrun,ceo</small>
                    <h5  className="py-2 clientName">Frank Muller</h5>
                    <p className="clientContent">PV Solar glare gives me complete glare calculation whenever I’m making a plan for solar farm.</p>
                 </div>
                 </div>
                 <div className="d-flex flex-column flex-md-row justify-content-center align-items-center">
                 <Image width={140} height={140} src={ClientImage} alt="profilePic" />
                 <div className="px-3 mt-md-0 mt-3">
                    <small className="client">sunrun,ceo</small>
                    <h5  className="py-2 clientName">Frank Muller</h5>
                    <p className="clientContent">PV Solar glare gives me complete glare calculation whenever I’m making a plan for solar farm.</p>
                 </div>
                 </div>
            
             
            </Slider>
            </div>
<div className="clRightArr mx-1">
<Image  className="cliArrow" onClick={Next} src={RightArrow} alt="rightArrow" />

</div>
</div>

        </React.Fragment>
    )
}

export default ClientSlider;