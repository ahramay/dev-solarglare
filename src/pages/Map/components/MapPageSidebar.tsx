import React, { useState, useEffect } from "react";
import TiltedPvAreaPage from "./PVAreas/TiltedPvAreaPage";
import VerticalPvAreaPage from "./PVAreas/VerticalPvAreaPage";
import DetectionPvAreaPage from "./PVAreas/DetectionPvAreaPage";
import { db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectedArea } from "../../../store/reducers/bmapSlice";
import { RootState } from "../../../store";
import CalculateGlare from "./CalculateGlare";
import GoToPvArea from "../../../images/Add Location Vector.png";
import { Image } from "react-bootstrap";
const MapPageSidebar: React.FC = () => {
  const [projectInformation, setProjectInformation] = useState<any>({});
  const selectedAreaType = useSelector(
    (state: RootState) => state.bmap.selectedArea
  );
  const dispatch = useDispatch();
  const location = useLocation();

  const onTabChange = (areaType: string) => {
    dispatch(selectedArea({ value: areaType }));
  };
  // --------------fetch project name-----
  useEffect(() => {
    const getDocument = async () => {
      const docRef = doc(db, "projects", `${location.state}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProjectInformation(docSnap.data());
        localStorage.setItem("projectName", docSnap.data().projectName);
        localStorage.setItem("utcRegion", docSnap.data().timeZone);
      } else {
        console.log("No such document!");
      }
    };
    getDocument();
  }, [location.state]);
  return (
    <section
      className="d-flex justify-content-between pb-2 align-items-center flex-column"
      style={{ width: "100%", height: "89vh" }}
    >
      <div>
        <div className="side_bar_div">
          <p
            onClick={() => {
              onTabChange("tiltedTab");
            }}
            className={
              selectedAreaType?.value === "tilted" ||  selectedAreaType?.value === "tiltedTab"
                ? "activeType"
                : "nonActiveType"
            }
          >
            Tilted PV Areas
          </p>
          <p
            onClick={() => {
              onTabChange("verticalTab");
            }}
            className={
              selectedAreaType?.value === "vertical" ||  selectedAreaType?.value === "verticalTab"
                ? "activeType"
                : "nonActiveType"
            }
          >
            Vertical PV Area
          </p>
          <p
            onClick={() => onTabChange("detectionTab")}
            className={
              selectedAreaType?.value === "detection"|| selectedAreaType?.value === "detectionTab"
                ? "activeType"
                : "nonActiveType"
            }
          >
            Detection points
          </p>
        </div>
        <TiltedPvAreaPage projectName={projectInformation?.projectName} />
        <VerticalPvAreaPage projectName={projectInformation?.projectName} />
        <DetectionPvAreaPage projectName={projectInformation?.projectName} />
        {(selectedAreaType?.value === undefined ||
          selectedAreaType?.value === "exclude" ||
          selectedAreaType?.value === "ruler") && (
          <div className="detectionNothingToShow" style={{ height: "70vh" }}>
            <div>
              <Image src={GoToPvArea} alt="addTiltedPVarea" loading="lazy" />
              <strong>Go to PV area location</strong>
              <small>
                Simply type what you're looking for into the search bar and hit
                enter.
              </small>
            </div>
          </div>
        )}
      </div>
      <div>
        <CalculateGlare />
      </div>
    </section>
  );
};

export default MapPageSidebar;
