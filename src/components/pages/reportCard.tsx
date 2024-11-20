import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { RiCloseFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { MdDeleteOutline } from "react-icons/md";

interface ReportCardProps {
  data: {
    date: string;
    id: string;
    projectName: string;
    totalCalcualetdReports: number;
    userId: string;
  };
  onStatusChange?: any;
}

const ReportCard: React.FC<ReportCardProps> = ({ data,onStatusChange }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState([{}]);

  const handleOpenReport = async (id: string) => {
    setOpen(true);
    const q = query(
      collection(db, "paidReport"),
      where("userId", "==", data.userId),
      where("projectId", "==", id)
    );
    const querySnapshot = await getDocs(q);
    const newData = querySnapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    });
    setModalData(newData);
  };

  const deleteReportData = async() => {
      if (data.userId) {
        const q = query(
          collection(db, "paidReport"),
          where("userId", "==", data.userId),
          where("projectId", "==", data.id)
        );

        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map((document) =>
          deleteDoc(doc(db, "paidReport", document.id))
      );

        // Await all delete operations to finish
        await Promise.all(deletePromises).then(async () => {
          const userDocRef = doc(db, "projects", data.id);
          await updateDoc(userDocRef, {
            calculated: false,
          });
          onStatusChange();
        });
      }
  };
  return (
    <React.Fragment>
      <div className="reportsCard px-3">
        <div className="d-flex m-0 justify-content-between align-items-center py-3">
          <p className="reportID ">
            <b>Project Name </b> : {data.projectName}
          </p>
          <MdDeleteOutline
            cursor={"pointer"}
            size={18}
            color="red"
            onClick={deleteReportData}
          />
        </div>
        <hr className="m-0" />
        <p className="mt-3 m-0 reportCardText">Project id : {data.id}</p>
        <p className="m-0 reportCardText">Date/Time : {data.date}</p>
        <p className="m-0 reportCardText">
          Calculated reports : {data.totalCalcualetdReports}
        </p>
        <div className="w-100 d-flex justify-content-center mt-3 align-items-center">
          <Button
            variant="none"
            className="reportsOpenProject m-0 p-0"
            onClick={() => handleOpenReport(data.id)}
          >
            Open Reports
          </Button>
        </div>
      </div>
      <Modal
        show={open}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        className="reportModal"
      >
        {modalData.length > 0 && (
          <div>
            <Modal.Header className="d-flex justify-content-between align-content-center border-0">
              <Modal.Title
                style={{ fontSize: "18px", fontWeight: "500" }}
                id="contained-modal-title-vcenter"
              >
                List of calculated reports
              </Modal.Title>
              <RiCloseFill
                style={{ cursor: "pointer" }}
                size={22}
                onClick={() => setOpen(false)}
              />
            </Modal.Header>
            <Modal.Body className="mt-0 pt-0" style={{ top: "0px" }}>
              {modalData.map((value: any) => {
                return (
                  <div key={value.id} className="reportsCard mb-3 px-3">
                    <div className="d-flex m-0 justify-content-between align-items-center pt-3">
                      <p className="reportID ">
                        <b>Project name</b> : {value.id}
                      </p>
                      <p className="reportID ">
                        <b>Status</b> : {value.paymentStatus ? "Paid" : "Free"}
                      </p>
                    </div>
                    <hr className="m-0" />
                    <p className="mt-3 m-0 reportCardText">{value.date}</p>
                    <p className="m-0 reportCardText">
                      {value.tiltedPVArea + value.verticalPVArea} PV areas
                    </p>
                    <p className="m-0 reportCardText">
                      {value.detectionPoints} detection points
                    </p>
                    <div className="d-flex justify-content-between align-items-center mt-3 gap-2">
                      <Button
                        variant="none"
                        className="reportsOpenProject p-0 m-0"
                        onClick={() => {
                          if (value.paymentStatus) {
                            navigate("/paidproject", {
                              state: value.id,
                            });
                          } else {
                            navigate("/unpaidproject", {
                              state: { projectId: value.id },
                            });
                          }
                        }}
                      >
                        Open Report
                      </Button>
                      <a
                        href={
                          value.paymentStatus
                            ? value?.fileUrl?.paidReportUrl
                            : value?.fileUrl?.reportUrl
                        }
                        download={true}
                      >
                        <Button
                          variant="none"
                          className="reportsDownloadProject p-0 m-0"
                        >
                          Download Report
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </Modal.Body>
          </div>
        )}
      </Modal>
    </React.Fragment>
  );
};
export default ReportCard;
