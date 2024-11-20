/**
 * @description      :
 * @author           :
 * @group            :
 * @created          : 17/07/2024 - 11:46:07
 *
 * MODIFICATION LOG
 * - Version         : 1.0.0
 * - Date            : 17/07/2024
 * - Author          :
 * - Modification    :
 **/
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  GoogleMap,
  Polygon,
  Marker,
  Autocomplete,
  useJsApiLoader,
  Polyline,
} from "@react-google-maps/api";
import { useLocation } from "react-router-dom";
import { db } from "../../../firebase";
import { storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import html2canvas from "html2canvas";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../store";
import {
  setMapCenter,
  setTiltLevel,
  setZoomLevel,
  selectedArea,
  addTiltedPolygon,
  addVerticalPolygon,
  addDetectionPoints,
  addRulerLine,
  updateTiltedPolygon,
  removeRulerLine,
  addExcludeArea,
  removeExcludeArea,
  setTiltedPVIntersection,
  clearAllPolygonsAndDetectionPoints,
  setdetectionPointsHeight,
  setVerticalLowerHeight,
  setVerticalUpperHeight,
  addVerticalSlopeArea,
  setTiltedUpperHeight,
  setTiltedLowerHeight,
  addSlopeArea,
  setTilElevationCheck,
  setTilAzimuthCheck,
  setTilEdgeCheck,
  setVerticalElevationCheck,
  setVerticalAzimuthCheck,
  setTiltedSwap,
  setVerticalSwap,
} from "../../../store/reducers/bmapSlice";
import type { Library } from "@googlemaps/js-api-loader";
import DetectionPointIcon from "../../../images/bxs_map-pin.png";
// import the icons ---
import { BiSolidMapPin } from "react-icons/bi";
import { PiRuler, PiExcludeSquareDuotone } from "react-icons/pi";
import { IoMdAdd } from "react-icons/io";
import { RxMagnifyingGlass } from "react-icons/rx";
import { Dropdown, DropdownItem, DropdownToggle, Image } from "react-bootstrap";
import TiltedPVAreaImage from "../../../images/tabler_solar-panel.png";
import VerticalPVAreaImage from "../../../images/Union.png";
import TiltedTooltip from "./tooltips/tiltedTooltip";
import VerticalTooltip from "./tooltips/verticalTooltip";
import { toast } from "react-toastify";
import { ClipEffect } from "html2canvas/dist/types/render/effects";
import { BsArrowsVertical } from "react-icons/bs";
// import { toast } from "react-toastify";

type Point = { x: number; y: number };
interface LatLng {
  lat: number;
  lng: number;
}

const captureAndUpload = async (id: string) => {
  const html2canvasConfiguration = {
    useCORS: true,
    backgroundColor: null,
    logging: false,
    imageTimeout: 0,
  };
  const element = document.getElementById("captureMap");
  if (!element) {
    return;
  }

  try {
    const canvas = await html2canvas(element, html2canvasConfiguration);
    localStorage.removeItem("mapImage");

    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error("Error: Unable to capture canvas or canvas is empty.");
        return;
      }

      const storageRef = ref(storage, `mapScreenshot/${id}`);
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);

      const docRef = doc(db, "projects", id);
      await updateDoc(docRef, {
        captureImage: imageUrl,
      });
      localStorage.setItem("mapImage", imageUrl);
      return imageUrl;
    }, "image/png");
  } catch (error) {
    console.error("Error capturing and uploading image:", error);
  }
};

