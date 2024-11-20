import React, { useState } from "react";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import { Image } from "react-bootstrap";
import { Button } from "react-bootstrap";
import leftArrow from "../../images/ion_arrow-back.png";
import { Link } from "react-router-dom";
import { Container } from "react-bootstrap";
import Loader from "../../components/shared/loader";
import { auth, db } from "../../firebase";
import { collection, addDoc, updateDoc } from "firebase/firestore";
import { storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import Image_1 from "../../images/image 3.png";
import { setMapCenter } from "../../store/reducers/bmapSlice";
import { useDispatch } from "react-redux";
const NewProject: React.FC = () => {
  // const allTimezones = moment.tz.names();
  const timeZones = [
    "UTC-12 (BIT, IDLW)",
    "UTC-11 (NUT, SST)",
    "UTC-10 (CKT, HST, TAHT)",
    "UTC-9 (AKST, GIT)",
    "UTC-8 (CIST, PST)",
    "UTC-7 (MST)",
    "UTC-6 (CST, GALT)",
    "UTC-5 (EST, ACT, COT, EASST, ECT, PET)",
    "UTC-4 (AMT, AST, BOT, CLT, COST, ECT, FKT, GYT, PYT, VET)",
    "UTC-3 (AMST, ART, BRT, CLST, FKST, GFT, PMST, UYT)",
    "UTC-2 (BRST, GST, UYST)",
    "UTC-1 (AZOT, CVT, EGT)",
    "UTC+0 (GMT, WET)",
    "UTC+1 (CET, WAT)",
    "UTC+2 (CAT, EET, SAST)",
    "UTC+3 (AST, EAT, IOT, MSK, TRT)",
    "UTC+4 (AMT, AZT, GET, GST, SAMT, SCT)",
    "UTC+5 (AQTT, HMT, MVT, PKT, TJT, TMT, UZT)",
    "UTC+6 (BIOT, BST, BTT, KGT, OMST)",
    "UTC+7 (CXT, DAVT, ICT, THA, WIT)",
    "UTC+8 (AWST, CIT, CT, HKT, MYT, PHT, SGT)",
    "UTC+9 (EIT, JST, KST)",
    "UTC+10 (AEST, PGT, VLAT)",
    "UTC+11 (NCT, NFT, PONT, SBT)",
    "UTC+12 (FJT, GILT, MHT, NZST, WAKT)",
    "UTC+13 (PHOT, TOT)",
    "UTC+14 (LINT)",
  ];

  // const timezonesWithOffset = allTimezones.map((timezone) => {
  //   const offsetInMinutes = moment.tz(timezone).utcOffset();
  //   const offsetInHours = offsetInMinutes / 60; // Convert minutes to hours
  //   const roundedOffset = Math.round(offsetInHours); // Round to nearest hour

  //   const formattedOffset =
  //     (roundedOffset >= 0 ? "+" : "-") + Math.abs(roundedOffset).toFixed(2);

  //   let shortForm = "";
  //   const tzZone = moment.tz.zone(timezone);
  //   if (tzZone) {
  //     shortForm = tzZone.abbr(moment().valueOf());
  //   }

  //   return {
  //     timezone,
  //     utcOffset: formattedOffset,
  //     shortForm: shortForm,
  //   };
  // });

  const [projectPhoto, setProjectphoto] = useState<File | null>(null);
  const [loader, setLoader] = useState(false);
  const dispatch = useDispatch()
  const navigate = useNavigate();
  const [errors, setErrors] = useState({
    projectName: "",
    timeZone: "",
  });
  const [formData, setFormData] = useState({
    projectName: "",
    timeZone: "",
  });
  const checkValidation = (form: any) => {
    let formValid = true;
    const newErrors = {
      projectName: "",
      timeZone: "",
    };

    if (formData.projectName.trim().length === 0) {
      formValid = false;
      newErrors.projectName = "Project name is required";
    }

    if (formData.timeZone.trim().length === 0) {
      formValid = false;
      newErrors.timeZone = "Time zone is not selected";
    }

    setErrors(newErrors);
    return { formValid };
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: "",
    });
  };
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const date = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formattedDateString = `${date.getDate()}. ${
      months[date.getMonth()]
    } ${date.getFullYear()} ${
      date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
    }:${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}`;
    e.preventDefault();
    if (checkValidation(e.target).formValid) {
      setLoader(true);
      dispatch(setMapCenter({ lat: 48.08728745409168, lng: 11.566058110369891 }))
      try {
        let projectId: string | undefined;
        let projectPhotoURL: string | null = null;

        const docRef = await addDoc(collection(db, "projects"), {
          projectName: formData.projectName,
          timeZone: formData.timeZone,
          userId: auth.currentUser?.uid,
          status: "active",
          calculated: false,
          totalCalcualetdReports: 0,
          date: formattedDateString,
        });

        projectId = docRef.id;

        if (projectPhoto) {
          const storageRef = ref(storage, `projectsImage/${projectId}`);
          await uploadBytes(storageRef, projectPhoto);
          projectPhotoURL = await getDownloadURL(storageRef);
        } else {
          // Set default image URL
          projectPhotoURL = Image_1;
        }

        // Now that we have the download URL (either user-selected or default), update the document with it
        await updateDoc(docRef, {
          projectPhoto: projectPhotoURL,
        });

        setLoader(false);

        if (projectId) {
          navigate(`/map_page`, { state: projectId });
        } else {
          console.error("Unable to retrieve project ID");
        }
      } catch (e) {
        setLoader(false);
        console.error("Error uploading file:", e);
      }
    }
  };

  return (
    <React.Fragment>
      <Navbar />
      <div className="my-4 d-flex align-items-center ">
        <Link
          style={{ width: "fit-content", position: "absolute" }}
          className="text-decoration-none"
          to="/dashboard"
        >
          <div className="mx-3  d-flex align-items-center">
            <Image className="mb-3" src={leftArrow} alt="back_arrow" />
            <p className="d-none d-sm-inline  mx-2 backToDashboard">
              Dashboard
            </p>
          </div>
        </Link>
        <h1 className="newProjects  mx-auto ">New Projects</h1>
      </div>
      <Container className="d-flex newProject flex-column align-items-center justify-content-center">
        <div className="my-2">
          <label className="newProjectLabel">Project Name</label> <br />
          <input
            style={{ paddingLeft: "12px" }}
            name="projectName"
            onChange={handleInputChange}
            className="newProjectInput mt-2"
            type="text"
          />
          <small className="text-danger d-block error">
            {errors.projectName}
          </small>
        </div>
        <div className="my-2">
          <label className="newProjectLabel">
            {" "}
            Timezone offset from UTC &nbsp;
          </label>
          <Link
            className="text-decoration-none wikipediaLink"
            target="_blank"
            to="https://en.wikipedia.org/wiki/List_of_UTC_offsets"
          >
            (list of offsets from Wikipedia)
          </Link>
          <br />
          <select
            style={{ fontFamily: "lato" }}
            name="timeZone"
            className="ps-2 newProjectInput mt-2"
            value={formData.timeZone}
            onChange={handleInputChange}
          >
            <option value="">Select a time zone</option>
            {timeZones.map((zone) => (
              <option style={{ fontFamily: "lato" }} key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <small className="text-danger d-block error">{errors.timeZone}</small>
        </div>

        <div className="my-2">
          <label className="newProjectLabel">Select New Project</label>
          <br />

          <div className="upload-container align-items-center d-flex justify-content-center">
            <input
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                if (e.target.files && e.target.files[0]) {
                  const selectedFile = e.target.files[0];
                  setProjectphoto(selectedFile);
                  handleInputChange(e);
                }
              }}
              name="projectPhoto"
              type="file"
              className="file-input"
              id="fileInput"
            />

            {projectPhoto ? (
              <img
                width={200}
                src={URL.createObjectURL(projectPhoto)}
                alt="Selected Profile Pic"
              />
            ) : (
              <label htmlFor="fileInput" className="upload-text">
                <span className="upload-icon"></span>
                Click here to upload project photo (optional)
              </label>
            )}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          variant="none"
          className="my-4 newProjectButton"
        >
          {loader ? (
            <span className="d-flex justify-content-center">
              <Loader />
            </span>
          ) : (
            " Start"
          )}
        </Button>
      </Container>
      <Footer />
    </React.Fragment>
  );
};

export default NewProject;
