import React, { useEffect, useRef, useState } from "react";
import SettingIcon from "../../images/solar_settings-linear.png";
import {
  Button,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Form,
  Modal,
} from "react-bootstrap";
import Checkedicon from "../../images/icons8_checked.png";
import CrossIcon from "../../images/iconoir_xbox-x.png";
import Dropdown from "react-bootstrap/Dropdown";
import { Image } from "react-bootstrap";
import DuplicateIcon from "../../images/ion_duplicate-outline.png";
import TrashIcon from "../../images/mi_delete.png";
import ArchieveIcon from "../../images/mynaui_archive.png";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, storage } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { RxCaretDown } from "react-icons/rx";
import { FiUpload } from "react-icons/fi";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { toast } from "react-toastify";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
interface ActiveCardProps {
  data?: any;
  onStatusChange?: any;
}
const ActiveCard: React.FC<ActiveCardProps> = ({ data, onStatusChange }) => {
  const navigate = useNavigate();
  const [reportList, setReportList] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState(false);
  const [newName, setNewName] = useState<string>(" ");

  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true);
    setNewName(data.projectName);
  };

  const handleClick = (id: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      fileInputRef.current.setAttribute("data-id", id); // Store the ID in a data attribute
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    const id = event.target.getAttribute("data-id"); // Retrieve the ID from the data attribute
    toast.warn("Updating project image");
    if (file && id) {
      try {
        const storageRef = ref(storage, `projectsImage/${id}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Store the download URL in Firestore
        const userDocRef = doc(db, "projects", id);
        await updateDoc(userDocRef, { projectPhoto: downloadURL });
        onStatusChange();
        toast.success("Image uploaded successfully");
      } catch (error) {
        toast.error("'Error uploading image:");
        console.error("Error uploading image:", error);
      }
    }
  };

  // Move project to the archieve
  const moveToArchieve = async () => {
    const projectRef = doc(db, "projects", data.id);

    await updateDoc(projectRef, {
      status: "archieve",
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
        projectName: data.projectName + " (Copy)",
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

  const updateName = async () => {
    if (newName.trim().length === 0) {
      toast.warn("Name cannot be empty.")
      return null
    }
    try {
      const docRef = doc(db, 'projects', data.id);
      await updateDoc(docRef, {
        projectName: newName.trim()
      });
      toast.success("Name updated successfully")
      onStatusChange();
      handleClose()
    } catch (error) {
      console.error('Error updating name: ', error);
      toast.error("Error updating name:")
      handleClose()
    }
  };
  


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
                  <span className="mx-2">Duplicate</span>
                </Dropdown.Item>
                <div>
                  <Dropdown.Item
                    onClick={handleShow}
                    className="d-flex align-items-center activeDropDownItem"
                  >
                    <MdOutlineDriveFileRenameOutline
                      size={20}
                      color="#6B7783"
                    />
                    <span className="mx-2">Change Name</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="d-flex align-items-center activeDropDownItem"
                    onClick={() => {
                      handleClick(data.id);
                    }}
                  >
                    <FiUpload size={20} color="#6B7783" />
                    <span className="mx-2">Change Image</span>
                  </Dropdown.Item>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <Dropdown.Item
                  onClick={moveToArchieve}
                  className="d-flex align-items-center activeDropDownItem"
                >
                  <Image width={20} src={ArchieveIcon} />
                  <span className="mx-2">Move to Archieve</span>
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
              <DropdownToggle variant="none" className="m-0 p-0 border-0">
                <Button className="mt-2 activeCalculated d-flex justify-content-center align-items-center">
                  {reportList.length > 0 ? (
                    <div className="d-flex justify-content-center align-items-center gap-2">
                      <img
                        src={Checkedicon}
                        width={20}
                        height={20}
                        style={{ objectFit: "contain" }}
                      />
                      <span> Results </span>
                      <RxCaretDown
                        style={{ marginTop: "1px" }}
                        size={25}
                        color="#000"
                      />
                    </div>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center gap-2">
                      <img
                        src={CrossIcon}
                        width={20}
                        height={20}
                        style={{ objectFit: "contain" }}
                      />
                      <span>No Results </span>
                    </div>
                  )}
                </Button>
              </DropdownToggle>
              {reportList.length > 0 && (
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
                        key={value.id}
                        className="py-3 px-2 mx-0 mb-3 reportListDropdownList"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <p className="m-0 p-0"> Id : {value.id} </p>
                          <p style={{ color: "#0984e3" }} className="m-0 p-0">
                            {" "}
                            {value.paymentStatus ? "Paid" : "Free"}{" "}
                          </p>
                        </div>
                        <hr style={{ border: "1px solid #000" }} />
                        <p> Created at {value.date}</p>
                        <p>
                          {" "}
                          {value.verticalPVArea + value.tiltedPVArea} PV areas
                        </p>
                        <p> {value.detectionPoints} detection points</p>
                      </DropdownItem>
                    );
                  })}
                </DropdownMenu>
              )}
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
      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={true}>
        <Modal.Body>
          <Form.Group className="mb-4">
            <Form.Label style={{ fontSize: "18px" }}>
              Update Name Here :
            </Form.Label>
            <Form.Control
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value.trimStart());
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={updateName}>update</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

export default ActiveCard;
