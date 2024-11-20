import React, { useEffect, useState } from "react";
import Checked from "../../images/fluent_checkmark-16-filled.png";
import { Button } from "react-bootstrap";
import { Image } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/transaction";
// import FullReport from "../../../public/ass/full_report.pdf"

const FullReport: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrollPosition, setScrollPosition] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrollPosition]);
  const getClientSecret = async () => {
    const fetchData = await api.fetchClientSecret({amount:1900});
    navigate("/payment", {
      state: {
        paymentIntents_ID: fetchData?.data?.paymentIntents_ID,
        clientSecret: fetchData?.data?.clientSecret,
        projectId: location?.state?.projectId,
      },
    });
  };

  return (
    <div
      className="FullReportCard p-4"
      style={{ position: "sticky", top: "15px" }}
    >
      <p className="fullReport">In full report</p>
      {/* <p className="PO-card-text">
        By purchasing the detailed report of glare you get:
      </p> */}
      <div className="d-flex PO-card-data my-2">
        <Image src={Checked} width={18} height={18} />
        <small className="mx-2">
          <b>Duration of Glare:</b> Identifying specfic times when glare could
          occur.
        </small>
      </div>
      <div className="d-flex PO-card-data my-2">
        <Image src={Checked} width={18} height={18} />
        <small className="mx-2">
          <b>Affected Areas:</b> User can select specific areas for analysis to
          determine where and how intensly glare occurs, enablig recise impact
          assessment
        </small>
      </div>
      <div className="d-flex PO-card-data my-2">
        <Image src={Checked} width={18} height={18} />
        <small className="mx-2">
          <b>Intensity of Glare Effects:</b> Offering insights into how intense
          the glare could be, aiding in understanding its potential impact{" "}
        </small>
      </div>
      <div className="d-flex PO-card-data my-2">
        <Image src={Checked} width={18} height={18} />
        <small className="mx-2">
          <b>Localization of Reflective Module Areas: </b> Pinpointing the exact
          areas of the solar array causing reflection, facilitating the
          development targeted mitigation strategies{" "}
        </small>
      </div>
      <div className="d-flex PO-card-data my-2">
        <Image src={Checked} width={18} height={18} />
        <small className="mx-2">
          <b>Representation:</b> of the exact times when glare effects occur{" "}
        </small>
      </div>
      <div className="d-flex PO-card-data my-2">
        <Image src={Checked} width={18} height={18} />
        <small className="mx-2"><b>Amount:</b> The amount you have to pay is 19€ .</small>
      </div>
      <div className="fullProfileButton d-flex flex-column align-items-center ">
        <Button
          onClick={getClientSecret}
          className="my-2 d-block PO-card-purchaseFullReport"
        >
          Purchase full report
        </Button>
        <Link to="/pdf">
          <Button variant="none" className="PO-card-seeExample">
            See example
          </Button>
        </Link>
      </div>
    </div>
  );
};
export default FullReport;
