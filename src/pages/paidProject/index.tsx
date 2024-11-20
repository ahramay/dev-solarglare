import React, { useEffect, useState } from "react";
import { Image } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import LeftArrow from "../../images/ion_arrow-back.png";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import { Button } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface ReportCardProps {
  date: string;
  fileUrl: {
    glareFound: boolean;
    // reportUrl: string;
    paidReportUrl: string;
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

const PaidProject: React.FC = () => {
  const [data, setData] = useState<ReportCardProps[]>([]);
  const location = useLocation();
  const docId = location.state;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "paidReport", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData([{ ...docSnap.data(), id: docSnap.id } as ReportCardProps]);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error getting document:", error);
      }
    };

    fetchData();
  }, [docId]);
  console.log(data);
  return (
    <React.Fragment>
      <Navbar />
      {data && (
        <div>
          <div className="mt-4 d-flex align-items-end">
            <Link
              style={{ width: "fit-content" }}
              className="text-decoration-none"
              to="/myreports"
            >
              <div className="mx-3 d-flex align-items-center">
                <Image className="mb-3" src={LeftArrow} alt="back_arrow" />
                <p className="d-none d-sm-inline  mx-2 backToDashboard">
                  Back to reports
                </p>
              </div>
            </Link>
          </div>

          <Container fluid className="mt-4 mb-5 pt-3">
            <Row className="justify-content-center gap-3">
              <Col className="d-flex justify-content-center">
                <div style={{ width: "500px" }}>
                  <div className="d-sm-flex justify-content-between align-items-center PO-MYHOME">
                    <p className="mt-3 mb-0 unpaidtextOverFlow">
                      {data[0]?.projectName}
                    </p>
                    <p className="mt-3 mb-0">ID : {data[0]?.id}</p>
                  </div>
                  <hr />
                  <div>
                    <div className="d-flex justify-content-between">
                      <p className="PO-date">Date:</p>
                      <p className="POdata">{`${data[0]?.date}`}</p>
                    </div>
                    <div className="d-flex justify-content-between">
                      <p className="PO-date">PV areas:</p>
                      <p className="POdata">
                        <span className="m-0 p-0">{`${data[0]?.verticalPVArea} vertical , ${data[0]?.tiltedPVArea} tilted`}</span>
                      </p>
                    </div>
                    <div className="d-flex justify-content-between">
                      <p className="PO-date">Detection points:</p>
                      <p className="POdata">
                        {data[0]?.detectionPoints} Dectection Points
                      </p>
                    </div>
                    <a href={data[0]?.fileUrl?.paidReportUrl} download="docId" className="text-decoration-none">
                      <Button className="paid-downloadPDF" variant="none">
                        Download Pdf
                      </Button>
                    </a>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
          <div
            className="d-flex justify-content-center"
            style={{ marginBottom: "100px" }}
          >
            {/* {data[0]?.fileUrl?.glareFound ? ( */}
              <iframe
                src={data[0]?.fileUrl?.paidReportUrl}
                style={{
                  width: `700px`,
                  height: "800px",
                }}
              />
            {/* ) : (
              <div>
                <h1 className="glareNotFound mt-5">GLARE NOT FOUND</h1>
              </div>
            )} */}
          </div>
        </div>
      )}
      <Footer />
    </React.Fragment>
  );
};

export default PaidProject;
