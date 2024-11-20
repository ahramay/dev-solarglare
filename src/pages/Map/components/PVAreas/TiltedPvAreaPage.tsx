/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 06/11/2024 - 13:39:19
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 06/11/2024
    * - Author          : 
    * - Modification    : 
**/
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store";
import {
  Button,
  Image,
  Form,
  OverlayTrigger,
  Tooltip,
  Accordion,
} from "react-bootstrap";
import {
  addSlopeArea,
  addTiltedPolygon,
  deletePolygon,
  deletePolygonHeights,
  deleteTiltedAzimuthValue,
  deleteTiltedSwap,
  deleteTiltedchecked,
  removeSlopeArea,
  removeTiltedAverageElevation,
  setTilAzimuthCheck,
  setTilEdgeCheck,
  setTilElevationCheck,
  setTiltedAzimutyhValue,
  setTiltedLowerHeight,
  setTiltedSwap,
  setTiltedUpperHeight,
  settiltedAverageElevation,
} from "../../../../store/reducers/bmapSlice";
import { api } from "../../../../api/data";
import axios from "axios";
import { toast } from "react-toastify";
import AddTiledPvArea from "../../../../images/Add Tilted PV Area Vector.png";
// import icons
import { RxCaretDown, RxCaretUp } from "react-icons/rx";
import { MdDeleteOutline } from "react-icons/md";
import { IoInformationCircleOutline } from "react-icons/io5";
const TiltedPvAreaPage: React.FC<{ projectName: string }> = ({
  projectName,
}) => {
  const selectedArea = useSelector(
    (state: RootState) => state.bmap.selectedArea
  );
  const polygons = useSelector((state: RootState) => state.bmap.tiltedPolygons);
  const tiltedAzimuth = useSelector(
    (state: RootState) => state.bmap.tiltedAzimuthValue
  );
  const tiltedLowerHeight = useSelector(
    (state: RootState) => state.bmap.tiltedlowerHeights
  );
  const tiltedUpperHeight = useSelector(
    (state: RootState) => state.bmap.tiltedupperHeights
  );
  const swapChecked = useSelector((state: RootState) => state.bmap.tiltedSwap);
  const slopeArea = useSelector((state: RootState) => state.bmap.slopeArea);
  const averageElevation = useSelector(
    (state: RootState) => state.bmap.tiltedAverageElevation
  );
  const checkedElevation = useSelector(
    (state: RootState) => state.bmap.tiltedElevationChecked
  );
  const checkedAzimuth = useSelector(
    (state: RootState) => state.bmap.tiltedAzimuthChecked
  );
  const checkedIndex = useSelector(
    (state: RootState) => state.bmap.tiltedEdgeChecked
  );
  const [polygonIndexLength, setPolygonIndexLength] = useState<number>(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const dispatch = useDispatch();
  const [length, setLength] = useState<number[]>([]);
  const handleToggle = (index: number) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  const [pointElevations, setPointElevations] = useState<number[][]>(
    Array(polygons.length).fill([])
  );
  // const [checkedIndex, setCheckedIndex] = useState<(string | null)[]>([]);
  const [selectedValueIndex, setSelectedValueIndex] = useState<number>(0);
  const [isDropdownExpanded, setIsDropdownExpanded] = useState<boolean[]>([]);
  // const [checkedElevation, setCheckedElevation] = useState<boolean[]>([]);
  // const [checkedAzimuth, setCheckedAzimuth] = useState<boolean[]>([]);

  // Function to handle checkbox change
  const handleCheckboxChange = (value: string, index: number) => {
    console.log("object", checkedIndex, value);
    if (checkedIndex[index] === value && checkedIndex[index] !== undefined) {
      console.log("object");
      dispatch(setTilEdgeCheck({ index, check: null }));
    } else {
      dispatch(setTilEdgeCheck({ index, check: value }));
    }
  };
  //  --------------To set elevation when uer enter new polygon------------------------
  const handleDonePolygon = async () => {
    const azimuthDataArray: {
      azimuth: string;
      polygonData: { [x: string]: any };
    }[] = [];

    for (let i = 0; i < polygons.length; i++) {
      if (
        tiltedLowerHeight[i] === null &&
        tiltedUpperHeight[i] === null &&
        checkedAzimuth[i] === true
      ) {
        dispatch(
          setTiltedAzimutyhValue({
            index: i,
            azimuth: null,
          })
        );
        return;
      }
      if (
        polygons.length >= 1 &&
        pointElevations[i]?.length === 4 &&
        tiltedLowerHeight[i] != null &&
        tiltedUpperHeight[i] != null &&
        checkedAzimuth[i] === true
      ) {
        const polygon = polygons[i];
        const currentElevations = pointElevations[i];

        if (currentElevations) {
          const hasUndefinedElevation = currentElevations.some(
            (elevation) => elevation === undefined
          );

          // Proceed only if all elevation values are defined
          if (!hasUndefinedElevation) {
            const data: { [key: string]: any } = {};

            // Prepare the data for each polygon point
            const points = await Promise.all(
              polygon?.map(async (point: { lat: any; lng: any }, j: number) => {
                let tag = j < 2 ? "upper_edge" : "lower_edge";
                const elevation = currentElevations[j];

                return {
                  lat: point.lat,
                  lon: point.lng,
                  elevation: elevation,
                  offset: 0,
                  tag,
                };
              })
            );

            points.forEach((point, j) => {
              data[`point${j + 1}`] = point;
            });

            const allPolygonData = { ...data };

            try {
              const response = await axios.put(
                "https://solarglare.work/azimuth/",
                allPolygonData,
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              const result = response?.data.aziumth;

              if (checkedAzimuth[i]) {
                dispatch(
                  setTiltedAzimutyhValue({
                    index: i,
                    azimuth: Number(result).toFixed(1),
                  })
                );
              }

              const azimuth = JSON.stringify(result);
              azimuthDataArray.push({ azimuth, polygonData: allPolygonData });
              localStorage.setItem("AzimuthDataArray", JSON.stringify(azimuthDataArray));
            } catch (err) {
              console.log(`Error fetching azimuth data for polygon ${i}:`, err);
            }
          } else {
            console.log(
              `Point elevations for polygon ${i} contain undefined values. API call aborted.`
            );
          }
        } else {
          console.log(
            `Current elevations data for polygon ${i} is undefined. API call aborted.`
          );
        }
      }
    }
  };

  useEffect(() => {
    const polygonLength = polygons.length - 1;
    dispatch(setTiltedSwap({ index: polygonLength, checked: false }));
    if (checkedElevation[polygonLength] === undefined) {
      dispatch(setTilElevationCheck({ index: polygonLength, check: true }));
    }
    if (checkedAzimuth[polygonLength] === undefined) {
      dispatch(setTilAzimuthCheck({ index: polygonLength, check: true }));
    }
    if (checkedIndex[polygonLength] === undefined) {
      dispatch(setTilEdgeCheck({ index: polygonLength, check: "PVangle" }));
    }
  }, [polygons.length]);
  // Your fetchElevations function
  const fetchElevations = async () => {
    const PolygonsLength = polygons?.length - 1;
    if (polygons[PolygonsLength]?.length === 4) {
      // for (let z = 0; z < ; z++) {
      try {
        const elevations: number[] = [];
        // set the azimuth and elevation check by default
        // ---------------------
        for (let i = 0; i < polygons[PolygonsLength]?.length; i++) {
          const point = polygons[PolygonsLength][i];
          const response = await api.getElevation(point.lat, point.lng);
          const elevation = response.data[0]?.results[0]?.elevation ?? null;
          elevations.push(elevation);
        }
        if (elevations.length === 4) {
          setPointElevations((prevElevations) => {
            const newElevations = [...prevElevations];
            newElevations[PolygonsLength] = elevations;
            return newElevations;
          });
        }

        // Calculate the average elevation
        const totalElevation = elevations.reduce(
          (acc, elevation) => acc + elevation,
          0
        );
        const AverageElevation = totalElevation / elevations.length;
        if (checkedElevation[PolygonsLength]) {
          dispatch(
            settiltedAverageElevation({
              index: PolygonsLength,
              elevation: AverageElevation.toFixed(1),
            })
          );
        }
      } catch (error) {
        console.error("Error fetching elevations:", error);
        toast.error("Error fetching elevations:");
        dispatch(
          settiltedAverageElevation({
            index: PolygonsLength,
            elevation: null,
          })
        );
      }
    }
  };
  // };
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    const delayedFetch = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        fetchElevations();
      }, 300); // 1 second delay
    };

    delayedFetch(); // Initial call on component mount

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [polygons, checkedElevation]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    const delayedFetch = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleDonePolygon();
      }, 300); // 1 second delay
    };
    if (pointElevations[pointElevations.length - 1] != undefined) {
      delayedFetch(); // Initial call on component mount
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [pointElevations, checkedAzimuth, tiltedLowerHeight, tiltedUpperHeight]);

  // To delete the polygon and all the data to the related polygon that store in localStorage or redux state
  const handleDeletePolygon = (index: number) => {
    dispatch(deletePolygon(index));
    dispatch(deletePolygonHeights({ index }));
    dispatch(deleteTiltedSwap({ index }));
    dispatch(removeTiltedAverageElevation({ index }));
    dispatch(deleteTiltedAzimuthValue({ index }));
    // const azimuthDataArray = localStorage.getItem("AzimuthDataArray");
    // if (azimuthDataArray) {
    //   const parsedData = JSON.parse(azimuthDataArray);
    //   parsedData.splice(index, 1);
    //   localStorage.setItem("AzimuthDataArray", JSON.stringify(parsedData));
    // }
    dispatch(deleteTiltedchecked({ index }));
    dispatch(removeSlopeArea(index));
    pointElevations.splice(index, 1);
  };

  // Function to calculate the upper and lower distance
  useEffect(() => {
    const calculateUpperLowerEdgeDistance = async () => {
      const newLength: number[] = [];

      polygons.forEach((coordSet: string | any[]) => {
        if (coordSet.length === 4) {
          // Calculate midpoint of upper edge
          const upperEdgeMidpoint = {
            lat: (coordSet[0].lat + coordSet[1].lat) / 2,
            lng: (coordSet[0].lng + coordSet[1].lng) / 2,
          };
          // Calculate midpoint of lower edge
          const lowerEdgeMidpoint = {
            lat: (coordSet[2].lat + coordSet[3].lat) / 2,
            lng: (coordSet[2].lng + coordSet[3].lng) / 2,
          };

          // Calculate distance between midpoints
          const length =
            google?.maps?.geometry?.spherical.computeDistanceBetween(
              new google.maps.LatLng(
                lowerEdgeMidpoint.lat,
                lowerEdgeMidpoint.lng
              ),
              new google.maps.LatLng(
                upperEdgeMidpoint.lat,
                upperEdgeMidpoint.lng
              )
            );
          newLength.push(length);
        }
      });

      setLength(newLength);
    };

    calculateUpperLowerEdgeDistance();
  }, [polygons]);

  const calculateSlope = (index: number) => {
    if (length[index]) {
      const heightDifference =
        Number(tiltedUpperHeight[index]) - Number(tiltedLowerHeight[index]);
      const ratio = heightDifference / length[index];
      const angleRad = Math.atan(ratio);
      const angle = Number((angleRad * (180 / Math.PI)).toFixed(1));
      dispatch(addSlopeArea({ index, value: angle }));
      return angle;
    }
  };
  const calculateUpperEdge = (index: number) => {
    const angleInDegrees = slopeArea[index];
    const angleInRadians = angleInDegrees * (Math.PI / 180);
    const tanValue = Math.tan(angleInRadians) * length[index];
    const upperHeight = Number(tiltedLowerHeight[index]) + Number(tanValue);
    const floatValue = Number(upperHeight.toFixed(1));
    dispatch(setTiltedUpperHeight({ index, floatValue }));
    return floatValue;
  };

  const calculateLowerEdge = (index: number) => {
    const angleInDegrees = slopeArea[index];
    const angleInRadians = angleInDegrees * (Math.PI / 180);
    const tanValue = Math.tan(angleInRadians) * length[index];
    const lowerFloatValue = Number(tiltedUpperHeight[index] - tanValue).toFixed(
      1
    );
    dispatch(setTiltedLowerHeight({ index, lowerFloatValue }));
    return lowerFloatValue;
  };

  useEffect(() => {
    if (checkedIndex[selectedValueIndex] === "PVangle") {
      calculateSlope(selectedValueIndex);
    } else if (checkedIndex[selectedValueIndex] === "lowerEdge") {
      calculateLowerEdge(selectedValueIndex);
    } else if (checkedIndex[selectedValueIndex] === "upperEdge") {
      calculateUpperEdge(selectedValueIndex);
    }
  }, [
    tiltedUpperHeight[selectedValueIndex],
    tiltedLowerHeight[selectedValueIndex],
    slopeArea[selectedValueIndex],
    length[selectedValueIndex],
    checkedIndex[selectedValueIndex],
  ]);

  const toggleDropdown = (index: number) => {
    const newDropdownState = [...isDropdownExpanded];
    newDropdownState[index] = !newDropdownState[index];
    setIsDropdownExpanded(newDropdownState);
  };

  const calculateTheEdgeLength = (
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ) => {
    const length = google?.maps?.geometry?.spherical.computeDistanceBetween(
      new google.maps.LatLng(coord1?.lat, coord1?.lng),
      new google.maps.LatLng(coord2?.lat, coord2?.lng)
    );
    return length.toFixed(1);
  };

  const tooltip = (
    <Tooltip id="tooltip">
      <small>
        The tilt angle describes the inclination angle of the PV area.
      </small>
    </Tooltip>
  );

  const Azimuthtooltip = (
    <Tooltip id="tooltip">
      <small>
        The azimuth describes the orientation of the PV area using a 360°
        reference system: 0° = North, 90° = East, 180° = South, 270° = West.
        When auto-calculate is active, the azimuth is derived from the drawing.
        ‌
      </small>
    </Tooltip>
  );

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
  console.log(tiltedLowerHeight[0], tiltedUpperHeight[0]);
  const oneDigitAfterPoint = (enterValue: string) => {
    let value = enterValue;
    if (value.includes(".")) {
      const parts = value.split(".");
      if (parts[1].length > 1) {
        value = `${parts[0]}.${parts[1].slice(0, 1)}`;
        return value;
      }
    }
    return value;
  };

  useEffect(() => {
    if (polygons.length > 0 && polygons.length >= polygonIndexLength) {
      setIsDropdownExpanded((prev) => [
        ...new Array(polygons.length - 1).fill(false),
        true,
      ]);
      setPolygonIndexLength(polygons.length);
    }
  }, [polygons.length]);
  return (
    <div>
      {polygons.length < 1 &&
        (selectedArea?.value == "tilted" ||
          selectedArea?.value == "tiltedTab") && (
          <div className="tiltedNothingToShow">
            <div>
              <Image
                src={AddTiledPvArea}
                alt="addTiltedPVarea"
                loading="lazy"
              />
              <strong>Add tilted PV area</strong>
              <small>
                Optimal for both <span> rooftop </span> and
                <span> ground-mounted </span>solar panel setups. Simply mark the
                area by outlining a rectangle on the map and providing the
                required parameters.
              </small>
            </div>
          </div>
        )}
      {polygons.length > 0 &&
        (selectedArea?.value == "tilted" ||
          selectedArea?.value == "tiltedTab") && (
          <div style={{ height: "75vh", overflowY: "auto", width: "100%" }}>
            {polygons.map((polygonData, index) => {
              return (
                <div className="tiltedPVarea mb-2" key={`tiltedPoints${index}`}>
                  <Accordion
                    className="w-100"
                    activeKey={isDropdownExpanded[index] ? `${index}` : null}
                  >
                    <Accordion.Item eventKey={`${index}`}>
                      <Accordion.Header onClick={() => toggleDropdown(index)}>
                        <p className="projectName my-auto">
                          {" "}
                          {`TPV - ${index + 1}`} &nbsp; |
                          {/* <FaRegEye size={17} color="#2F3F50" />  */}
                          <MdDeleteOutline
                            size={17}
                            color="red"
                            className="mb-1"
                            onClick={() => handleDeletePolygon(index)}
                          />{" "}
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
                        {/* <Dropdown.Menu className="w-100 p-3 dropdownMenu"> */}
                        <div className="d-flex justify-content-between align-items-center">
                          <p className="m-0">
                            Area dimensions{" "}
                            {/* <IoInformationCircleOutline
                            color="#0984E3"
                            size={20}
                          /> */}
                          </p>
                          {/* <small>Clear All</small> */}
                        </div>

                        <div className="d-flex justify-content-between mt-1">
                          <div className="coolinput">
                            <label htmlFor="input" className="text">
                              Upper edge length [m]:
                            </label>
                            <input
                              onChange={() => {}}
                              readOnly
                              type="text"
                              name=" input"
                              className="input disabledInput"
                              value={calculateTheEdgeLength(
                                polygonData[0],
                                polygonData[1]
                              )}
                            />
                          </div>

                          <div className="coolinput">
                            <label htmlFor="input" className="text">
                              Lower edge length [m]:
                            </label>
                            <input
                              onChange={() => {}}
                              readOnly
                              type="text"
                              name=" input"
                              className="input disabledInput"
                              value={calculateTheEdgeLength(
                                polygonData[2],
                                polygonData[3]
                              )}
                            />
                          </div>
                        </div>
                        <div className="coolinput mt-3">
                          <label
                            htmlFor="input"
                            className="text"
                            style={{ fontSize: "12px", marginBottom: "7px" }}
                          >
                            Distance between upper/lower edge [m]:
                          </label>
                          <input
                            // style={{width:"185px"}}
                            readOnly
                            type="text"
                            name="input"
                            className="input disabledInput"
                            value={`${length[index]?.toFixed(1)}`}
                          />
                        </div>
                        <p className="m-0 mt-4">
                          Altitude parameters{" "}
                          {/* <IoInformationCircleOutline color="#0984E3" size={20} /> */}
                        </p>
                        <div className="d-flex justify-content-between mt-1">
                          <div className="coolinput">
                            <label
                              style={{ color: "#109F0B" }}
                              htmlFor="input"
                              className="text"
                            >
                              Upper edge height [m]:
                            </label>
                            <input
                              type="number"
                              name="input"
                              disabled={
                                checkedIndex[index] === "upperEdge"
                                  ? true
                                  : false
                              }
                              className={
                                checkedIndex[index] === "upperEdge"
                                  ? "disabledInput input"
                                  : "input"
                              }
                              onFocus={() => setSelectedValueIndex(index)}
                              onChange={(e) => {
                                const updatedValue = oneDigitAfterPoint(
                                  e.target.value
                                );
                                if (
                                  Number(updatedValue) <
                                  Number(tiltedLowerHeight[index])
                                ) {
                                  toast.error(
                                    "Upper edge height must be greater than lower edge height"
                                  );
                                }
                                dispatch(
                                  setTiltedUpperHeight({
                                    index,
                                    floatValue:
                                      updatedValue === "" ? null : updatedValue,
                                  })
                                );
                                // }
                              }}
                              value={
                                tiltedUpperHeight[index] === null
                                  ? " "
                                  : tiltedUpperHeight[index]
                              }
                            />
                            <div className="d-flex align-items-center">
                              <Form.Check
                                id="upperEdge"
                                onClick={() => {
                                  handleCheckboxChange("upperEdge", index);
                                }}
                                checked={
                                  checkedIndex[index] === "upperEdge"
                                    ? true
                                    : false
                                }
                                className="m-0 p-0"
                                style={{ outline: "none", boxShadow: "none" }}
                                aria-label="option 1"
                              />
                              <label
                                htmlFor="upperEdge"
                                className="ms-2"
                                style={{ fontSize: "12px", color: "#858585 " }}
                              >
                                Auto-calculate
                              </label>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between">
                            <div className="coolinput">
                              <label
                                style={{ color: "#EA0303" }}
                                htmlFor="input"
                                className="text"
                              >
                                Lower edge height [m]:
                              </label>
                              <input
                                type="number"
                                name="input"
                                disabled={
                                  checkedIndex[index] === "lowerEdge"
                                    ? true
                                    : false
                                }
                                onFocus={() => setSelectedValueIndex(index)}
                                className={
                                  checkedIndex[index] === "lowerEdge"
                                    ? "disabledInput input"
                                    : "input"
                                }
                                onChange={(e) => {
                                  const value = oneDigitAfterPoint(
                                    e.target.value
                                  );
                                  if (
                                    Number(tiltedUpperHeight[index]) <
                                    Number(value)
                                  ) {
                                    toast.error(
                                      "Upper edge height must be greater than lower edge height"
                                    );
                                  }
                                  dispatch(
                                    setTiltedLowerHeight({
                                      index,
                                      lowerFloatValue:
                                        value === "" ? null : value,
                                    })
                                  );
                                }}
                                value={
                                  tiltedLowerHeight[index] === null
                                    ? ""
                                    : tiltedLowerHeight[index]
                                }
                              />
                              <div className="d-flex align-items-center">
                                <Form.Check
                                  id="lowerEdge"
                                  onChange={() => {
                                    handleCheckboxChange("lowerEdge", index);
                                  }}
                                  checked={
                                    checkedIndex[index] === "lowerEdge"
                                      ? true
                                      : false
                                  }
                                  className="shadow-none no-outline outline-0"
                                  style={{
                                    margin: "0px",
                                    lineHeight: "0px",
                                    padding: "0px",
                                  }}
                                  aria-label="option 1"
                                />
                                <label
                                  htmlFor="lowerEdge"
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
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="coolinput">
                            <label htmlFor="input" className="text">
                              Ground elevation [m]:
                            </label>
                            <input
                              type="number"
                              name="input "
                              step="0.1"
                              className={
                                checkedElevation[index]
                                  ? "disabledInput input"
                                  : "input"
                              }
                              disabled={checkedElevation[index] ? true : false}
                              onChange={(e) => {
                                const value = oneDigitAfterPoint(
                                  e.target.value
                                );
                                dispatch(
                                  settiltedAverageElevation({
                                    index,
                                    elevation: value === "" ? null : value,
                                  })
                                );
                              }}
                              value={
                                averageElevation[index] === null
                                  ? ""
                                  : averageElevation[index]
                              }
                            />
                          </div>

                          <OverlayTrigger
                            placement="top"
                            overlay={groundElevationTooltip}
                          >
                            <Button variant="none" className="mt-3 p-0">
                              <IoInformationCircleOutline
                                color="#0984E3"
                                size={20}
                              />
                            </Button>
                          </OverlayTrigger>
                        </div>
                        <div className="d-flex align-items-center ">
                          <Form.Check
                            checked={checkedElevation[index]}
                            onChange={(e) => {
                              dispatch(
                                setTilElevationCheck({
                                  index: index,
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
                        <div className="default mt-4">
                          <div className="d-flex justify-content-between align-items-center px-2 pt-2">
                            <p className="m-0 defaultText">
                              {swapChecked[index] ? "swaped" : "default"}
                            </p>
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={swapChecked[index]}
                                onChange={(e) => {
                                  const upperEdge1 = polygonData[0];
                                  const upperEdge2 = polygonData[1];
                                  const lowerEdge1 = polygonData[2];
                                  const lowerEdge2 = polygonData[3];
                                  const newPolygonData = [
                                    { ...lowerEdge1 },
                                    { ...lowerEdge2 },
                                    { ...upperEdge1 },
                                    { ...upperEdge2 },
                                  ];

                                  dispatch(
                                    addTiltedPolygon({
                                      index,
                                      tiltedPolygon: newPolygonData,
                                    })
                                  );
                                  dispatch(
                                    setTiltedSwap({
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
                            Swap PV area edges :
                          </strong>
                        </div>

                        <p className="m-0 mt-4">
                          Angle parameters &nbsp;
                          {/* <IoInformationCircleOutline color="#0984E3" size={20} /> */}
                        </p>
                        <div>
                          <div>
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
                                      addSlopeArea({
                                        index,
                                        value: value === "" ? null : value,
                                      })
                                    );
                                    // }
                                  }}
                                  type="number"
                                  name="input"
                                  onFocus={() => setSelectedValueIndex(index)}
                                  disabled={
                                    checkedIndex[index] === "PVangle"
                                      ? true
                                      : false
                                  }
                                  className={
                                    checkedIndex[index] === "PVangle"
                                      ? "disabledInput input"
                                      : "input"
                                  }
                                  value={
                                    slopeArea[index] === null
                                      ? ""
                                      : slopeArea[index]
                                  }
                                />
                              </div>
                              <OverlayTrigger placement="top" overlay={tooltip}>
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
                                id="PVangle"
                                checked={
                                  checkedIndex[index] === "PVangle"
                                    ? true
                                    : false
                                }
                                onChange={() => {
                                  handleCheckboxChange("PVangle", index);
                                }}
                              />
                              <label
                                htmlFor="PVangle"
                                className="ms-2"
                                style={{ fontSize: "12px", color: "#858585 " }}
                              >
                                Auto-calculate
                              </label>
                            </div>
                          </div>
                          <div>
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
                                      setTiltedAzimutyhValue({
                                        index,
                                        azimuth: value === "" ? null : value,
                                      })
                                    );
                                  }}
                                  type="number"
                                  name="input"
                                  disabled={checkedAzimuth[index]}
                                  className={
                                    checkedAzimuth[index]
                                      ? "disabledInput input"
                                      : "input"
                                  }
                                  placeholder={
                                    checkedAzimuth[index] === true
                                      ? "Provide height data first"
                                      : ``
                                  }
                                  value={
                                    tiltedAzimuth[index] != null
                                      ? tiltedAzimuth[index]
                                      : " "
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
                                    setTilAzimuthCheck({
                                      index: index,
                                      check: e.target.checked,
                                    })
                                  );
                                }}
                              />
                              <label
                                htmlFor="PVangle"
                                className="ms-2"
                                style={{ fontSize: "12px", color: "#858585 " }}
                              >
                                Auto-calculate
                              </label>
                            </div>
                          </div>
                        </div>
                        {/* </Dropdown.Menu>
                </Dropdown> */}
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

export default TiltedPvAreaPage;
