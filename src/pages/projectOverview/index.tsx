import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Image, ProgressBar } from "react-bootstrap";
import LeftArrow from "../../images/ion_arrow-back.png";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import Container from "react-bootstrap/Container";
import { ThreeDots } from "react-loader-spinner";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
interface ProjectData {
  uploadState: number;
  fileUrl?: {
    paidReportUrl: string;
    reportUrl: string;
  };
}
const ProjectOverview: React.FC = () => {
  const [data, setData] = useState<ProjectData>();
  const location = useLocation();
  const navigate = useNavigate();
  const id = location?.state;
  useEffect(() => {
    const docRef = doc(db, "paidReport", id);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const fetchedData = docSnap.data() as ProjectData;
        console.log(fetchedData);

        setData(fetchedData);
      } else {
        console.log("No such document!");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    if (data?.uploadState == 1) {
      navigate("/unpaidproject", { state: { projectId: id } });
    } else if (data?.uploadState == -1) {
      toast.error("Failed to Retrieve PDF");
      navigate(-1);
    }
  }, [data]);
  return (
    <React.Fragment>
      <Navbar />
      <div className="my-4 d-flex align-items-end ">
        <Link
          style={{ width: "fit-content", position: "absolute" }}
          className="text-decoration-none"
          to="/activeproject"
        >
          <div className="mx-3 d-flex align-items-center">
            <Image className="mb-3" src={LeftArrow} alt="back_arrow" />
            <p className="d-none d-sm-inline  mx-2 backToDashboard">
              Back to project
            </p>
          </div>
        </Link>
        <h1 className="newProjects mx-auto">Project Overview</h1>
      </div>

      <Container>
        <div className="position-relative">
          <ProgressBar
            className="StatusBar my-3"
            now={Number(data?.uploadState) * 100}
            style={{ height: "30px", borderRadius: "8px" }}
          />
          <div
            className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ top: 0, left: 0 }}
          >
            {/* {data?.uploadState && ( */}
            <span className="calculatingPercentage mx-2">
              Calculating{" "}
              {isNaN(Number(data?.uploadState))
                ? 0
                : (Number(data?.uploadState) * 100).toFixed(0)}{" "}
              %
            </span>
            {/* )} */}

            <ThreeDots
              visible={true}
              height="40"
              width="40"
              color="#000"
              radius="9"
              wrapperStyle={{}}
              wrapperClass=""
            />
          </div>
        </div>
      </Container>
      <Footer />
    </React.Fragment>
  );
};

export default ProjectOverview;