const MapPageRender: React.FC = () => {
  const isExcludeRemove = useRef(false);
  const center = useSelector((state: RootState) => state.bmap.center);
  const bmapKey = useSelector((state: RootState) => state.bmap.key);
  const bmapZoom = useSelector((state: RootState) => state.bmap.zoom);
  const bmapTilt = useSelector((state: RootState) => state.bmap.tilt);
  const rulerLine = useSelector((state: RootState) => state.bmap.rulerLines);
  const excludeArea = useSelector((state: RootState) => state.bmap.excludeArea);
  const intersectionRef = useRef(false);
  const [initialMousePosition, setInitialMousePosition] = useState<
    any | null
  >();
  const selectedAreaType = useSelector(
    (state: RootState) => state.bmap.selectedArea?.value
  );
  const tiltedIntersection = useSelector(
    (state: RootState) => state.bmap.tiltedIntersection
  );
  const TiltedPolygon = useSelector(
    (state: RootState) => state.bmap.tiltedPolygons
  );
  const verticalPolygon = useSelector(
    (state: RootState) => state.bmap.verticalPolygons
  );
  const detectionPoints = useSelector(
    (state: RootState) => state.bmap.detectionPoints
  );
  const dispatch = useDispatch();
  const location = useLocation();
  const centerRef = useRef(center);
  const zoomRef = useRef(bmapZoom);
  const tiltRef = useRef(bmapTilt);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [clickedCoords, setClickedCoords] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [ClickedRulerPoints, setClickedRulerPoints] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [clickedTiltedCoords, setClickedTiltedCoords] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [coordinatesArray, setCoordinatesArray] = useState<LatLng[][]>([[]]);
  const [userInput, setUserInput] = useState("");
  const [showRotation, setShowRotation] = useState<number | null>();
  const [dragUpperEdge, setDragUpperEdge] = useState<boolean>(true);
  const [prevX, setPrevX] = useState(null);
  let mapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    panControl: false,
    zoomControl: true,
    disableDefaultUI: true,
    mapTypeId: "hybrid",
  };
  const libraries: Library[] = useMemo(
    () => ["drawing", "places", "geometry"],
    []
  );
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey:
      process.env.REACT_APP_GOOGLE_API_KEY ||
      "AIzaSyCTXnohcGL0e0EIUr2v4jpEOOoDMKewEaM",
    libraries: libraries,
  });
  const initialPositionRef = useRef<any>();
  const initialAngleRef = useRef<any>(null);
  const selectedPolygonForRotation = useRef<number>(0);

  const handleMouseDown = (e: any, index: number) => {
    selectedPolygonForRotation.current = index;
    initialPositionRef.current = { x: e.clientX, y: e.clientY };
    initialAngleRef.current = 0;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: any) => {
    const deltaX = e.clientX - initialPositionRef.current.x;
    const deltaY = e.clientY - initialPositionRef.current.y;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    const newAngle = angle - initialAngleRef.current;
    initialAngleRef.current = angle;
    const newCoords = rotatePolygon(
      TiltedPolygon[selectedPolygonForRotation.current],
      angle
    );

    dispatch(
      addTiltedPolygon({
        index: selectedPolygonForRotation.current,
        tiltedPolygon: newCoords,
      })
    );
  };
  const handleMouseUp = () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
  useEffect(() => {
    const getData = async () => {
      dispatch(selectedArea({ value: undefined }));
      dispatch(clearAllPolygonsAndDetectionPoints());
      const docRef = doc(db, "projects", location.state);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().calculated) {
        const data = docSnap.data();
        centerRef.current = data.mapCenter;
        console.log(data.mapCenter)
        // detection point data
        if (JSON.parse(data.detectionPoint).length > 0) {
          JSON.parse(data.detectionPoint).map((value: any, index: number) => {
            dispatch(addDetectionPoints({ index, detectionPoints: value }));
            dispatch(
              setdetectionPointsHeight({
                index,
                value: data.detectionPointHeight[index],
              })
            );
          });
        }

        //  vertical point data
        if (data.verticalPVArea) {
          JSON.parse(data.verticalPVArea)?.map((value: any, index: number) => {
            dispatch(addVerticalPolygon({ index, verticalPolygon: value }));
            dispatch(
              setVerticalLowerHeight({
                index,
                floatValue: data.verticalLowerHeight[index],
              })
            );
            dispatch(
              setVerticalUpperHeight({
                index,
                floatValue: data.verticalUpperHeight[index],
              })
            );
            dispatch(
              addVerticalSlopeArea({ index, value: data.verticalSlope[index] })
            );
            dispatch(
              setVerticalElevationCheck({
                index,
                check: data.verticalCheckedElevation[index],
              })
            );
            dispatch(
              setVerticalAzimuthCheck({
                index,
                check: data.verticalCheckedAzimuth[index],
              })
            );
            dispatch(
              setVerticalSwap({ index, checked: data.verticalSwap[index] })
            );
          });
        }
        // tilted point data
        if (data.tiltedPolygons) {
          JSON.parse(data.tiltedPolygons)?.map((value: any, index: number) => {
            dispatch(addTiltedPolygon({ index, tiltedPolygon: value }));
            dispatch(
              setTiltedUpperHeight({
                index,
                floatValue: data?.tiltedUpperHeight[index],
              })
            );
            dispatch(
              setTiltedLowerHeight({
                index,
                lowerFloatValue: data?.tiltedLowerHeight[index],
              })
            );
            dispatch(addSlopeArea({ index, value: data?.tiltedSlope[index] }));

            dispatch(
              setTilElevationCheck({
                index,
                check: data.tiltedCheckedElevation[index],
              })
            );
            dispatch(
              setTilAzimuthCheck({
                index,
                check: data.tiltedCheckedAzimuth[index],
              })
            );
            dispatch(
              setTilEdgeCheck({ index, check: data.tiltedCheckedIndex[index] })
            );
            dispatch(setTiltedSwap({ index, checked: data.tiltedSwap[index] }));
          });
        }

        // excludeArea data
        if (data.excludeArea) {
          JSON.parse(data.excludeArea).forEach((value: any, index: number) => {
            // value.map((innerArray: any) => {
            //   dispatch(addExcludeArea({ index, latlng: innerArray }));
            // });
            setCoordinatesArray((prev) => {
              const newArray = [...prev];
              newArray[index] = value;
              return newArray;
            });
          });
        }
        if (data.rulerLine) {
          data.rulerLine.map((value: any, index: number) => {
            const newPolyline = [
              {
                lat: value.start.lat,
                lng: value.start.lng,
                type: "start",
              },
              {
                lat: value.end.lat,
                lng: value.end.lng,
                type: "end",
              },
            ];
            dispatch(addRulerLine({ index, rulerLine: newPolyline }));
          });
        }
      }
    };
    getData();
  }, [location.state]);
  const handleMapDragEnd = () => {
    if (mapRef.current) {
      const newCenter = mapRef.current.getCenter();
      if (newCenter) {
        centerRef.current = { lat: newCenter.lat(), lng: newCenter.lng() };
        dispatch(setMapCenter(centerRef.current));
      }
    }
  };
  const handleZoomChange = () => {
    if (mapRef.current) {
      const newZoom = mapRef.current.getZoom();
      if (newZoom) {
        zoomRef.current = newZoom;
        dispatch(setZoomLevel(zoomRef.current));
      }
    }
  };

  useEffect(() => {
    const polyLength = TiltedPolygon?.length - 1;
    if (TiltedPolygon[polyLength]?.length == 4) {
      const lengthUpperEdge = calculateLineLength([
        TiltedPolygon[polyLength][0],
        TiltedPolygon[polyLength][1],
      ]);
      if (lengthUpperEdge <= 22.36) {
        setDragUpperEdge(true);
      } else {
        setDragUpperEdge(false);
      }
    }
  }, [TiltedPolygon]);

  const handleTiltChange = () => {
    if (mapRef.current) {
      const newTilt = mapRef.current.getTilt();
      if (newTilt) {
        tiltRef.current = newTilt;
        dispatch(setTiltLevel(newTilt));
      }
    }
  };
  const handleExcludeArea = (newCoords: { lat: number; lng: number }) => {
    if (selectedAreaType === "exclude") {
      const newArray = [...coordinatesArray];
      let currentSubArray = newArray[newArray.length - 1];
      currentSubArray?.push(newCoords);

      if (
        currentSubArray?.length > 1 &&
        currentSubArray[0]?.lat === newCoords.lat &&
        currentSubArray[0]?.lng === newCoords.lng
      ) {
        newArray.push([]);
        dispatch(selectedArea({ value: undefined }));
      }

      setCoordinatesArray(newArray);

      dispatch(
        addExcludeArea({
          index: coordinatesArray.length - 1,
          latlng: newCoords,
        })
      );
      isExcludeRemove.current = true;
    }
  };

  useEffect(() => {
    dispatch(removeExcludeArea());
    coordinatesArray.forEach((value, index) => {
      if (index >= 0) {
        for (let i = 0; i <= value.length - 1; i++) {
          dispatch(
            addExcludeArea({
              index: index,
              latlng: value[i],
            })
          );
        }
      }
    });
  }, [coordinatesArray]);

  useEffect(() => {
    if (excludeArea.length === 0 && isExcludeRemove.current) {
      setCoordinatesArray([[]]);
      isExcludeRemove.current = false;
    }
  }, [excludeArea]);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (selectedAreaType === "ruler") {
      if (event.latLng) {
        const newCoords = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        setClickedRulerPoints((prevMarkers) => [...prevMarkers, newCoords]);
      }
    }

    if (selectedAreaType === "vertical") {
      if (verticalPolygon.length <= 4) {
        if (event.latLng) {
          const newCoords = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };

          if (clickedCoords.length === 1) {
            const distance =
              google?.maps?.geometry?.spherical.computeDistanceBetween(
                new google.maps.LatLng(
                  clickedCoords[0]?.lat,
                  clickedCoords[0]?.lng
                ),
                new google.maps.LatLng(newCoords.lat, newCoords.lng)
              );
            const maxDistanceThreshold = 200;
            if (distance >= maxDistanceThreshold) {
              toast.error(
                "The length must be smaller than the threshold (500 meters square)"
              );
            } else {
              setClickedCoords((prevMarkers) => {
                return [...prevMarkers, newCoords];
              });
            }
          } else {
            setClickedCoords((prevMarkers) => {
              return [...prevMarkers, newCoords];
            });
          }
        }
      } else {
        toast.error("Vertival PV area limit exceed");
      }
    }

    if (selectedAreaType === "tilted" && event.latLng) {
      if (intersectionRef.current) {
        return toast.error("Tilted PV area is intersected");
      }
      if (TiltedPolygon.length <= 4) {
        const newCoords = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        if (
          clickedTiltedCoords.length <= 2 &&
          clickedTiltedCoords.length >= 1
        ) {
          const distance =
            google?.maps?.geometry?.spherical.computeDistanceBetween(
              new google.maps.LatLng(
                clickedTiltedCoords[clickedTiltedCoords.length - 1]?.lat,
                clickedTiltedCoords[clickedTiltedCoords.length - 1]?.lng
              ),
              new google.maps.LatLng(newCoords.lat, newCoords.lng)
            );
          const maxDistanceThreshold = 200;
          if (distance >= maxDistanceThreshold) {
            toast.error(
              "The length must be smaller than the threshold (500 meters square)"
            );
          } else {
            setClickedTiltedCoords((prevCoords) => [...prevCoords, newCoords]);
          }
        } else {
          setClickedTiltedCoords((prevCoords) => [...prevCoords, newCoords]);
        }
      } else {
        toast.error("Tilted PV area limit exceed");
      }
    }

    if (selectedAreaType === "detection") {
      if (detectionPoints.length <= 9) {
        if (event.latLng) {
          const newCoords = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };
          dispatch(
            addDetectionPoints({
              index: detectionPoints.length,
              detectionPoints: [newCoords],
            })
          );
        }
        dispatch(selectedArea({ value: "detectionTab" }));
      } else {
        toast.error("Detection point limit exceed");
      }
    }
    if (selectedAreaType === "exclude") {
      if (event.latLng) {
        const newCoords = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };

        handleExcludeArea(newCoords);
      }
      return;
    }
  };

  const calculateLineLength = (
    coord: [{ lat: number; lng: number }, { lat: number; lng: number }]
  ) => {
    const length = google?.maps?.geometry?.spherical.computeDistanceBetween(
      new google.maps.LatLng(coord[0]?.lat, coord[0]?.lng),
      new google.maps.LatLng(coord[1].lat, coord[1].lng)
    );
    return Number(length);
  };

  useEffect(() => {
    if (ClickedRulerPoints.length === 2) {
      const newPolyline = [
        {
          lat: ClickedRulerPoints[0].lat,
          lng: ClickedRulerPoints[0].lng,
          type: "start",
        },
        {
          lat: ClickedRulerPoints[1].lat,
          lng: ClickedRulerPoints[1].lng,
          type: "end",
        },
      ];
      dispatch(
        addRulerLine({ index: rulerLine.length, rulerLine: newPolyline })
      );
      setClickedRulerPoints([]);
      dispatch(selectedArea({ value: undefined }));
    }
  }, [ClickedRulerPoints]);
  useEffect(() => {
    const handleVerticalPVArea = () => {
      if (clickedCoords.length === 2) {
        const newPolyline = [
          { ...clickedCoords[0], type: "start" },
          { ...clickedCoords[1], type: "end" },
        ];
        dispatch(
          addVerticalPolygon({
            index: verticalPolygon.length,
            verticalPolygon: newPolyline,
          })
        );
        setClickedCoords([]);
        dispatch(selectedArea({ value: "verticalTab" }));
      }
    };
    handleVerticalPVArea();
  }, [clickedCoords]);

  useEffect(() => {
    const handleTiltedPVArea = () => {
      const pointsLength = clickedTiltedCoords.length;
      const [p1, p2, p3] = clickedTiltedCoords;

      if (pointsLength === 3) {
        const fourthPoint = {
          lat: p1.lat - (p2.lat - p3.lat),
          lng: p1.lng - (p2.lng - p3.lng),
        };
        setClickedTiltedCoords((prevCoords) => [...prevCoords, fourthPoint]);
      }

      if (pointsLength === 4) {
        const tiltedPolygon = clickedTiltedCoords.map(({ lat, lng }) => ({
          lat,
          lng,
        }));
        dispatch(
          addTiltedPolygon({ index: TiltedPolygon.length, tiltedPolygon })
        );
        setClickedTiltedCoords([]);
        dispatch(selectedArea({ value: "tiltedTab" }));
      }
    };
    handleTiltedPVArea();
  }, [clickedTiltedCoords]);

  const calculateRulerLength = (coords: {
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
  }) => {
    const length = google?.maps?.geometry?.spherical
      .computeDistanceBetween(
        new google.maps.LatLng(coords.start.lat, coords.start.lng),
        new google.maps.LatLng(coords.end.lat, coords.end.lng)
      )
      ?.toFixed(2);
    return length;
  };
  const handleAreaClick = (areaType: string) => {
    if (loadError) {
      return <div>Error loading Google Maps API</div>;
    }
    dispatch(selectedArea({ value: areaType }));
  };

  useEffect(() => {
    if (
      selectedAreaType === "tilted" ||
      selectedAreaType === "vertical" ||
      selectedAreaType === "ruler" ||
      selectedAreaType === "exclude" ||
      selectedAreaType === "detection"
    ) {
      mapRef.current?.setOptions({ draggableCursor: "crosshair" });
    } else {
      mapRef.current?.setOptions({ draggableCursor: "pointer" });
    }
  }, [selectedAreaType]);

  const autocompleteRef = useRef<any>(null);

  const handlePlaceSelect = () => {
    const autocomplete = autocompleteRef.current;
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place?.geometry) {
        const newCenter = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        const addressComponents = place.address_components;
        let city = "";
        for (let component of addressComponents) {
          if (component.types.includes("locality")) {
            city = component.long_name;
            setUserInput(city);
            break;
          }
        }

        // Update center and map
        centerRef.current = newCenter;
        dispatch(setMapCenter(newCenter));
        if (mapRef.current) {
          mapRef.current.panTo(newCenter);
          setTimeout(() => {
            mapRef.current && mapRef.current.setZoom(20); // Set zoom level after a delay
            zoomRef.current = 20;
            dispatch(setZoomLevel(20));
          }, 300); // Adjust delay time as needed
        }
      }
    }
  };
  // check if the polygon overlap
  function checkIfLinesIntersect(
    poly: { lat: number; lng: number }[]
  ): boolean {
    const vertices = poly.map(({ lng, lat }) => ({ x: lng, y: lat }));

    for (let i = 0; i < vertices.length; i++) {
      const line1Start = vertices[i];
      const line1End = vertices[(i + 1) % vertices.length];

      for (let j = i + 1; j < vertices.length; j++) {
        const line2Start = vertices[j];
        const line2End = vertices[(j + 1) % vertices.length];

        if (
          isLineSegmentsIntersect(line1Start, line1End, line2Start, line2End)
        ) {
          intersectionRef.current = true;
          return true;
        }
      }
    }
    intersectionRef.current = false;
    return false;
  }

  function isLineSegmentsIntersect(
    line1Start: Point,
    line1End: Point,
    line2Start: Point,
    line2End: Point
  ): boolean {
    const direction1 = direction(line2Start, line2End, line1Start);
    const direction2 = direction(line2Start, line2End, line1End);
    const direction3 = direction(line1Start, line1End, line2Start);
    const direction4 = direction(line1Start, line1End, line2End);
    return (
      ((direction1 > 0 && direction2 < 0) ||
        (direction1 < 0 && direction2 > 0)) &&
      ((direction3 > 0 && direction4 < 0) || (direction3 < 0 && direction4 > 0))
    );
  }

  function direction(point1: Point, point2: Point, point3: Point): number {
    return (
      (point3.x - point1.x) * (point2.y - point1.y) -
      (point3.y - point1.y) * (point2.x - point1.x)
    );
  }
  const handleChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setUserInput(event.target.value);
  };

  const handleEnterPress = async (e: { key: string }) => {
    if (e.key === "Enter") {
      await geocodeAddress(userInput);
    }
  };

  const geocodeAddress = async (address: string) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results: any, status) => {
      if (status === "OK") {
        const location = results[0].geometry.location;
        // autocompleteRef.current = location;
        const newCenter = {
          lat: location.lat(),
          lng: location.lng(),
        };
        let city = " ";
        const addressComponents = results[0].address_components;
        for (let component of addressComponents) {
          if (component.types.includes("locality")) {
            city = component.long_name;
            setUserInput(city);
            break;
          }
        }
        centerRef.current = newCenter;
        dispatch(setMapCenter(newCenter));
        if (mapRef.current) {
          mapRef.current.panTo(newCenter);
          setTimeout(() => {
            mapRef.current && mapRef.current.setZoom(20);
            zoomRef.current = 20;
            dispatch(setZoomLevel(20));
          }, 300);
        }
      }
    });
  };

  const calculateAdjustedCoords = (
    lat: number,
    lng: number,
    polygonIndex: number,
    index1: number,
    index2: number
  ) => {
    const directionVector = {
      lat: lat - TiltedPolygon[polygonIndex][index1].lat,
      lng: lng - TiltedPolygon[polygonIndex][index1].lng,
    };

    const refVector = {
      lat:
        TiltedPolygon[polygonIndex][index1].lat -
        TiltedPolygon[polygonIndex][index2].lat,
      lng:
        TiltedPolygon[polygonIndex][index1].lng -
        TiltedPolygon[polygonIndex][index2].lng,
    };

    const dotProduct =
      directionVector.lat * refVector.lat + directionVector.lng * refVector.lng;
    const refVectorLength = Math.sqrt(
      refVector.lat * refVector.lat + refVector.lng * refVector.lng
    );
    const projectionLength = dotProduct / refVectorLength;

    const projectionVector = {
      lat: projectionLength * (refVector.lat / refVectorLength),
      lng: projectionLength * (refVector.lng / refVectorLength),
    };

    return {
      lat: TiltedPolygon[polygonIndex][index1].lat + projectionVector.lat,
      lng: TiltedPolygon[polygonIndex][index1].lng + projectionVector.lng,
    };
  };

  // Function to calculate the centroid of a polygon
  const calculateCentroid = (polygon: any) => {
    let latSum = 0;
    let lngSum = 0;
    const numPoints = polygon.length;

    polygon.forEach((point: { lat: number; lng: number }) => {
      latSum += point.lat;
      lngSum += point.lng;
    });

    return {
      lat: latSum / numPoints,
      lng: lngSum / numPoints,
    };
  };

  const calculateCentroidofExclude = (coords: any[]) => {
    const centroid = coords.reduce(
      (acc, coord) => {
        acc.lat += coord.lat;
        acc.lng += coord.lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    return {
      lat: centroid.lat / coords.length,
      lng: centroid.lng / coords.length,
    };
  };

  const rotatePolygon = (polygon: any, angle: number) => {
    const centroid = calculateCentroid(polygon);
    const angleRad = (angle * Math.PI) / 180; // Convert angle to radians

    return polygon.map((point: { lat: number; lng: number }) => {
      const latDiff = point.lat - centroid.lat;
      const lngDiff = point.lng - centroid.lng;

      const newLat =
        centroid.lat +
        latDiff * Math.cos(angleRad) -
        lngDiff * Math.sin(angleRad);
      const newLng =
        centroid.lng +
        latDiff * Math.sin(angleRad) +
        lngDiff * Math.cos(angleRad);

      return { lat: newLat, lng: newLng };
    });
  };

  return (
    <div className="map-container">
      <TiltedTooltip />
      <VerticalTooltip />
      <section className="map-topBar">
        <Dropdown className="m-0 p-0 rulerDropdown">
          <Dropdown.Toggle
            variant="none"
            style={{ border: "none", margin: "0px", padding: "0px" }}
          >
            <div
              className={`ruler ${
                selectedAreaType === "ruler" ? "selectedMapTab" : ""
              }`}
            >
              <PiRuler size={20} />
            </div>
            <Dropdown.Menu variant="none">
              <Dropdown.Item
                onClick={() => handleAreaClick("ruler")}
                className={selectedAreaType === "ruler" ? "rulerItem" : ""}
              >
                Add Ruler
              </Dropdown.Item>

              <Dropdown.Item
                disabled={rulerLine.length > 0 ? false : true}
                onClick={() => {
                  dispatch(selectedArea({ value: undefined }));
                  dispatch(removeRulerLine());
                }}
              >
                Remove Ruler
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Toggle>
        </Dropdown>

        <Dropdown className="addPVarea">
          <Dropdown.Toggle
            variant="none"
            className="addPVareaToggle"
            id="dropdown-basic"
          >
            <div
              className={`pv-area ${
                selectedAreaType === "tilted" || selectedAreaType === "vertical"
                  ? "selectedMapTab"
                  : ""
              }`}
            >
              <IoMdAdd size={20} /> Add PV area
            </div>
          </Dropdown.Toggle>
          <Dropdown.Menu variant="none">
            <Dropdown.Item
              className={`addPVareaDropdownItems ${
                selectedAreaType === "tilted"
                  ? " addPVareaDropdownItemsActive"
                  : ""
              }`}
              onClick={() => handleAreaClick("tilted")}
            >
              <Image src={TiltedPVAreaImage} /> Tilted PV area
            </Dropdown.Item>
            <Dropdown.Item
              className={`addPVareaDropdownItems ${
                selectedAreaType === "vertical"
                  ? " addPVareaDropdownItemsActive"
                  : ""
              }`}
              onClick={() => handleAreaClick("vertical")}
            >
              <Image src={VerticalPVAreaImage} /> Vertical PV area
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <div
          className={`detection_point  ${
            selectedAreaType === "detection" ? "selectedMapTab" : ""
          }`}
          onClick={() => handleAreaClick("detection")}
        >
          <BiSolidMapPin size={20} /> Add detection point
        </div>
        <Dropdown className="excludeDropdown">
          <DropdownToggle variant="none" style={{ border: "none" }}>
            <div
              className={`exclude_area ${
                selectedAreaType === "exclude" ? "selectedMapTab" : ""
              }`}
              color="#fff"
            >
              <PiExcludeSquareDuotone size={20} /> Exclude area
            </div>
          </DropdownToggle>
          <Dropdown.Menu>
            <DropdownItem onClick={() => handleAreaClick("exclude")}>
              Add Exclude Area
            </DropdownItem>

            <DropdownItem
              disabled={excludeArea?.length > 0 ? false : true}
              onClick={() => {
                setCoordinatesArray([[]]);
                dispatch(removeExcludeArea());
              }}
            >
              Remove Exclude Area
            </DropdownItem>
          </Dropdown.Menu>
        </Dropdown>
        {isLoaded && (
          <Autocomplete
            onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
            onPlaceChanged={handlePlaceSelect}
            types={["geocode"]}
            fields={["address_components", "geometry", "formatted_address"]}
          >
            <div className="Search_on_map">
              <RxMagnifyingGlass size={20} className="searchAddresssimage" />
              <input
                className="searchAddresss"
                placeholder={`Search address`}
                value={userInput}
                onChange={handleChange}
                onKeyDown={handleEnterPress}
              />
            </div>
          </Autocomplete>
        )}
      </section>
      <div className="Google-map">
        {!isLoaded ? (
          <h1>Loading...</h1>
        ) : (
          <div id="captureMap">
            <GoogleMap
              key={bmapKey}
              mapContainerClassName="map-container"
              center={centerRef.current}
              zoom={zoomRef.current}
              mapTypeId="satellite"
              onZoomChanged={handleZoomChange}
              onTiltChanged={handleTiltChange}
              tilt={0}
              clickableIcons={false}
              onDragEnd={handleMapDragEnd}
              onClick={handleMapClick}
              onLoad={(map) => {
                mapRef.current = map;
                map.setZoom(bmapZoom);
              }}
              options={mapOptions}
            >
              {/* shows the detection points */}
              {detectionPoints.flat().map((coord, markerIndex) => {
                return (
                  <React.Fragment key={`detection-marker-${markerIndex}`}>
                    <Marker
                      position={{ lat: coord.lat, lng: coord.lng }}
                      label={{
                        text: `${markerIndex + 1}`,
                        className: "marker-label",
                      }}
                      icon={{
                        url: DetectionPointIcon,
                        scaledSize: new window.google.maps.Size(30, 30),
                      }}
                    />
                    <Marker
                      position={{ lat: coord.lat, lng: coord.lng }}
                      draggable={true}
                      cursor="crosshair"
                      onDrag={(e) => {
                        if (e.latLng) {
                          const newCoords = {
                            lat: e.latLng?.lat(),
                            lng: e.latLng?.lng(),
                          };
                          dispatch(
                            addDetectionPoints({
                              index: markerIndex,
                              detectionPoints: [newCoords],
                            })
                          );
                        }
                      }}
                      icon={{
                        url: "https://img.icons8.com/?size=20&id=BGuoJHQjQ6Qa&format=png&color=ffffff",
                        scaledSize: new google.maps.Size(20, 20),
                        anchor: new google.maps.Point(10, 25),
                      }}
                    />
                  </React.Fragment>
                );
              })}
              {/* shows the vertical polygons */}
              {verticalPolygon.map((polygonCoords, index) => {
                if (polygonCoords.length < 2) return null;

                const dx = polygonCoords[1].lng - polygonCoords[0].lng;
                const dy = polygonCoords[1].lat - polygonCoords[0].lat;

                const length = 0.000005;

                const perpDx = dy;
                const perpDy = dx;

                const magnitude = Math.sqrt(perpDx * perpDx + perpDy * perpDy);
                const unitPerpDx = (perpDx / magnitude) * length;
                const unitPerpDy = (perpDy / magnitude) * length;

                return (
                  <React.Fragment key={`polygon-${index}`}>
                    <Polyline
                      key={`polyline-${index}`}
                      path={polygonCoords.map(({ lat, lng }) => ({ lat, lng }))}
                      options={{
                        strokeColor: "#3BCC23",
                        strokeOpacity: 1,
                        zIndex: 1,
                      }}
                    />
                    {/* Green polygon on the left side */}
                    <Polygon
                      paths={[
                        {
                          lat: polygonCoords[0].lat,
                          lng: polygonCoords[0].lng,
                        },
                        {
                          lat: polygonCoords[1].lat,
                          lng: polygonCoords[1].lng,
                        },
                        {
                          lat: polygonCoords[1].lat + unitPerpDy,
                          lng: polygonCoords[1].lng - unitPerpDx,
                        },
                        {
                          lat: polygonCoords[0].lat + unitPerpDy,
                          lng: polygonCoords[0].lng - unitPerpDx,
                        },
                      ]}
                      options={{
                        strokeOpacity: 0,
                        strokeWeight: 0,
                        fillColor: "#2F3F50",
                        fillOpacity: 0.85,
                        editable: false,
                      }}
                    />
                    {/* Blue polygon on the right side */}
                    <Polygon
                      paths={[
                        {
                          lat: polygonCoords[0].lat,
                          lng: polygonCoords[0].lng,
                        },
                        {
                          lat: polygonCoords[1].lat,
                          lng: polygonCoords[1].lng,
                        },
                        {
                          lat: polygonCoords[1].lat - unitPerpDy,
                          lng: polygonCoords[1].lng + unitPerpDx,
                        },
                        {
                          lat: polygonCoords[0].lat - unitPerpDy,
                          lng: polygonCoords[0].lng + unitPerpDx,
                        },
                      ]}
                      options={{
                        strokeOpacity: 0,
                        strokeWeight: 0,
                        fillColor: "#F8AB19",
                        fillOpacity: 0.85,
                        editable: false,
                      }}
                    />
                    {polygonCoords.map((coord, markerIndex) => {
                      return (
                        <Marker
                          draggable={true}
                          onDrag={(e) => {
                            if (markerIndex === 0 && e.latLng) {
                              const newPolyline = [
                                {
                                  lat: e.latLng.lat(),
                                  lng: e.latLng.lng(),
                                  type: "start",
                                },
                                { ...polygonCoords[1] },
                              ];
                              dispatch(
                                addVerticalPolygon({
                                  index,
                                  verticalPolygon: newPolyline,
                                })
                              );
                            }
                            if (markerIndex === 1 && e.latLng) {
                              const newPolyline = [
                                { ...polygonCoords[0] },
                                {
                                  lat: e.latLng.lat(),
                                  lng: e.latLng.lng(),
                                  type: "end",
                                },
                              ];
                              dispatch(
                                addVerticalPolygon({
                                  index,
                                  verticalPolygon: newPolyline,
                                })
                              );
                            }
                          }}
                          onClick={(e) => {
                            if (e.latLng && selectedAreaType === "vertical") {
                              const newCoords = {
                                lat: e.latLng.lat(),
                                lng: e.latLng.lng(),
                              };
                              setClickedCoords((prevMarkers) => {
                                return [...prevMarkers, newCoords];
                              });
                            }
                          }}
                          key={`marker-${index}-${markerIndex}`}
                          position={coord}
                          icon={{
                            url: "https://img.icons8.com/?size=20&id=BGuoJHQjQ6Qa&format=png&color=ffffff",
                            scaledSize: new google.maps.Size(20, 20),
                            anchor: new google.maps.Point(10, 10),
                          }}
                          cursor="crosshair"
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {/* To show the ruler line on the map */}
              {rulerLine.map((coords, rulerIndex) => {
                const path = [
                  { lat: coords.start.lat, lng: coords.start.lng },
                  { lat: coords.end.lat, lng: coords.end.lng },
                ];
                return (
                  <React.Fragment key={`ruler-line-${rulerIndex}`}>
                    {/* Marker for the start point */}
                    <Marker
                      position={{
                        lat: coords.start.lat,
                        lng: coords.start.lng,
                      }}
                      icon={{
                        url: "https://img.icons8.com/?size=25&id=BGuoJHQjQ6Qa&format=png&color=ffffff",
                        scaledSize: new google.maps.Size(25, 25),
                        anchor: new google.maps.Point(12, 12),
                      }}
                      draggable={true}
                      onDrag={(e) => {
                        const startLat = e.latLng?.lat();
                        const startLng = e.latLng?.lng();
                        const endLat = coords.end.lat;
                        const endLng = coords.end.lng;

                        if (
                          typeof startLat === "number" &&
                          typeof startLng === "number" &&
                          typeof endLat === "number" &&
                          typeof endLng === "number"
                        ) {
                          const newPolyline = [
                            {
                              lat: startLat,
                              lng: startLng,
                              type: "start",
                            },
                            {
                              lat: endLat,
                              lng: endLng,
                              type: "start",
                            },
                          ];
                          dispatch(
                            addRulerLine({
                              index: rulerIndex,
                              rulerLine: newPolyline,
                            })
                          );
                        }
                      }}
                      label={{
                        text:
                          calculateRulerLength(coords).toString() + " " + "m",
                        className: "custom-marker-lable",
                      }}
                    />
                    {/* Marker for the end point */}
                    <Marker
                      position={{ lat: coords.end.lat, lng: coords.end.lng }}
                      icon={{
                        url: "https://img.icons8.com/?size=25&id=BGuoJHQjQ6Qa&format=png&color=ffffff",
                        // scaledSize: new google.maps.Size(25, 25),
                        anchor: new google.maps.Point(12, 12),
                      }}
                      draggable={true}
                      onDrag={(e) => {
                        const startLat = coords.start.lat;
                        const startLng = coords.start.lng;
                        const endLat = e.latLng?.lat();
                        const endLng = e.latLng?.lng();

                        if (
                          typeof startLat === "number" &&
                          typeof startLng === "number" &&
                          typeof endLat === "number" &&
                          typeof endLng === "number"
                        ) {
                          const newPolyline = [
                            {
                              lat: startLat,
                              lng: startLng,
                              type: "start",
                            },
                            {
                              lat: endLat,
                              lng: endLng,
                              type: "start",
                            },
                          ];
                          dispatch(
                            addRulerLine({
                              index: rulerIndex,
                              rulerLine: newPolyline,
                            })
                          );
                        }
                      }}
                    />
                    {/* Polyline */}
                    <Polyline
                      path={path}
                      options={
                        {
                          strokeColor: "#000",
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                          icons: [
                            {
                              offset: "0",
                              repeat: "20px",
                            },
                          ],
                          lineDashPattern: 170,
                          zIndex: 100,
                        } as any
                      } // Cast options to any type
                    />
                  </React.Fragment>
                );
              })}
              {ClickedRulerPoints.map((coord, markerIndex) => (
                <Marker
                  key={markerIndex}
                  position={coord}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 4,
                    fillColor: "#FFF",
                    fillOpacity: 1,
                    strokeColor: "#FFF",
                    strokeOpacity: 1,
                    strokeWeight: 1,
                  }}
                />
              ))}
              {/* To show the vertical tilted point before adding in the verticalpolygons */}
              {clickedCoords.map((coord, markerIndex) => (
                <Marker
                  key={markerIndex}
                  position={coord}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 4,
                    fillColor: "#0000FF",
                    fillOpacity: 1,
                    strokeColor: "#0000FF",
                    strokeOpacity: 1,
                    strokeWeight: 1,
                  }}
                />
              ))}
              {/* To show the tilted tilted point before adding in the tiltedPolygons */}
              {clickedTiltedCoords.map((coord, markerIndex) => {
                const coordLength = clickedTiltedCoords.length - 1;
                return (
                  <React.Fragment>
                    <Marker
                      key={markerIndex}
                      position={coord}
                      icon={
                        coordLength === 1
                          ? {
                              url: "https://img.icons8.com/?size=20&id=BGuoJHQjQ6Qa&format=png&color=ffffff",
                              // scaledSize: new google.maps.Size(25, 25),
                              // anchor: new google.maps.Point(12, 12),
                            }
                          : {
                              path: google.maps.SymbolPath.CIRCLE,
                              scale: 4,
                              fillColor: "#FFF",
                              fillOpacity: 1,
                              strokeColor: "#FFF",
                              strokeOpacity: 1,
                              strokeWeight: 1,
                            }
                      }
                      draggable={coordLength === 1 ? true : false}
                      onDrag={(e) => {
                        if (e.latLng) {
                          const newCoords = {
                            lat: e.latLng.lat(),
                            lng: e.latLng.lng(),
                          };
                          setClickedTiltedCoords((prev) => {
                            const coords = [...prev];
                            coords[markerIndex] = newCoords;
                            return coords;
                          });
                        }
                      }}
                      // label={`${markerIndex + 1}`}
                    />
                    <Polyline
                      path={clickedTiltedCoords}
                      options={{
                        strokeColor: "#fff",
                        strokeOpacity: 1,
                        strokeWeight: 2,
                        zIndex: 0,
                      }}
                    />
                  </React.Fragment>
                );
              })}
              {TiltedPolygon.map((poly, polygonIndex) => {
                const greenPath = [poly[0], poly[1]];
                // Correctly calculate the average latitude and longitude
                const averageLat = (poly[0].lat + poly[1].lat) / 2;
                const averageLng = (poly[0].lng + poly[1].lng) / 2;
                return (
                  <React.Fragment key={`fragment-${polygonIndex}`}>
                    <Polyline
                      key={`polyline-green-${polygonIndex}`}
                      path={greenPath}
                      options={{
                        strokeColor: "#00FF00", // Green color
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        zIndex: 100,
                      }}
                      onClick={(e) => {
                        if (
                          e.latLng?.lat() &&
                          e.latLng?.lng() &&
                          selectedAreaType === "ruler"
                        ) {
                          const newCoords = {
                            lat: e.latLng?.lat(),
                            lng: e.latLng?.lng(),
                          };
                          setClickedRulerPoints((prevMarkers) => [
                            ...prevMarkers,
                            newCoords,
                          ]);
                        }
                      }}
                    />
                    {showRotation === polygonIndex && (
                      <Marker
                        position={{ lat: averageLat, lng: averageLng }}
                        draggable={true}
                        onDrag={(e) => {
                          if (e.latLng?.lat() && e.latLng.lng()) {
                            const newLat = e.latLng.lat();
                            const newLng = e.latLng.lng();
                            const deltaLat = newLat - averageLat;
                            const deltaLng = newLng - averageLng;
                            const newCoord = [
                              {
                                lat: poly[0].lat + deltaLat,
                                lng: poly[0].lng + deltaLng,
                              },
                              {
                                lat: poly[1].lat + deltaLat,
                                lng: poly[1].lng + deltaLng,
                              },
                              { lat: poly[2].lat, lng: poly[2].lng },
                              { lat: poly[3].lat, lng: poly[3].lng },
                            ];
                            dispatch(
                              addTiltedPolygon({
                                index: polygonIndex,
                                tiltedPolygon: newCoord,
                              })
                            );
                          }
                        }}
                        icon={{
                          url: "https://img.icons8.com/?size=20&id=BGuoJHQjQ6Qa&format=png&color=ffffff",
                          scaledSize: new google.maps.Size(20, 20),
                          anchor: new google.maps.Point(10, 10),
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Render red polyline for points 3 and 4 */}
              {TiltedPolygon.map((poly, polygonIndex) => {
                const redPath = [poly[2], poly[3]]; // Points 3 and 4
                const averageLat = (poly[2].lat + poly[3].lat) / 2;
                const averageLng = (poly[2].lng + poly[3].lng) / 2;

                return (
                  <React.Fragment>
                    <Polyline
                      key={`polyline-red-${polygonIndex}`}
                      path={redPath}
                      options={{
                        strokeColor: "#FF0000", // Red color
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        zIndex: 100,
                      }}
                      onClick={(e) => {
                        if (
                          e.latLng?.lat() &&
                          e.latLng?.lng() &&
                          selectedAreaType === "ruler"
                        ) {
                          const newCoords = {
                            lat: e.latLng?.lat(),
                            lng: e.latLng?.lng(),
                          };
                          setClickedRulerPoints((prevMarkers) => [
                            ...prevMarkers,
                            newCoords,
                          ]);
                        }
                      }}
                    />
                    {showRotation === polygonIndex && (
                      <Marker
                        position={{ lat: averageLat, lng: averageLng }}
                        draggable={true}
                        onDrag={(e) => {
                          if (e.latLng?.lat() && e.latLng.lng()) {
                            const newLat = e.latLng.lat();
                            const newLng = e.latLng.lng();
                            const deltaLat = newLat - averageLat;
                            const deltaLng = newLng - averageLng;

                            const newCoord = [
                              { lat: poly[0].lat, lng: poly[0].lng },
                              { lat: poly[1].lat, lng: poly[1].lng },
                              {
                                lat: poly[2].lat + deltaLat,
                                lng: poly[2].lng + deltaLng,
                              },
                              {
                                lat: poly[3].lat + deltaLat,
                                lng: poly[3].lng + deltaLng,
                              },
                            ];

                            dispatch(
                              addTiltedPolygon({
                                index: polygonIndex,
                                tiltedPolygon: newCoord,
                              })
                            );
                          }
                        }}
                        icon={{
                          url: "https://img.icons8.com/?size=20&id=BGuoJHQjQ6Qa&format=png&color=ffffff",
                          scaledSize: new google.maps.Size(20, 20),
                          anchor: new google.maps.Point(10, 10),
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {TiltedPolygon.map((poly, polygonIndex) => {
                const isTilted = checkIfLinesIntersect(poly);
                const strokeColor = !isTilted ? "#000000" : "#FF0000";
                const fillColor = !isTilted ? "#000000" : "#FF0000";
                const centroid = calculateCentroid(poly);

                return (
                  <React.Fragment key={`polygon-${polygonIndex}`}>
                    <Polygon
                      onMouseOver={() => setShowRotation(polygonIndex)}
                      onMouseOut={() => setShowRotation(null)}
                      onClick={(e) => {
                        if (
                          e.latLng?.lat() &&
                          e.latLng?.lng() &&
                          selectedAreaType === "exclude"
                        ) {
                          const newCoords = {
                            lat: e.latLng?.lat(),
                            lng: e.latLng?.lng(),
                          };
                          handleExcludeArea(newCoords);
                        }
                        if (
                          e.latLng?.lat() &&
                          e.latLng?.lng() &&
                          selectedAreaType === "ruler"
                        ) {
                          const newCoords = {
                            lat: e.latLng?.lat(),
                            lng: e.latLng?.lng(),
                          };
                          setClickedRulerPoints((prevMarkers) => [
                            ...prevMarkers,
                            newCoords,
                          ]);
                        }
                      }}
                      paths={poly.map((coord) => ({
                        lat: coord.lat,
                        lng: coord.lng,
                      }))}
                      options={{
                        strokeColor: strokeColor,
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: fillColor,
                        fillOpacity: 0.35,
                      }}
                    />
                    {showRotation === polygonIndex && (
                      <Marker
                        onMouseDown={(e) => {
                          e.domEvent.stopPropagation();
                          handleMouseDown(e.domEvent, polygonIndex);
                        }}
                        position={centroid}
                        icon={{
                          url: "https://img.icons8.com/material-outlined/24/ffffff/rotate-right.png",
                          scaledSize: new google.maps.Size(25, 25),
                          anchor: new google.maps.Point(12, 12),
                        }}
                        cursor={"pointer"}
                      />
                    )}
                    {poly.map((coord, markerIndex) => (
                      <Marker
                        onMouseOver={() => setShowRotation(polygonIndex)}
                        onMouseOut={() => setShowRotation(null)}
                        key={`${polygonIndex}-${markerIndex}`}
                        position={coord}
                        draggable={showRotation === polygonIndex}
                        onDrag={(e) => {
                          dispatch(
                            setTiltedPVIntersection({
                              value: intersectionRef.current,
                            })
                          );
                          if (e.latLng) {
                            const newCoords = {
                              lat: e.latLng.lat(),
                              lng: e.latLng.lng(),
                            };
                            const adjustedCoords =
                              markerIndex <= 1
                                ? calculateAdjustedCoords(
                                    newCoords.lat,
                                    newCoords.lng,
                                    polygonIndex,
                                    0,
                                    1
                                  )
                                : calculateAdjustedCoords(
                                    newCoords.lat,
                                    newCoords.lng,
                                    polygonIndex,
                                    2,
                                    3
                                  );

                            dispatch(
                              updateTiltedPolygon({
                                polygonIndex,
                                markerIndex,
                                newCoords: adjustedCoords,
                              })
                            );
                          }
                        }}
                        onDragEnd={(e) => {
                          if (e.latLng) {
                            const newCoords = {
                              lat: e.latLng.lat(),
                              lng: e.latLng.lng(),
                            };
                            const adjustedCoords =
                              markerIndex <= 1
                                ? calculateAdjustedCoords(
                                    newCoords.lat,
                                    newCoords.lng,
                                    polygonIndex,
                                    0,
                                    1
                                  )
                                : calculateAdjustedCoords(
                                    newCoords.lat,
                                    newCoords.lng,
                                    polygonIndex,
                                    2,
                                    3
                                  );

                            dispatch(
                              updateTiltedPolygon({
                                polygonIndex,
                                markerIndex,
                                newCoords: adjustedCoords,
                              })
                            );
                          }
                        }}
                        icon={
                          showRotation === polygonIndex
                            ? {
                                url: "https://img.icons8.com/?size=24&id=98061&format=png&color=ffffff",
                                scaledSize: new google.maps.Size(25, 25),
                                anchor: new google.maps.Point(12, 12),
                              }
                            : {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 4,
                                fillColor: "#FFF",
                                fillOpacity: 1,
                                strokeColor: "#FFF",
                                strokeOpacity: 1,
                                strokeWeight: 1,
                              }
                        }
                        cursor="crosshair"
                      />
                    ))}
                  </React.Fragment>
                );
              })}

              {excludeArea.map((excludeCoord: any[], index: number) => {
                const centroid = calculateCentroidofExclude(excludeCoord);
                return (
                  <React.Fragment>
                    {excludeCoord[0]?.lat ===
                      excludeCoord[excludeCoord?.length - 1]?.lat &&
                    excludeCoord[0]?.lng ===
                      excludeCoord[excludeCoord?.length - 1]?.lng &&
                    excludeCoord.length != 1 ? (
                      <React.Fragment>
                        <Polygon
                          path={excludeCoord.map((coord) => ({
                            lat: coord.lat,
                            lng: coord.lng,
                          }))}
                          options={{
                            strokeColor: "#2D0A92",
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: "#F8AB19",
                            fillOpacity: 0.35,
                            zIndex: 1000,
                          }}
                        />
                        {excludeCoord.map((coords, coordIndex) => {
                          return (
                            <Marker
                              draggable={true}
                              onDrag={(e) => {
                                if (e.latLng?.lat() && e.latLng?.lng()) {
                                  const newCoords = {
                                    lat: e.latLng?.lat(),
                                    lng: e.latLng?.lng(),
                                  };
                                  setCoordinatesArray((prev) => {
                                    const newCoord = [...prev];
                                    if (
                                      coordIndex === 0 ||
                                      coordIndex === excludeCoord?.length - 1
                                    ) {
                                      newCoord[index][0] = newCoords;
                                      newCoord[index][
                                        excludeCoord?.length - 1
                                      ] = newCoords;
                                    } else {
                                      newCoord[index][coordIndex] = newCoords;
                                    }

                                    return newCoord;
                                  });
                                }
                              }}
                              key={`${index}-${coordIndex}`}
                              position={{ lat: coords.lat, lng: coords.lng }}
                              icon={{
                                url: "https://img.icons8.com/?size=20&id=BGuoJHQjQ6Qa&format=png&color=ffffff",
                              }}
                              cursor="crosshair"
                            />
                          );
                        })}
                        <Marker
                          draggable={true}
                          position={centroid}
                          cursor="crosshair"
                          onDrag={(e) => {
                            if (e.latLng?.lat() && e.latLng?.lng()) {
                              const newLat = e.latLng.lat();
                              const newLng = e.latLng.lng();
                              const deltaLat = newLat - centroid.lat;
                              const deltaLng = newLng - centroid.lng;

                              setCoordinatesArray((prev) => {
                                const newCoord = [...prev];
                                newCoord[index] = excludeCoord.map((coord) => ({
                                  lat: coord.lat + deltaLat,
                                  lng: coord.lng + deltaLng,
                                }));

                                return newCoord;
                              });
                            }
                          }}
                          icon={{
                            url: "https://img.icons8.com/material-outlined/24/ffffff/move.png",
                            scaledSize: new google.maps.Size(25, 25),
                            anchor: new google.maps.Point(12, 12),
                          }}
                        />
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <Polyline
                          key={index}
                          path={excludeCoord.map(
                            (coord: { lat: any; lng: any }) => ({
                              lat: coord.lat,
                              lng: coord.lng,
                            })
                          )}
                          options={{
                            strokeColor: "#FF6B00",
                            strokeOpacity: 1,
                            strokeWeight: 2,
                            zIndex: 10000,
                          }}
                        />
                        {excludeCoord.map(
                          (coords: { lat: any; lng: any }, coordIndex: any) => {
                            return (
                              <Marker
                                onClick={(e) => {
                                  if (e.latLng?.lat() && e.latLng?.lng()) {
                                    const newCoords = {
                                      lat: e.latLng?.lat(),
                                      lng: e.latLng?.lng(),
                                    };
                                    handleExcludeArea(newCoords);
                                  }
                                }}
                                cursor="crosshair"
                                key={`${index}-${coordIndex}`}
                                position={{ lat: coords.lat, lng: coords.lng }}
                                icon={{
                                  path: google.maps.SymbolPath.CIRCLE,
                                  scale: 3,
                                  fillColor: "#fff",
                                  fillOpacity: 0.5,
                                  strokeColor: "#fff",
                                  strokeOpacity: 1,
                                  strokeWeight: 1,
                                }}
                                clickable={true}
                              />
                            );
                          }
                        )}
                      </React.Fragment>
                    )}
                  </React.Fragment>
                );
              })}
            </GoogleMap>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPageRender;
export { captureAndUpload };
