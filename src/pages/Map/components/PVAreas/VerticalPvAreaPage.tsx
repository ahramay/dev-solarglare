import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store";
import {
  Accordion,
  Image,
  Form,
  OverlayTrigger,
  Button,
  Tooltip,
} from "react-bootstrap";
import {
  addVerticalPolygon,
  addVerticalSlopeArea,
  deleteVerticalHeights,
  removeVerticalPolygon,
  setVerticalLowerHeight,
  setVerticalUpperHeight,
  CalculateGlare,
  setVerticalAzimutyhValue,
  deleteAzimuthValue,
  setVeticalAverageElevation,
  removeVerticalAvgElevation,
  setVerticalAzimuthCheck,
  setVerticalElevationCheck,
  deleteVerticalchecked,
  setVerticalSwap,
  deleteVerticalSwap,
} from "../../../../store/reducers/bmapSlice";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { api } from "../../../../api/data";
import AddDetectionPoint from "../../../../images/Add Facade PV Area Vector.png";
// import icons
import { IoInformationCircleOutline } from "react-icons/io5";
import { RxCaretDown, RxCaretUp } from "react-icons/rx";
import { MdDeleteOutline } from "react-icons/md";
import { FaRegEye } from "react-icons/fa";
import { toast } from "react-toastify";

