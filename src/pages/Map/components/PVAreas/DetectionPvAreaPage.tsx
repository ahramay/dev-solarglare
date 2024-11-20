/**
 * @description      :
 * @author           :
 * @group            :
 * @created          : 17/07/2024 - 11:31:33
 *
 * MODIFICATION LOG
 * - Version         : 1.0.0
 * - Date            : 17/07/2024
 * - Author          :
 * - Modification    :
 **/
import React, { useEffect, useState } from "react";
import {
  Accordion,
  Button,
  Image,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store";
import {
  deletedetectionPointsHeight,
  removeDetectionPoint,
  setdetectionPointsHeight,
} from "../../../../store/reducers/bmapSlice";
import { api } from "../../../../api/data";
import AddDetectionPoint from "../../../../images/Add Detection Points Vector.png";
import { FaRegEye } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { RxCaretDown, RxCaretUp } from "react-icons/rx";
import { IoInformationCircleOutline } from "react-icons/io5";
// import "./DetectionPvAreaPage.css"; // Import the custom CSS file

interface Location {
  lat: number;
  lng: number;
}
interface ResultItem {
  elevation: number;
  location: Location;
  resolution: number;
}
interface DataPoint {
  results: ResultItem[];
  status: string;
}

const DetectionPvAreaPage: React.FC<{ projectName: string }> = ({
  projectName,
}) => {
  const dispatch = useDispatch();
  const [isDropdownExpanded, setIsDropdownExpanded] = useState<boolean[]>([]);
  const [detectionPointLength, setdetectionPointLength] = useState<number>(0);
  const [elevationPoints, setelevationPoints] = useState<{ results: any }[][]>(
    []
  );
  const detectionPoints = useSelector(
    (state: RootState) => state.bmap.detectionPoints
  );
  const selectedAreaType = useSelector(
    (state: RootState) => state.bmap.selectedArea
  );
  const detectionPointHeight = useSelector(
    (state: RootState) => state.bmap.detectionPointsHeight
  );
  const fetchData = async () => {
    try {
      const updatedElevationPoints: any[] = [];
      for (const points of detectionPoints.flat()) {
        const { lat, lng } = points;
        const res = await api.getElevation(lat, lng);
        updatedElevationPoints.push(res.data);
      }
      setelevationPoints(updatedElevationPoints);
      localStorage.setItem(
        "detectionPoint",
        JSON.stringify(updatedElevationPoints)
      );
    } catch (error) {
      console.error("Error fetching elevation data:", error);
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    const delayedFetch = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        fetchData();
      }, 1000); // 1 second delay
    };

    delayedFetch(); // Initial call on component mount

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [detectionPoints]);

  // to delete the value from redux state
  const handleDeleteDectectionPoint = (index: number) => {
    dispatch(removeDetectionPoint(index));
    const updatedDetectionPoints = [...detectionPoints];
    updatedDetectionPoints.splice(index, 1);
    dispatch(deletedetectionPointsHeight({ index }));
  };

  const toggleDropdown = (index: number) => {
    const newDropdownState = [...isDropdownExpanded];
    newDropdownState[index] = !newDropdownState[index];
    setIsDropdownExpanded(newDropdownState);
  };
  useEffect(() => {
    if (
      detectionPoints.length > 0 &&
      detectionPoints.length >= detectionPointLength
    ) {
      setIsDropdownExpanded((prev) => [
        ...new Array(detectionPoints.length - 1).fill(false),
        true,
      ]);
      setdetectionPointLength(detectionPoints.length);
    }
  }, [detectionPoints]);

  const groundElevationTooltip = (
    <Tooltip id="tooltip">
      <small>
        Ground elevation refers to the height of the local terrain surface and
        serves as the reference height for the PV area edges. When
        auto-calculated is active, ground elevation is obtained through the
        Google API.
      </small>
    </Tooltip>
  );

  return (
    <div>
      {detectionPoints.length < 1 &&
        (selectedAreaType?.value === "detection" ||
          selectedAreaType?.value === "detectionTab") && (
          <div className="detectionNothingToShow">
            <div>
              <Image
                src={AddDetectionPoint}
                alt="addTiltedPVarea"
                loading="lazy"
              />
              <strong>Add Detection points</strong>
              <small>
                Add points on the map where you expect the glare to have an
                effect. Add altitude/s for glare info on exact heights above
                ground.
              </small>
            </div>
          </div>
        )}
      {detectionPoints.length > 0 &&
        (selectedAreaType?.value === "detection" ||
          selectedAreaType?.value === "detectionTab") && (
          <div style={{ height: "76vh", overflowY: "auto" }}>
            {detectionPoints.map((value: any, index: number) => (
              <div
                className="DetectionPvAreaPage mb-2 w-100"
                key={`detectionPoints${index}`}
              >
                <Accordion
                  className="w-100"
                  activeKey={isDropdownExpanded[index] ? `${index}` : null}
                >
                  <Accordion.Item
                    eventKey={`${index}`}
                    style={{ width: "100%" }}
                  >
                    <Accordion.Header
                      onClick={() => toggleDropdown(index)}
                      style={{ width: "100%" }}
                    >
                      <div className="projectName">
                        {`P - ${index + 1}`} &nbsp; |
                        <MdDeleteOutline
                          size={17}
                          className="mb-1"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent accordion from toggling
                            handleDeleteDectectionPoint(index);
                          }}
                        />
                      </div>
                      <div className={`collapseBtn`}>
                        {isDropdownExpanded[index] ? (
                          <span>
                            collapse <RxCaretUp size={20} />
                          </span>
                        ) : (
                          <span>
                            expand <RxCaretDown size={20} />
                          </span>
                        )}
                      </div>
                    </Accordion.Header>
                    <Accordion.Body style={{ width: "100%" }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <p className="m-0">Altitude parameters</p>
                      </div>
                      {/* <p
                        style={{
                          fontSize: "13px",
                          color: "#fff",
                          width: "fit-content",
                          marginTop: "15px",
                          marginBottom: "0px",
                          padding: "3px",
                          borderRadius: "4px",
                          backgroundColor: "#0984E3",
                        }}
                      >
                        Height above ground :
                      </p> */}
                      <div className="d-flex justify-content-between">
                        <div className="coolinput">
                          <label htmlFor="input" className="text">
                            Above ground [m] :
                          </label>
                          <input
                            id={`${index}`}
                            type="number"
                            step="0.01"
                            placeholder="Ground Level"
                            name="input"
                            className="input"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const nextIndex =
                                  index === detectionPoints.length - 1
                                    ? 0
                                    : index + 1;
                                const nextInput = document.getElementById(
                                  `${nextIndex}`
                                );

                                if (!isDropdownExpanded[nextIndex]) {
                                  toggleDropdown(nextIndex);
                                  setTimeout(() => {
                                    nextInput?.focus();
                                  }, 300);
                                } else {
                                  nextInput?.focus();
                                }
                              }
                            }}
                            value={detectionPointHeight[index] || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value)) {
                                dispatch(
                                  setdetectionPointsHeight({
                                    index,
                                    value,
                                  })
                                );
                              } else {
                                dispatch(
                                  setdetectionPointsHeight({
                                    index,
                                    value: null,
                                  })
                                );
                              }
                            }}
                          />
                        </div>
                        <div className="d-flex gap-1 ps-2">
                          <div className="coolinput">
                            <label htmlFor="input" className="text">
                              Ground elevation [m] :
                            </label>
                            <input
                              readOnly
                              type="text"
                              placeholder="Elevation"
                              name="input"
                              className="input disabledInput"
                              value={
                                elevationPoints[index]
                                  ? `${elevationPoints[
                                      index
                                    ][0]?.results[0]?.elevation.toFixed(3)}`
                                  : "Calculating ..."
                              }
                            />
                          </div>
                          <OverlayTrigger
                            placement="top"
                            overlay={groundElevationTooltip}
                          >
                            <Button variant="none" className="mt-2 p-0">
                              <IoInformationCircleOutline
                                color="#0984E3"
                                size={20}
                                className="mt-3"
                              />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default DetectionPvAreaPage;
