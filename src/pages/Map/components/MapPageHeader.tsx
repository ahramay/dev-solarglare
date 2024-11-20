import React, { useEffect, useState } from "react";
import { Image, Button, Dropdown, Modal, Alert, Form } from "react-bootstrap";
import Logo from "../../../images/newLogo.png";
import { Link } from "react-router-dom";
import { GoArrowLeft } from "react-icons/go";
import { BsGear } from "react-icons/bs";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { db } from "../../../firebase";
import { doc, getDoc, increment, updateDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  clearAllPolygonsAndDetectionPoints,
  setSimulationParameter,
} from "../../../store/reducers/bmapSlice";
import { IoClose } from "react-icons/io5";
import { toast } from "react-toastify";
import { MdSaveAlt } from "react-icons/md";
import { FirebaseError } from "firebase/app";
import { RootState } from "../../../store";
import { Loader_2 } from "../../../components/shared/loader";

const MapPageHeader: React.FC = () => {
  // datof project thata store in the FirebaseError

  const tiltedPolygons = useSelector(
    (state: RootState) => state.bmap.tiltedPolygons
  );
  const verticalPolygon = useSelector(
    (state: RootState) => state.bmap.verticalPolygons
  );
  const polygonUpperHeight = useSelector(
    (state: RootState) => state.bmap.tiltedupperHeights
  );
  const polygonLowerHeight = useSelector(
    (state: RootState) => state.bmap.tiltedlowerHeights
  );
  const detectionPoint = useSelector(
    (state: RootState) => state.bmap.detectionPoints
  );
  const detectionPointHeight = useSelector(
    (state: RootState) => state.bmap.detectionPointsHeight
  );
  const verticalSlope = useSelector(
    (state: RootState) => state.bmap.verticalSlopeArea
  );
  const verticalLowerHeight = useSelector(
    (state: RootState) => state.bmap.verticalLowerHeight
  );
  const verticalUpperHeight = useSelector(
    (state: RootState) => state.bmap.verticalUpperHeight
  );
  const tiltedCheckedElevation = useSelector(
    (state: RootState) => state.bmap.tiltedElevationChecked
  );
  const tiltedCheckedAzimuth = useSelector(
    (state: RootState) => state.bmap.tiltedAzimuthChecked
  );
  const tiltedCheckedIndex = useSelector(
    (state: RootState) => state.bmap.tiltedEdgeChecked
  );
  const verticalCheckedAzimuth = useSelector(
    (state: RootState) => state.bmap.verticalAzimuthChecked
  );
  const verticalCheckedElevation = useSelector(
    (state: RootState) => state.bmap.verticalElevationChecked
  );
  const verticalSwap = useSelector(
    (state: RootState) => state.bmap.verticalSwap
  );
  const tiltedSwap = useSelector((state: RootState) => state.bmap.tiltedSwap);

  const excludeArea = useSelector((state: RootState) => state.bmap.excludeArea);
  const Slope = useSelector((state: RootState) => state.bmap.slopeArea);
  const rulerLine = useSelector((state: RootState) => state.bmap.rulerLines);
  const center = useSelector((state: RootState) => state.bmap.center);
  // --------------------
  const [SmShow, setSmShow] = useState<boolean>(false);
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const [changeValue, setChangeValue] = useState<boolean>(true);
  const [simulationError, setSimulationError] = useState({
    gridWidth: "",
    resolution: "",
    sun_elevation_threshold: "",
    beam_spread: "",
    sun_angle: "",
    sun_reflection_threshold: "",
    intensity_threshold: "",
  });
  const dispatch = useDispatch();
  const simulaterParameter = useSelector(
    (state: RootState) => state.bmap.simulationParameter
  );

  // --------------fetch project name-----
  const [projectInformation, setProjectInformation] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const location = useLocation();
  useEffect(() => {
    const getDocument = async () => {
      const docRef = doc(db, "projects", `${location.state}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProjectInformation(docSnap.data());
        localStorage.setItem("projectName", docSnap.data().projectName);
      } else {
        console.log("No such document!");
      }
    };
    getDocument();
  }, [location.state]);

  const changeSimulationValue = (key: string, value: any) => {
    const convertedValue = value.replace(",", ".");
    if (!isNaN(convertedValue) || value === "") {
      dispatch(setSimulationParameter({ key, value }));
    }
  };
  // };

  useEffect(() => {
    const errors = {
      gridWidth: "",
      resolution: "",
      sun_elevation_threshold: "",
      beam_spread: "",
      sun_angle: "",
      sun_reflection_threshold: "",
      intensity_threshold: "",
    };

    let hasErrors = false;

    if (
      simulaterParameter.grid_width < 0.1 ||
      simulaterParameter.grid_width > 3
    ) {
      errors.gridWidth = "Grid width is between 0.1 to 3";
      hasErrors = true;
    }
    if (
      simulaterParameter.intensity_threshold < 0 ||
      simulaterParameter.intensity_threshold == Number(" ")
    ) {
      errors.intensity_threshold = "Intensity threshold value is required";
      hasErrors = true;
    }
    if (
      simulaterParameter.resolution < 1 ||
      simulaterParameter.resolution > 60
    ) {
      errors.resolution = "Resolution value is between 1 to 60";
      hasErrors = true;
    }

    if (
      simulaterParameter.sun_elevation_threshold < 0 ||
      simulaterParameter.sun_elevation_threshold > 90 ||
      simulaterParameter.sun_elevation_threshold == Number(" ")
    ) {
      errors.sun_elevation_threshold =
        "Sun elevation threshold value is between 0 to 90";
      hasErrors = true;
    }

    if (
      simulaterParameter.beam_spread < 0 ||
      simulaterParameter.beam_spread > 30 ||
      simulaterParameter.beam_spread == Number(" ")
    ) {
      errors.beam_spread = "Beam spread value is between 0 to 30";
      hasErrors = true;
    }

    if (
      simulaterParameter.sun_angle < 0.1 ||
      simulaterParameter.sun_angle > 1
    ) {
      errors.sun_angle = "Apparent diameter of sun is between 0.1 to 1";
      hasErrors = true;
    }

    if (
      simulaterParameter.sun_reflection_threshold < 0 ||
      simulaterParameter.sun_reflection_threshold > 360 ||
      simulaterParameter.sun_reflection_threshold == Number(" ")
    ) {
      errors.sun_reflection_threshold =
        "Threshold for difference angle value is between 0 to 360";
      hasErrors = true;
    }

    setSimulationError(errors);
    setHasErrors(hasErrors);
  }, [simulaterParameter]);

  const closeModal = () => {
    if (!hasErrors) {
      setSmShow(false);
    } else {
      toast.error("Invalid simulation parameter value");
    }
  };
  const saveProjectData = async () => {
    setLoading(true);
    const userDocRef = doc(db, "projects", location.state);
    try {
      await updateDoc(userDocRef, {
        calculated: true,
        detectionPoint: JSON.stringify(detectionPoint),
        detectionPointHeight,
        verticalPVArea: JSON.stringify(verticalPolygon),
        verticalLowerHeight,
        verticalUpperHeight,
        verticalSlope,
        tiltedPolygons: JSON.stringify(tiltedPolygons),
        tiltedUpperHeight: polygonUpperHeight,
        tiltedLowerHeight: polygonLowerHeight,
        tiltedSlope: Slope,
        excludeArea: JSON.stringify(excludeArea),
        rulerLine,
        tiltedCheckedElevation,
        tiltedCheckedIndex,
        tiltedCheckedAzimuth,
        verticalCheckedAzimuth,
        verticalCheckedElevation,
        mapCenter: center,
        verticalSwap,
        tiltedSwap,
        totalCalcualetdReports: increment(1),
      });
      toast.success("Project data has been saved successfully.");
    } catch (e) {
      toast.error("Error saving data. Check input fields.");
      console.error("Error saving project data: ", e);
    } finally {
      setLoading(false);

    }
  };


  const handleDefaultValue = () => {
    changeSimulationValue("grid_width", "1");
    changeSimulationValue("resolution", "1");
    changeSimulationValue("sun_elevation_threshold", "5");
    changeSimulationValue("beam_spread", "5");
    changeSimulationValue("sun_angle", "0.5");
    changeSimulationValue("sun_reflection_threshold", "10");
    changeSimulationValue("intensity_threshold", "30000");
  };

  return (
    <div className="mapPageHeader">
      <Link to={"https://pv-glarecheck.com/"}>
        <Image
          className="logo"
          src={Logo}
          alt="logoHere"
          width={194}
          height={36}
        />
      </Link>
      <div className="centerpart">
        <Link className="dashboard" to="/dashboard">
          <GoArrowLeft />
          Dashboard
        </Link>
        <p className="m-0">
          Active project / {projectInformation?.projectName}
        </p>
      </div>
      <div className="headerButton">
        <Button onClick={saveProjectData} className="option2" variant="none">
          {loading ? (
            <Loader_2 />
          ) : (
            <div className="d-flex align-items-center gap-1">
              Save project
              <MdSaveAlt style={{ marginTop: "2px" }} size={17} />
            </div>
          )}
        </Button>
        <Dropdown>
          <Dropdown.Toggle
            variant="none"
            className="optionDropdown"
            id="dropdown-basic"
          >
            <Button className="option" variant="none">
              Options <BsGear style={{ marginTop: "2px" }} size={15} />
            </Button>
          </Dropdown.Toggle>
          <Dropdown.Menu variant="none" style={{ width: "200px" }}>
            <Dropdown.Item
              onClick={() => setSmShow(true)}
              className="optionReload"
            >
              Simulation parameter
            </Dropdown.Item>
            <Dropdown.Item
              className="optionReload"
              onClick={() => {
                dispatch(clearAllPolygonsAndDetectionPoints());
              }}
            >
              Remove all objects
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Button
          href="https://pv-glarecheck.com/help"
          className="help"
          variant="none"
          target="_blank"
        >
          Help
          <IoIosInformationCircleOutline
            style={{ marginTop: "2px" }}
            size={20}
          />
        </Button>
      </div>
      <Modal
        className="mapPageHeader"
        show={SmShow}
        aria-labelledby="example-modal-sizes-title-sm"
      >
        <Modal.Header className="d-flex justify-content-between align-items-center">
          <Modal.Title className="" id="example-modal-sizes-title-sm">
            Simulation parameter
          </Modal.Title>
          <IoClose
            onClick={closeModal}
            size={25}
            className="mt-1"
            cursor={"pointer"}
          />
        </Modal.Header>
        <Modal.Body
          style={{ overflowY: "auto", height: "550px", margin: "auto" }}
        >
          <Alert variant={"warning"} style={{ fontSize: "14px" }}>
            Please change the simulation parameters only if you know what you
            are doing. By default, the parameters describe standard market PV
            modules and ensure an accurate simulation. See the{" "}
            <a
              target="_block"
              href="https://pv-glarecheck.com/"
              className="text-decoration-none"
              style={{ cursor: "pointer" }}
            >
              help page
            </a>{" "}
            for more information.
          </Alert>
          <div className="coolinput">
            <label htmlFor="input" className="text">
              Grid width [&deg;] :
            </label>
            <input
              type="text"
              name=" grid_width"
              className={`input ${changeValue ? "disabledInput" : ""} `}
              disabled={changeValue}
              onChange={(e) => {
                changeSimulationValue("grid_width", e.target.value);
              }}
              value={simulaterParameter.grid_width}
            />
          </div>
          <p className="error text-center m-0" style={{ fontSize: "12px" }}>
            {simulationError.gridWidth}
          </p>
          <div className="coolinput">
            <label htmlFor="input" className="text">
              Resolution [min] :
            </label>
            <input
              type="text"
              name=" Resolution"
              className={`input ${changeValue ? "disabledInput" : ""} `}
              disabled={changeValue}
              onChange={(e) => {
                changeSimulationValue("resolution", e.target.value);
              }}
              value={simulaterParameter.resolution}
            />
          </div>
          <p className="error text-center m-0" style={{ fontSize: "12px" }}>
            {simulationError.resolution}
          </p>
          <div className="coolinput">
            <label htmlFor="input" className="text">
              Sun elevation threshold [&deg;] :
            </label>
            <input
              type="text"
              name="SunElevationThreshold"
              className={`input ${changeValue ? "disabledInput" : ""} `}
              disabled={changeValue}
              onChange={(e) => {
                changeSimulationValue(
                  "sun_elevation_threshold",
                  e.target.value
                );
              }}
              value={simulaterParameter.sun_elevation_threshold}
            />
          </div>
          <p className="error text-center m-0" style={{ fontSize: "12px" }}>
            {simulationError.sun_elevation_threshold}
          </p>
          <div className="coolinput">
            <label htmlFor="input" className="text">
              Beam Spread [&deg;] :
            </label>
            <input
              type="text"
              name=" input"
              className={`input ${changeValue ? "disabledInput" : ""} `}
              disabled={changeValue}
              onChange={(e) => {
                changeSimulationValue("beam_spread", e.target.value);
              }}
              value={simulaterParameter.beam_spread}
            />
          </div>
          <p className="error text-center m-0" style={{ fontSize: "12px" }}>
            {simulationError.beam_spread}
          </p>
          <div className="coolinput">
            <label htmlFor="input" className="text">
              Apparent diameter of the sun [&deg;] :
            </label>
            <input
              type="text"
              name=" input"
              className={`input ${changeValue ? "disabledInput" : ""} `}
              disabled={changeValue}
              onChange={(e) => {
                changeSimulationValue("sun_angle", e.target.value);
              }}
              value={simulaterParameter.sun_angle}
            />
          </div>
          <p className="error text-center m-0" style={{ fontSize: "12px" }}>
            {simulationError.sun_angle}
          </p>
          <div className="coolinput">
            <label htmlFor="input" className="text">
              Threshold for the different angle [&deg;] :
            </label>
            <input
              type="text"
              name=" input"
              className={`input ${changeValue ? "disabledInput" : ""} `}
              disabled={changeValue}
              onChange={(e) => {
                changeSimulationValue(
                  "sun_reflection_threshold",
                  e.target.value
                );
              }}
              value={simulaterParameter.sun_reflection_threshold}
            />
          </div>
          <p className="error m-0 text-center" style={{ fontSize: "12px" }}>
            {simulationError.sun_reflection_threshold}
          </p>
          <div className="coolinput">
            <label htmlFor="input" className="text">
              Intensity threshold :
            </label>
            <input
              type="text"
              name=" input"
              className={`input ${changeValue ? "disabledInput" : ""} `}
              disabled={changeValue}
              onChange={(e) => {
                changeSimulationValue("intensity_threshold", e.target.value);
              }}
              value={simulaterParameter.intensity_threshold}
            />
          </div>
          <p className="error m-0 text-center" style={{ fontSize: "12px" }}>
            {simulationError.intensity_threshold}
          </p>
          {/* --------------------------- */}
          <div className="coolinput ">
            <label htmlFor="input" className="text">
              Module type :
            </label>
            <Form.Select
              aria-label="Default select example"
              style={{ height: "100%",outline:"none",boxShadow:"none" }}
              className={`input mb-3 ${changeValue ? "disabledInput" : ""} `}
              disabled={changeValue}
              onChange={(e) => {
                changeSimulationValue("moduleType", e.target.value);
              }}
            >
              <option value={1}> Standard PV module with ARC</option>
            </Form.Select>
          </div>

          <div className="d-flex justify-content-center align-items-center gap-2 my-3">
            <Button
              onClick={() => setChangeValue(false)}
              variant="none"
              className="ChangeValuesBtn"
            >
              Change values
            </Button>
            <Button
              onClick={() => {
                setChangeValue(true);
                handleDefaultValue();
              }}
              variant="none"
              className="SetDeafultValueBtn"
            >
              Set deafult values
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MapPageHeader;