type elevationData = {
  upperEdge: {
    elevation: any;
    lat: number;
    lon: number;
    offset: number;
    tag: string;
  };
  lowerEdge: {
    elevation: any;
    lat: number;
    lon: number;
    offset: number;
    tag: string;
  };
};
const VerticalPvAreaPage: React.FC<{ projectName: string }> = ({
  projectName,
}) => {
  const polygons = useSelector(
    (state: RootState) => state.bmap.verticalPolygons
  );
  const verticalAzimuth = useSelector(
    (state: RootState) => state.bmap.verticalAzimuthValue
  );
  const vertivalSlopeArea = useSelector(
    (state: RootState) => state.bmap.verticalSlopeArea
  );
  const verticalLowerHeight = useSelector(
    (state: RootState) => state.bmap.verticalLowerHeight
  );
  const verticalUpperHeight = useSelector(
    (state: RootState) => state.bmap.verticalUpperHeight
  );
  const selectedArea = useSelector(
    (state: RootState) => state.bmap.selectedArea
  );
  const averageElevation = useSelector(
    (state: RootState) => state.bmap.verticalAverageElevation
  );
  const checkedAzimuth = useSelector(
    (state: RootState) => state.bmap.verticalAzimuthChecked
  );
  const checkedAvgElevation = useSelector(
    (state: RootState) => state.bmap.verticalElevationChecked
  );
  const verticalSwap = useSelector(
    (state: RootState) => state.bmap.verticalSwap
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const dispatch = useDispatch();
  const [isDropdownExpanded, setIsDropdownExpanded] = useState<boolean[]>([]);
  // const [verticalSwap, setVerticalSwap] = useState<boolean[]>([]);
  const [elevationData, setElevationData] = useState<elevationData[]>([]);
  const [polygonLength, setPolygonLength] = useState<number>(0);
  const [widthValues, setWidthValues] = useState<number[]>([]);
  // const [checkedAzimuth, setCheckedAzimuth] = useState<boolean[]>([]);
  // const [checkedAvgElevation, setCheckedAvgElevation] = useState<boolean[]>([]);

  //  --------------To set elevation when uer enter new polygon------------------------
  const fetchElevations = async () => {
    try {
      const updatedElevationData = await Promise.all(
        polygons.map(async (polygon) => {
          const upperCoords = polygon[0];
          const lowerCoords = polygon[1];

          const upperResponse = await api.getElevation(
            upperCoords?.lat,
            upperCoords?.lng
          );
          const upperElevation =
            upperResponse.data[0]?.results[0]?.elevation ?? null;

          const lowerResponse = await api.getElevation(
            lowerCoords?.lat,
            lowerCoords?.lng
          );
          const lowerElevation =
            lowerResponse.data[0]?.results[0]?.elevation ?? null;

          const averageElevation =
            (Number(lowerElevation) + Number(upperElevation)) / 2;
          if (checkedAvgElevation[polygons.length - 1]) {
            dispatch(
              setVeticalAverageElevation({
                index: polygons.length - 1,
                value: averageElevation.toFixed(1),
              })
            );
          }
          return {
            upperEdge: {
              elevation: upperElevation,
              lat: upperCoords?.lat,
              lon: upperCoords?.lng,
              offset: 0,
              tag: "upper_edge",
            },
            lowerEdge: {
              elevation: lowerElevation,
              lat: lowerCoords?.lat,
              lon: lowerCoords?.lng,
              offset: 0,
              tag: "lower_edge",
            },
          };
        })
      );
      setElevationData(updatedElevationData);
    } catch (error) {
      console.error("Error fetching elevations:", error);
      toast.error("Error fetching elevations:");
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    const delayedFetch = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        fetchElevations();
      }, 1000); // 1 second delay
    };

    delayedFetch(); // Initial call on component mount

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [polygons, checkedAvgElevation]);
  useEffect(() => {
    const getAzimuthValue = async () => {
      const azimuthDataArray = [];
      
      for (let i = 0; i < elevationData.length; i++) { // Loop through all indices
        if (checkedAzimuth[i]) {
          dispatch(
            setVerticalAzimutyhValue({
              index: i,
              azimuth: null, // Set azimuth to null for the current index
            })
          );
        }
  
        const result = {
          point1: {
            lat: elevationData[i]?.upperEdge?.lat,
            lon: elevationData[i]?.upperEdge?.lon,
            elevation: elevationData[i]?.upperEdge?.elevation,
            offset: 0,
            tag: "upper_edge",
          },
          point2: {
            lat: elevationData[i]?.upperEdge?.lat,
            lon: elevationData[i]?.upperEdge?.lon,
            elevation: elevationData[i]?.upperEdge?.elevation,
            offset: 0,
            tag: "upper_edge",
          },
          point3: {
            lat: elevationData[i]?.lowerEdge?.lat,
            lon: elevationData[i]?.lowerEdge?.lon,
            elevation: elevationData[i]?.lowerEdge?.elevation,
            offset: 0,
            tag: "lower_edge",
          },
          point4: {
            lat: elevationData[i]?.lowerEdge?.lat,
            lon: elevationData[i]?.lowerEdge?.lon,
            elevation: elevationData[i]?.lowerEdge?.elevation,
            offset: 0,
            tag: "lower_edge",
          },
        };
  
        if (verticalLowerHeight[i] != null && verticalUpperHeight[i] != null && checkedAzimuth[i] === true) {
          try {
            const response = await axios.put(
              "https://solarglare.work/azimuth/",
              JSON.stringify(result),
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
  
            const azimuthResult = response?.data.aziumth;
            
            dispatch(
              setVerticalAzimutyhValue({
                index: i,
                azimuth: azimuthResult,
              })
            );
  
            azimuthDataArray.push({ azimuth: azimuthResult, polygonData: elevationData[i] });
          } catch (err) {
            console.log(`Error fetching azimuth data for index ${i}:`, err);
          }
        }
      }
    };
  
    getAzimuthValue();
  }, [elevationData, checkedAzimuth, verticalUpperHeight, verticalLowerHeight, dispatch]);
  
  
  useEffect(() => {
    const polygonLength = polygons.length - 1;
    dispatch(setVerticalSwap({ index: polygonLength, checked: false }));
    if (checkedAvgElevation[polygonLength] === undefined) {
      dispatch(
        setVerticalElevationCheck({ index: polygonLength, check: true })
      );
    }
    if (checkedAzimuth[polygonLength] === undefined) {
      dispatch(setVerticalAzimuthCheck({ index: polygonLength, check: true }));
    }
  }, [polygons.length]);

  const handleDeletePolygon = (index: number) => {
    dispatch(removeVerticalPolygon(index));
    dispatch(deleteVerticalHeights({ index }));
    elevationData.splice(index, 1);
    dispatch(deleteAzimuthValue({ index }));
    dispatch(removeVerticalAvgElevation({ index }));
    dispatch(deleteVerticalchecked({ index }));
    dispatch(deleteVerticalSwap({ index }));
  };

  const oneDigitAfterPoint = (enterValue: string) => {
    let value = enterValue;
    if (value.includes(".")) {
      const parts = value.split(".");
      if (parts[1].length > 1) {
        value = `${parts[0]}.${parts[1].slice(0, 1)}`;
      }
    }
    return value;
  };
  // Calculate width for each polygon and store in widthValues state
  useEffect(() => {
    const newWidthValues = polygons.map((coord, index) => {
      const width = google?.maps?.geometry?.spherical.computeDistanceBetween(
        new google.maps.LatLng(coord[0]?.lat, coord[0]?.lng),
        new google.maps.LatLng(coord[1]?.lat, coord[1]?.lng)
      );
      return parseFloat(width.toFixed(1));
    });
    setWidthValues(newWidthValues);
  }, [polygons]);

  useEffect(() => {
    if (polygons.length > 0 && polygons.length >= polygonLength) {
      setIsDropdownExpanded((prev) => [
        ...new Array(polygons.length - 1).fill(false),
        true,
      ]);
      setPolygonLength(polygons.length);
    }
  }, [polygons]);

  const toggleDropdown = (index: number) => {
    const newDropdownState = [...isDropdownExpanded];
    newDropdownState[index] = !newDropdownState[index];
    setIsDropdownExpanded(newDropdownState);
  };

  const groundElevationTooltip = (
    <Tooltip id="tooltip">
      <small>
        {" "}
        Ground elevation refers to the height of the local terrain surface and
        serves as the reference height for the PV area edges. When
        auto-calculated is active, ground elevation is obtained through the
        Google API.
      </small>
    </Tooltip>
  );

  const Azimuthtooltip = (
    <Tooltip id="tooltip">
      <small>
        {" "}
        The azimuth describes the orientation of the PV area using a 360°
        reference system: 0° = North, 90° = East, 180° = South, 270° = West.
        When auto-calculate is active, the azimuth is derived from the drawing.
      </small>
    </Tooltip>
  );

  const tiltedAngle = (
    <Tooltip id="tooltip">
      <small>
        The tilt angle describes the inclination angle of the PV area.
      </small>
    </Tooltip>
  );
  return (
    <div>
      {(selectedArea?.value == "vertical" ||
        selectedArea?.value == "verticalTab") &&
        polygons.length < 1 && (
          <div className="verticalNothingToShow">
            <div>
              <Image
                src={AddDetectionPoint}
                alt="addTiltedPVarea"
                loading="lazy"
              />
              <strong>Add facade PV area</strong>
              <small>
                Optimal for wall solar panel setups. Simply mark the area by
                drawing a line on the map and providing the required parameters.
              </small>
            </div>
          </div>
        )}
      {polygons.length > 0 &&
        (selectedArea?.value == "vertical" ||
          selectedArea?.value == "verticalTab") && (
          <div style={{ height: "76vh", overflowY: "auto" }}>
            {polygons.map((value, index) => {
              return (
                <div className="VerticalPvAreaPage mb-2">
                  <Accordion
                    activeKey={isDropdownExpanded[index] ? `${index}` : null}
                  >
                    <Accordion.Item eventKey={`${index}`}>
                      <Accordion.Header onClick={() => toggleDropdown(index)}>
                        <p className="projectName my-auto">
                          {`VPV - ${index + 1}`} &nbsp; |
                          {/* <FaRegEye size={17} color="#2F3F50" />  */}
                          <MdDeleteOutline
                            size={17}
                            color="red"
                            className="mb-1"
                            onClick={() => handleDeletePolygon(index)}
                          />
                        </p>
                        <p className={`collapseBtn my-auto`}>
                          {isDropdownExpanded[index] ? (
                            <span>
                              collapse <RxCaretUp size={20} />
                            </span>
                          ) : (
                            <span>
                              expand <RxCaretDown size={20} />
                            </span>
                          )}
                        </p>
                      </Accordion.Header>
                      <Accordion.Body className="p-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <p className="m-0">
                            Area dimensions{" "}
                            {/* <IoInformationCircleOutline
                            color="#0984E3"
                            size={20}
                          /> */}
                          </p>
                        </div>
                        <div className="coolinput">
                          <label htmlFor="input" className="text">
                            Length [m] :
                          </label>
                          <input
                            type="text"
                            name="input"
                            className="input disabledInput"
                            value={`${widthValues[index]}`}
                          />
                        </div>
                        <p className="m-0 mt-4">
                          Altitude parameters{" "}
                          {/* <IoInformationCircleOutline color="#0984E3" size={20} /> */}
                        </p>
                        <div className="d-flex justify-content-between mt-1">
                          <div className="coolinput">
                            <label htmlFor="input" className="text">
                              Upper edge height [m]:
                            </label>
                            <input
                              step="0.01"
                              type="number"
                              name="input"
                              className="input"
                              onChange={(e) => {
                                const value = oneDigitAfterPoint(
                                  e.target.value
                                );
                                dispatch(
                                  setVerticalUpperHeight({
                                    index,
                                    floatValue: value === "" ? null : value,
                                  })
                                );
                              }}
                              value={
                                verticalUpperHeight[index] === null
                                  ? " "
                                  : verticalUpperHeight[index]
                              }
                            />
                          </div>
                          <div className="d-flex justify-content-between">
                            <div className="coolinput">
                              <label htmlFor="input" className="text">
                                Lower edge height [m] :
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                name="input"
                                className="input"
                                onChange={(e) => {
                                  const value = oneDigitAfterPoint(
                                    e.target.value
                                  );
                                  dispatch(
                                    setVerticalLowerHeight({
                                      index,
                                      floatValue: value === "" ? null : value,
                                    })
                                  );
                                }}
                                value={
                                  verticalLowerHeight[index] === null
                                    ? ""
                                    : verticalLowerHeight[index]
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between">
                          <div className="d-flex gap-1 mt-1">
                            <div className="coolinput">
                              <label htmlFor="input" className="text">
                                Ground elevation [m]:
                              </label>
                              <input
                                onChange={(e) => {
                                  const value = oneDigitAfterPoint(
                                    e.target.value
                                  );

                                  dispatch(
                                    setVeticalAverageElevation({
                                      index,
                                      value: value === "" ? null : value,
                                    })
                                  );
                                }}
                                type="text"
                                name="input"
                                className={
                                  checkedAvgElevation[index]
                                    ? "disabledInput input"
                                    : "input"
                                }
                                disabled={
                                  checkedAvgElevation[index] ? true : false
                                }
                                value={
                                  averageElevation[index] === null
                                    ? ""
                                    : averageElevation[index]
                                }
                              />
                              <div className="d-flex align-items-center">
                                <Form.Check
                                  checked={checkedAvgElevation[index]}
                                  onChange={(e) => {
                                    dispatch(
                                      setVerticalElevationCheck({
                                        index,
                                        check: e.target.checked,
                                      })
                                    );
                                  }}
                                />
                                <label
                                  htmlFor="upperEdge"
                                  className="ms-2"
                                  style={{
                                    fontSize: "12px",
                                    color: "#858585 ",
                                  }}
                                >
                                  Auto-calculate
                                </label>
                              </div>
                            </div>
                            <OverlayTrigger
                              placement="top"
                              overlay={groundElevationTooltip}
                            >
                              <Button variant="none" className="mt-0 p-0">
                                <IoInformationCircleOutline
                                  color="#0984E3"
                                  size={20}
                                />
                              </Button>
                            </OverlayTrigger>
                          </div>
                          <div
                            className="default"
                            style={{ marginTop: "25px" }}
                          >
                            <div className="d-flex justify-content-between align-items-center px-2 pt-2">
                              <p className="m-0 defaultText">
                                {" "}
                                {verticalSwap[index] ? "swaped" : "default"}
                              </p>
                              <label className="switch">
                                <input
                                  type="checkbox"
                                  checked={verticalSwap[index]}
                                  onChange={(e) => {
                                    const newUpperCoords = value[1];
                                    const newLowerCoords = value[0];
                                    dispatch(
                                      addVerticalPolygon({
                                        index,
                                        verticalPolygon: [
                                          {
                                            lat: newUpperCoords.lat,
                                            lng: newUpperCoords.lng,
                                          },
                                          {
                                            lat: newLowerCoords.lat,
                                            lng: newLowerCoords.lng,
                                          },
                                        ],
                                      })
                                    );
                                    dispatch(
                                      setVerticalSwap({
                                        index,
                                        checked: e.target.checked,
                                      })
                                    );
                                  }}
                                />
                                <span className="slider"></span>
                              </label>
                            </div>
                            <strong className="floatingLable">
                              Swap PV area edges :{" "}
                            </strong>
                          </div>
                        </div>
                        <p className="m-0 mt-4">
                          Angle parameters
                          {/* <IoInformationCircleOutline
                            color="#0984E3"
                            size={20}
                          /> */}
                        </p>
                        <div className="d-flex align-items-center gap-2">
                          <div className="coolinput">
                            <label htmlFor="input" className="text">
                              Tilt angle [&deg;] :
                            </label>
                            <input
                              onChange={(e) => {
                                const value = oneDigitAfterPoint(
                                  e.target.value
                                );
                                dispatch(
                                  addVerticalSlopeArea({
                                    index,
                                    value: value === "" ? null : value,
                                  })
                                );
                              }}
                              type="number"
                              // step="0.01"
                              name="input"
                              className="input"
                              value={
                                vertivalSlopeArea[index] === null
                                  ? ""
                                  : vertivalSlopeArea[index]
                              }
                            />
                          </div>

                          <OverlayTrigger placement="top" overlay={tiltedAngle}>
                            <Button variant="none" className="mt-3 p-0">
                              <IoInformationCircleOutline
                                color="#0984E3"
                                size={20}
                                className="mt-3"
                              />
                            </Button>
                          </OverlayTrigger>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <div className="coolinput">
                            <label htmlFor="input" className="text">
                              Azimuth [&deg;] :
                            </label>
                            <input
                              onChange={(e) => {
                                const value = oneDigitAfterPoint(
                                  e.target.value
                                );
                                dispatch(
                                  setVerticalAzimutyhValue({
                                    index,
                                    azimuth: value === "" ? null : value,
                                  })
                                );
                              }}
                              type="number"
                              step="0.01"
                              name="input"
                              className={
                                checkedAzimuth[index]
                                  ? "disabledInput input"
                                  : "input"
                              }
                              disabled={checkedAzimuth[index]}
                              placeholder={
                                checkedAzimuth[index] === true
                                  ? "Provide height data first"
                                  : ``
                              }
                              value={
                                verticalAzimuth[index] === null && verticalLowerHeight[index] === null && verticalUpperHeight[index] === null
                                  ? " "
                                  : verticalAzimuth[index]
                              }
                            />
                          </div>
                          <OverlayTrigger
                            placement="top"
                            overlay={Azimuthtooltip}
                          >
                            <Button variant="none" className="mt-3 p-0">
                              <IoInformationCircleOutline
                                color="#0984E3"
                                size={20}
                              />
                            </Button>
                          </OverlayTrigger>
                        </div>
                        <div className="d-flex align-items-center">
                          <Form.Check
                            checked={checkedAzimuth[index]}
                            onChange={(e) => {
                              dispatch(
                                setVerticalAzimuthCheck({
                                  index,
                                  check: e.target.checked,
                                })
                              );
                            }}
                          />
                          <label
                            htmlFor="upperEdge"
                            className="ms-2"
                            style={{ fontSize: "12px", color: "#858585 " }}
                          >
                            Auto-calculate
                          </label>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};

export default VerticalPvAreaPage;
