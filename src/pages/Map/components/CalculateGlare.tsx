import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FaPlay } from "react-icons/fa";
// import { CalculateGlare as glareStatus } from "../../../store/reducers/bmapSlice";
import { toast } from "react-toastify";
// import moment from "moment-timezone";
import { auth, db } from "../../../firebase";
import {
  doc,
  setDoc,
  updateDoc,
  increment,
  deleteDoc,
} from "firebase/firestore";

const CalculateGlare: React.FC = () => {
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const location = useLocation();
  const navigate = useNavigate();
  const tiltedPolygons = useSelector(
    (state: RootState) => state.bmap.tiltedPolygons
  );
  const tiltedIntersection = useSelector(
    (state: RootState) => state.bmap.tiltedIntersection
  );

  const verticalPolygon = useSelector(
    (state: RootState) => state.bmap.verticalPolygons
  );
  const tiltedUpperHeight = useSelector(
    (state: RootState) => state.bmap.tiltedupperHeights
  );
  const tiltedLowerHeight = useSelector(
    (state: RootState) => state.bmap.tiltedlowerHeights
  );
  const tiltedAzimuth = useSelector(
    (state: RootState) => state.bmap.tiltedAzimuthValue
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
  const projectName = localStorage.getItem("projectName");
  const excludeArea = useSelector((state: RootState) => state.bmap.excludeArea);
  const Slope = useSelector((state: RootState) => state.bmap.slopeArea);
  const zoomLevel = useSelector((state: RootState) => state.bmap.zoom);
  const rulerLine = useSelector((state: RootState) => state.bmap.rulerLines);
  const center = useSelector((state: RootState) => state.bmap.center);
  const verticalAvgElevation = useSelector(
    (state: RootState) => state.bmap.verticalAverageElevation
  );
  const tiltedAvgElevation = useSelector(
    (state: RootState) => state.bmap.tiltedAverageElevation
  );
  const verticalAzimuth = useSelector(
    (state: RootState) => state.bmap.verticalAzimuthValue
  );
  const simulationParameter = useSelector(
    (state: RootState) => state.bmap.simulationParameter
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
  const generateRandomCombination = () => {
    const randomLetters = Array.from({ length: 7 }, () =>
      String.fromCharCode(Math.floor(Math.random() * 26) + 97)
    ).join("");
    const randomNumber = Math.floor(Math.random() * 100000);
    return randomLetters.toLocaleUpperCase() + randomNumber;
  };

  // const generateNineDigitNumber = () => {
  //   const min = 100000000;
  //   const max = 999999999;
  //   const nineDigitNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  //   return nineDigitNumber.toString();
  // };

  function getUtcOffset(timeZoneString: string) {
    const match = timeZoneString.match(/UTC([+-]\d+)/);
    return match ? match[1] : 0;
  }

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

  const storeDatainDB = async () => {
    const userDocRef = doc(db, "projects", location.state);
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
  };
  const startTiltedSimulation = async () => {
    const simValue = generateRandomCombination();
    await storeDatainDB();
    try {
      const AzimuthDataArray = localStorage.getItem("AzimuthDataArray") || "";
      const data = AzimuthDataArray ? JSON.parse(AzimuthDataArray) : [];
      const detectionData = localStorage.getItem("detectionPoint");
      const verticalDataArray =
        localStorage.getItem("AzimuthVerticalDataArray") || "";
      const verticalData = verticalDataArray
        ? JSON.parse(verticalDataArray)
        : [];
      const detectionPointsData = detectionData
        ? JSON.parse(detectionData)
        : [];
      const utcRegion = localStorage.getItem("utcRegion");
      const utcOffset = utcRegion ? getUtcOffset(utcRegion) : 0;
      const tiltedPVAreas = data.map((value: any, index: number) => [
        {
          latitude: Number(value.polygonData.point1.lat.toFixed(6)),
          longitude: Number(value.polygonData.point1.lon.toFixed(6)),
          ground_elevation: Number(
            value.polygonData.point1.elevation.toFixed(2)
          ),
          height_above_ground: Number(polygonUpperHeight[index]),
        },
        {
          latitude: Number(value.polygonData.point2.lat.toFixed(6)),
          longitude: Number(value.polygonData.point2.lon.toFixed(6)),
          ground_elevation: Number(
            value.polygonData.point2.elevation.toFixed(2)
          ),
          height_above_ground: Number(polygonUpperHeight[index]),
        },
        {
          latitude: Number(value.polygonData.point3.lat.toFixed(6)),
          longitude: Number(value.polygonData.point3.lon.toFixed(6)),
          ground_elevation: Number(
            value.polygonData.point3.elevation.toFixed(2)
          ),
          height_above_ground: Number(polygonLowerHeight[index]),
        },
        {
          latitude: Number(value.polygonData.point4.lat.toFixed(6)),
          longitude: Number(value.polygonData.point4.lon.toFixed(6)),
          ground_elevation: Number(
            value.polygonData.point4.elevation.toFixed(2)
          ),
          height_above_ground: Number(polygonLowerHeight[index]),
        },
      ]);

      const verticalPVAreas = verticalData.map(
        (
          value: {
            polygonData: {
              upperEdge: { lat: number; lon: number; elevation: number };
              lowerEdge: { lat: number; lon: number; elevation: number };
            };
          },
          index: number
        ) => [
          {
            latitude: Number(value.polygonData.upperEdge?.lat?.toFixed(6)),
            longitude: Number(value.polygonData.upperEdge?.lon?.toFixed(6)),
            ground_elevation: Number(
              value.polygonData.upperEdge?.elevation?.toFixed(2)
            ),
            height_above_ground: Number(verticalUpperHeight[index] || 0),
          },
          {
            latitude: Number(value.polygonData.lowerEdge?.lat?.toFixed(6)),
            longitude: Number(value.polygonData.lowerEdge?.lon?.toFixed(6)),
            ground_elevation: Number(
              value.polygonData.lowerEdge?.elevation?.toFixed(2)
            ),
            height_above_ground: Number(verticalLowerHeight[index] || 0),
          },
          {
            latitude: Number(value.polygonData.upperEdge?.lat?.toFixed(6)),
            longitude: Number(value.polygonData.upperEdge?.lon?.toFixed(6)),
            ground_elevation: Number(
              value.polygonData.upperEdge?.elevation?.toFixed(2)
            ),
            height_above_ground: Number(verticalUpperHeight[index] || 0),
          },
          {
            latitude: Number(value.polygonData.lowerEdge?.lat?.toFixed(6)),
            longitude: Number(value.polygonData.lowerEdge?.lon?.toFixed(6)),
            ground_elevation: Number(
              value.polygonData.lowerEdge?.elevation?.toFixed(2)
            ),
            height_above_ground: Number(verticalLowerHeight[index] || 0),
          },
        ]
      );

      const listOfTiltedPvAreaInformation = tiltedPolygons.map(
        (value: any, index: number) => ({
          azimuth: Number(tiltedAzimuth[index]),
          tilt: Number(Slope[index]),
          name: `PV Area ${index + 1}`,
        })
      );

      const listOfVerticalPvAreaInformation = verticalPolygon.map(
        (value: any, index: number) => ({
          azimuth: Number(verticalAzimuth[index]),
          tilt: Number(verticalSlope[index]),
          name: `PV Area ${Number(tiltedPolygons.length) + index + 1}`,
        })
      );
      const listOfOps = detectionPointsData.map(
        (detectionPoint: any, index: number) => ({
          latitude: Number(
            detectionPoint[0].results[0]?.location.lat.toFixed(6)
          ),
          longitude: Number(
            detectionPoint[0].results[0]?.location.lng.toFixed(6)
          ),
          ground_elevation: Number(
            detectionPoint[0].results[0]?.elevation.toFixed(2)
          ),
          height_above_ground: Number(detectionPointHeight[index]),
        })
      );
      // const excludedAreas = [excludeArea];
      const excludedAreas = excludeArea.map((innerArray:any) => {
        const firstElement = innerArray[0];
        const lastElement = innerArray[innerArray.length - 1];
        const adjustedArray = (firstElement.lat === lastElement.lat && firstElement.lng === lastElement.lng)
          ? innerArray.slice(0, -1) 
          : innerArray; 
        return adjustedArray.map((value: { lat: any; lng: any; }) => ({
        latitude: value.lat,
        longitude: value.lng,
        }));
      });
      const raw = JSON.stringify({
        identifier: simValue,
        pv_areas: [...tiltedPVAreas, ...verticalPVAreas],
        list_of_pv_area_information: [
          ...listOfTiltedPvAreaInformation,
          ...listOfVerticalPvAreaInformation,
        ],
        list_of_ops: listOfOps,
        excluded_areas: excludedAreas,
        meta_data: {
          project_name: projectName,
          user_id: auth.currentUser?.uid,
          project_id: location.state,
          sim_id: simValue,
          timestamp: Math.floor(Date.now() / 1000),
          utc: Number(utcOffset),
        },
        simulation_parameter: {
          grid_width: parseFloat(simulationParameter.beam_spread.toString().replace(',', '.')),
          resolution: `${simulationParameter.resolution} min`,
          sun_elevation_threshold: parseFloat(simulationParameter.sun_elevation_threshold.toString().replace(',', '.')),
          beam_spread: parseFloat(simulationParameter.beam_spread.toString().replace(',', '.')),
          sun_angle: parseFloat(simulationParameter.sun_angle.toString().replace(',', '.')),
          sun_reflection_threshold: parseFloat(simulationParameter.sun_reflection_threshold.toString().replace(',', '.')),
          intensity_threshold: parseFloat(simulationParameter.intensity_threshold.toString().replace(',', '.')),
          module_type: parseFloat(simulationParameter.moduleType.toString().replace(',', '.')),
          zoom_level: zoomLevel,
        },
      });
      await setDoc(
        doc(db, "paidReport", simValue),
        {
          userId: auth.currentUser?.uid,
          paymentStatus: false,
          projectName: projectName,
          verticalPVArea: verticalPolygon.length,
          tiltedPVArea: tiltedPolygons.length,
          detectionPoints: detectionPoint.length,
          uploadState: 0,
          fileUrl: false,
          date: formattedDateString,
          projectId: location.state,
        },
        { merge: true }
      ).then(async () => {
        navigate("/projectOverview", { state: simValue });
        const requestOptions: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
          body: raw,
          redirect: "follow",
        };
        console.log(raw);
        await fetch("https://solarglare.work/getPDF", requestOptions);
      });
    } catch (error) {
      console.error("Failed to Retrieve PDF:", error);
      toast.error("Failed to Retrieve PDF");
      const docRef = doc(db, "paidReport", simValue);
      await deleteDoc(docRef);
      navigate(`/map_page`, { state: location.state });
    }
  };
  const isButtonDisabled =
    (tiltedPolygons.length === 0 && verticalPolygon.length === 0) ||
    detectionPoint.length === 0 ||
    tiltedIntersection;

  useEffect(() => {
    const handleButtonClick = () => {
      let allFieldsValid = true;
      const errors = [];

      if (tiltedIntersection) {
        setButtonDisabled(true);
        allFieldsValid = false;
        setErrorMessage("Tilted polygon is intersected the lines.");
      }

      if (tiltedPolygons.length === 0 && verticalPolygon.length === 0) {
        setButtonDisabled(true);
        allFieldsValid = false;
        setErrorMessage("You need to enter at least one PV area.");
      }

      if (detectionPoint.length === 0) {
        setButtonDisabled(true);
        allFieldsValid = false;
        setErrorMessage("You need to enter at least one detection point.");
      }

      if (verticalPolygon.length > 0) {
        verticalPolygon.forEach((value, index) => {
          if (verticalLowerHeight[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(
              `Vertical lower height of VPV-${index + 1} is required.`
            );
          }
          if (verticalUpperHeight[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(
              `Vertical upper height of VPV-${index + 1} is required.`
            );
          }
          if (verticalAzimuth[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(
              `Vertical azimuth of VPV-${index + 1} is required.`
            );
          }
          if (verticalSlope[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(`Tile angle of VPV-${index + 1} is required.`);
          }
          if (verticalAvgElevation[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(
              `Vertical average elevation of VPV-${index + 1} is required.`
            );
          }
        });
      }

      if (detectionPoint.length > 0) {
        detectionPoint.forEach((value, index) => {
          if (detectionPointHeight[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(
              `Detection point height of P-${index + 1} is required.`
            );
          }
        });
      }

      if (tiltedPolygons.length > 0) {
        tiltedPolygons.forEach((value, index) => {
          if (tiltedLowerHeight[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(
              `Tilted lower height of TPV-${index - 1} is required.`
            );
          }
          if (tiltedUpperHeight[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(
              `Tilted upper height of TPV-${index - 1} is required.`
            );
          }
          if (Slope[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(`Tile angle of TPV-${index - 1} is required.`);
          }
          if (tiltedAzimuth[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(`Tilted azimuth of TPV-${index - 1} is required.`);
          }
          if (tiltedAvgElevation[index] == null) {
            allFieldsValid = false;
            setButtonDisabled(true);
            setErrorMessage(
              `Tilted elevation of TPV-${index - 1} is required.`
            );
          }
        });
      }

      if (allFieldsValid) {
        setButtonDisabled(false);
      }
    };

    handleButtonClick();
  }, [
    tiltedPolygons,
    verticalPolygon,
    detectionPoint,
    verticalLowerHeight,
    verticalUpperHeight,
    verticalSlope,
    verticalAzimuth,
    tiltedLowerHeight,
    tiltedIntersection,
    tiltedUpperHeight,
    tiltedAzimuth,
    Slope,
    detectionPointHeight,
    verticalAvgElevation,
    tiltedAvgElevation,
  ]);
  return (
    <Button
      className={buttonDisabled ? "disabledCalculateButton" : "CalculateButton"}
      onClick={() => {
        if (buttonDisabled) {
          toast.error(errorMessage);
        } else {
          startTiltedSimulation();
        }
      }}
    >
      <FaPlay size={15} color="#fff" /> Calculate Glare
    </Button>
  );
};

export default CalculateGlare;
