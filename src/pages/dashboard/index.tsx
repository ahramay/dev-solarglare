import React, { useEffect } from "react";
import Footer from "../../components/shared/footer";
import Navbar from "../../components/shared/navbar";
import Container from "react-bootstrap/Container";
import { Image, OverlayTrigger, Tooltip } from "react-bootstrap";
import ProjectIcon from "../../images/carbon_new-tab.png";
import infoIcon from "../../images/octicon_info-24.png";
import { Button } from "react-bootstrap";
import activeProjects from "../../images/icon-park-outline_rotating-forward.png";
import DeleteIcon from "../../images/mi_delete.png";
import ArchiveIcon from "../../images/mynaui_archive.png";
import pdfIcon from "../../images/carbon_document-pdf.png";
import { Link, useSearchParams } from "react-router-dom";
import { auth } from "../../firebase";
import { applyActionCode } from "firebase/auth";
import { useLocation } from "react-router-dom";

const Dashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  useEffect(() => {
    const verifyEmail = async () => {
      if (oobCode) {
        try {
          await applyActionCode(auth, oobCode);
          // auth?.currentUser?.reload();
        } catch (error) {
          console.error("Error verifying email:", error);
        }
      }
    };

    verifyEmail();
  }, [oobCode]);

  const addProjectTooltip = (
    <Tooltip id="tooltip">
      <small>Start a new project here.</small>
    </Tooltip>
  );

  const ActiveProjectTooltip = (
    <Tooltip id="tooltip">
      <small>Check active project details here.</small>
    </Tooltip>
  );

  const ArchieveTooltip = (
    <Tooltip id="tooltip">
      <small>Explore archived projects here.</small>
    </Tooltip>
  );

  const trashTooltip = (
    <Tooltip id="tooltip">
      <small>Browse trashed projects here.</small>
    </Tooltip>
  );

  const ReportTooltip = (
    <Tooltip id="tooltip">
      <small>Explore calculated reports here.</small>
    </Tooltip>
  );

  return (
    <React.Fragment>
      <Navbar />
      <div className="dashboardDiv py-4">
        <h1 className="dashHeading  mt-3 mx-5">Dashboard</h1>
        <Container>
          <div className="d-flex text-center justify-content-center align-items-center flex-column flex-lg-row">
            <div className="px-2 mt-4 mx-4 bg-light  d-flex align-items-center dashCard justify-content-between">
              <div className="d-flex align-items-center ">
                <Image
                  className="mx-1"
                  src={ProjectIcon}
                  alt="newTab"
                  width={24}
                />
                <p className="mx-2 my-1 cardText">New Project</p>
              </div>
              <div className="mt-2">
                <Link to="/newproject" className="text-decoration-none">
                  <Button variant="none" className="d-inline mx-2 dashButton">
                    Add new project
                  </Button>
                </Link>
                <OverlayTrigger placement="top" overlay={addProjectTooltip}>
                  <Image
                    className="d-inline mx-2"
                    src={infoIcon}
                    alt="newTab"
                    width={24}
                    height={24}
                  />
                </OverlayTrigger>
              </div>
            </div>

            <div className="px-2 bg-light mt-4 mx-4 dashCard d-flex align-items-center justify-content-between">
              <div className="d-flex  align-items-center ">
                <Image
                  className="mx-1"
                  src={activeProjects}
                  alt="newTab"
                  width={24}
                />
                <p className="mx-2 my-1 cardText">Active Project</p>
              </div>
              <div className="mt-2">
                <Link to="/activeproject" className="text-decoration-none">
                  <Button variant="none" className="d-inline mx-2 dashButton">
                    Open Active Projects
                  </Button>
                </Link>
                <OverlayTrigger placement="top" overlay={ActiveProjectTooltip}>
                  <Image
                    className="d-inline mx-2"
                    src={infoIcon}
                    alt="newTab"
                    width={24}
                    height={24}
                  />
                </OverlayTrigger>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-center flex-column align-items-center flex-lg-row my-2">
            <div className="px-2 bg-light mt-4 mx-4 dashCard d-flex dashCard align-items-center justify-content-between">
              <div className="d-flex align-items-center ">
                <Image
                  className="mx-1"
                  src={ArchiveIcon}
                  alt="newTab"
                  width={24}
                />
                <p className="mx-2 my-1 cardText">Archieved</p>
              </div>
              <div className="mt-2">
                <Link to="/archievedProject" className="text-decoration-none">
                  <Button variant="none" className="d-inline mx-2 dashButton">
                    Open Archieve
                  </Button>
                </Link>
                <OverlayTrigger placement="top" overlay={ArchieveTooltip}>
                  <Image
                    className="d-inline mx-2"
                    src={infoIcon}
                    alt="newTab"
                    width={24}
                    height={24}
                  />
                </OverlayTrigger>
              </div>
            </div>
            <div className="px-2 bg-light  mt-4 mx-4 dashCard d-flex align-items-center justify-content-between">
              <div className="d-flex  align-items-center ">
                <Image
                  className="mx-1"
                  src={DeleteIcon}
                  alt="newTab"
                  width={24}
                />
                <p className="mx-2 my-1 cardText">Trash 30 days</p>
              </div>
              <div className="mt-2">
                <Link to="/trash" className="text-decoration-none">
                  <Button variant="none" className="d-inline mx-2 dashButton">
                    Open Trash
                  </Button>
                </Link>
                <OverlayTrigger placement="top" overlay={trashTooltip}>
                  <Image
                    className="mx-2 d-inline"
                    src={infoIcon}
                    alt="newTab"
                    width={24}
                    height={24}
                  />
                </OverlayTrigger>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-center align-items-center flex-column flex-lg-row mb-5 pb-5">
            <div className="px-2 bg-light mt-4 mx-4 d-flex align-items-center dashCard justify-content-between">
              <div className="d-flex align-items-center ">
                <Image className="mx-2" src={pdfIcon} alt="newTab" width={24} />
                <p className="mx-2 my-1 cardText">My Reports</p>
              </div>
              <div className="mt-2">
                <Link to="/myreports" className="text-decoration-none">
                  <Button variant="none" className="d-inline mx-2 dashButton">
                    Open Reports
                  </Button>
                </Link>
                <OverlayTrigger placement="top" overlay={ReportTooltip}>
                  <Image
                    className="d-inline mx-2"
                    src={infoIcon}
                    alt="newTab"
                    width={24}
                    height={24}
                  />
                </OverlayTrigger>
              </div>
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </React.Fragment>
  );
};
export default Dashboard;
