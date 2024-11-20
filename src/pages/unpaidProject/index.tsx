import React, { useEffect, useState } from "react";
import { Image, Button } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import LeftArrow from "../../images/ion_arrow-back.png";
import { Link } from "react-router-dom";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import FullReport from "../../components/pages/poFullReport";
import { useLocation } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { GoArrowLeft } from "react-icons/go";

interface ReportCardProps {
  date: string;
  fileUrl: {
    paidReportUrl: string;
    reportUrl: string;
  };
  owner: string;
  paymentStatus: string;
  projectName: string;
  tiltedPVArea: number;
  verticalPVArea: number;
  detectionPoints: string;
  id: string;
  projectId: string;
  imageUrl: string;
}

const UnpaidProject: React.FC = () => {
  const [responceData, setresponceData] = useState<ReportCardProps | null>(
    null
  );
  const location = useLocation();
  const docId = location.state.projectId;
  useEffect(() => {
    const docRef = doc(db, "paidReport", docId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setresponceData(docSnap.data() as ReportCardProps);
          console.log(docSnap.data());
        } else {
          console.log("No such document!");
        }
      },
      (error) => {
        console.error("Error getting document:", error);
      }
    );

    return () => unsubscribe();
  }, [docId]);
  return (
    <React.Fragment>
      <Navbar />

      <div className="centerpart mt-3">
        <Link className="dashboard" to="/dashboard">
          <GoArrowLeft />
          Dashboard
        </Link>
        <p className="m-0">Active project / {responceData?.projectName}</p>
      </div>
      <div className="my-3 d-flex align-items-end">
        <Link
          style={{ width: "fit-content", position: "absolute" }}
          className="text-decoration-none"
          to="/map_page"
          state={responceData?.projectId}
        >
          <div className="mx-3 d-flex align-items-center">
            <Image className="mb-3" src={LeftArrow} alt="back_arrow" />
            <p className="d-none d-sm-inline  mx-2 backToDashboard">
              Back to map
            </p>
          </div>
        </Link>
        <h1 className="newProjects mx-auto">Project Overview</h1>
      </div>
      <Container fluid className="mt-4 mb-5 py-3">
        <Row className="justify-content-center gap-3">
          <Col md={12} lg={5} style={{ width: "500px" }}>
            <div className="d-flex justify-content-between align-items-center PO-MYHOME">
              <p className="mt-3 mb-0 unpaidtextOverFlow">
                {responceData?.projectName}
              </p>
              <p className="mt-3 mb-0">ID : {docId}</p>
            </div>
            <hr />
            <div>
              <div className="d-flex justify-content-between">
                <p className="PO-date">Date:</p>
                <p className="POdata">{responceData?.date}</p>
              </div>
              <div className="d-flex justify-content-between">
                <p className="PO-date">PV areas:</p>
                <p className="POdata">
                  {responceData?.verticalPVArea} vertical,{" "}
                  {responceData?.tiltedPVArea} titled
                </p>
              </div>
              <div className="d-flex justify-content-between">
                <p className="PO-date">Detection points:</p>
                <p className="POdata">
                  {responceData?.detectionPoints} Detection points
                </p>
              </div>
            </div>
            <a className="paid-downloadPDF" href={responceData?.fileUrl.reportUrl} download="docId">
                Download Pdf
            </a>
            <div className="d-flex justify-content-center">
              {/* {data?.fileUrl && ( */}
              <iframe
                src={responceData?.fileUrl?.reportUrl}
                style={{
                  width: `700px`,
                  height: "800px",
                }}
              />
              {/* )} */}
            </div>
          </Col>
          <Col md={12} lg={3}>
            <FullReport />
          </Col>
        </Row>
      </Container>

      <Footer />
    </React.Fragment>
  );
};

export default UnpaidProject;
