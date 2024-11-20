import React,{useState,useEffect} from "react";
import SettingIcon from "../../images/solar_settings-linear.png";
import { Button, DropdownItem, DropdownMenu, Dropdown, DropdownToggle } from "react-bootstrap";
import Checkedicon from "../../images/icons8_checked.png";
import CrossIcon from "../../images/iconoir_xbox-x.png";
import { Image } from "react-bootstrap";
import DuplicateIcon from "../../images/ion_duplicate-outline.png";
import TrashIcon from "../../images/mi_delete.png";
import ActiveIcon from "../../images/mdi_folder-move-outline.png";
import ShareIcon from "../../images/solar_share-linear.png";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { RxCaretDown } from "react-icons/rx";
import { auth } from "../../firebase";
interface ArchieveCardProps {
  data?: any;
  onStatusChange?: any;
}
const ArchieveCard: React.FC<ArchieveCardProps> = ({
  data,
  onStatusChange,
}) => {
  const navigate = useNavigate();
  const [reportList, setReportList] = useState<any[]>([]);


  // Move project to the active
  const moveToActive = async () => {
    const projectRef = doc(db, "projects", data.id);

    await updateDoc(projectRef, {
      status: "active",
    });
    onStatusChange();
  };
  // Move project to the trash
  const moveToTrash = async () => {
    const projectRef = doc(db, "projects", data.id);

    await updateDoc(projectRef, {
      status: "trash",
    });
    onStatusChange();
  };

  // Duplicate project
  const duplicateProject = async () => {
    try {
      await addDoc(collection(db, "projects"), {
        ...data,
        dublicated: true,
        projectName: data.projectName + "(Copy)",
      });
      onStatusChange();
    } catch (error) {
      console.error("Error duplicating project:", error);
    }
  };


  useEffect(() => {
    const getReportList = async () => {
      if (auth.currentUser && data.id) {
        const q = query(
          collection(db, "paidReport"),
          where("userId", "==", auth.currentUser?.uid),
          where("projectId", "==", data.id)
        );
        const querySnapshot = await getDocs(q);
        const newData = querySnapshot.docs.map((doc) => {
          return { ...doc.data(), id: doc.id };
        });
        setReportList(newData);
      }
    };

    getReportList();
  }, [data.id]);


  return (
    <React.Fragment>
      {data.id && (
        <div className="bg-light activeCard p-2">
          <div className="d-flex justify-content-between align-items-center">
            <p className="projectName">{data.projectName}</p>
            <Dropdown>
              <Dropdown.Toggle
                className="activeDropdown p-0 mb-2"
                variant="none"
              >
                <Image
                  className="mb-1"
                  src={SettingIcon}
                  alt="setting_option"
                />
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={duplicateProject}
                  className="d-flex align-items-center activeDropDownItem"
                >
                  <Image width={20} src={DuplicateIcon} />
                  <span className="mx-2">Dublicate</span>
                </Dropdown.Item>
                {/* <Dropdown.Item className="d-flex align-items-center activeDropDownItem">
                  <Image width={20} src={ShareIcon} />
                  <span className="mx-2">Share</span>
                </Dropdown.Item> */}
                <Dropdown.Item
                  onClick={moveToActive}
                  className="d-flex align-items-center activeDropDownItem"
                >
                  <Image width={20} src={ActiveIcon} />
                  <span className="mx-2">Move to active projects</span>
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={moveToTrash}
                  className="d-flex align-items-center activeDropDownItem"
                >
                  <Image width={20} src={TrashIcon} />
                  <span className="mx-2">Move to Trash</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <Image
            src={data.projectPhoto}
            style={{ width: "100%", height: "156px", objectFit: "contain" }}
            alt="projectImg"
          />
          <div className="d-block d-md-flex justify-content-between align-items-center mt-2">
          <Dropdown>
              <DropdownToggle variant="none" className="m-0 p-0 border-0" >
                <Button className="mt-2 activeCalculated d-flex justify-content-center align-items-center">
                  {reportList.length > 0 ? (
                    <div className="d-flex justify-content-center align-items-center gap-2">
                    <img src={Checkedicon} width={20} height={20} style={{objectFit:"contain"}}/>
                    <span> Results </span>
                    <RxCaretDown style={{marginTop:"1px"}} size={25} color="#000" />
                    </div>
                  ) : 
                  <div className="d-flex justify-content-center align-items-center gap-2">
                  <img src={CrossIcon} width={20} height={20} style={{objectFit:"contain"}}/>
                  <span>No Results </span>
                  </div>}
                </Button>
              </DropdownToggle>
                {reportList.length > 0 &&
              <DropdownMenu className="reportListDropdownMenu p-3 mt-1">
                {reportList.map((value) => {
                    return (
                      <DropdownItem
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
                        key={value.id} className="py-3 px-2 mx-0 mb-3 reportListDropdownList">
                        <div className="d-flex justify-content-between align-items-center">
                        <p className="m-0 p-0"> Id : {value.id} </p>
                        <p style={{color:"#0984e3"}} className="m-0 p-0"> {value.paymentStatus ? "Paid" : "Free"} </p>
                        </div>
                        <hr style={{border:"1px solid #000"}} />
                         <p> Created at {value.date}</p> 
                         <p> {value.verticalPVArea  + value.tiltedPVArea} PV areas</p> 
                         <p> {value.detectionPoints} detection points</p> 
                      </DropdownItem>
                    );
                  })
                }
              </DropdownMenu>
                  }
            </Dropdown>
            <Button
              className="mt-2 activeOPenProjects px-2 py-0"
              onClick={() => {
                navigate(`/map_page`, { state: data.id });
              }}
            >
              Open Map
            </Button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default ArchieveCard;
