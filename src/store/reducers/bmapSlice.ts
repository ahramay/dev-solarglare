// bmapSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
interface LatLng {
  lat: number;
  lng: number;
}

interface PolygonData {
  CalculateGlare: { percentage: number };
  tiltedSwap: boolean[] ;
  verticalSwap: boolean[];
  simulationParameter: {
    grid_width: number;
    resolution: number;
    sun_elevation_threshold: number;
    beam_spread: number;
    sun_angle: number;
    sun_reflection_threshold: number;
    intensity_threshold: number;
    moduleType: number;
  };
  verticalElevationChecked: boolean[];
  verticalAzimuthChecked: boolean[];
  tiltedAzimuthChecked: boolean[];
  tiltedEdgeChecked: any[];
  verticalAverageElevation: number[];
  verticalAzimuthValue: number[];
  tiltedAzimuthValue: number[];
  showTiltedTooltip: boolean;
  showVerticalTooltip: boolean;
  excludeArea: LatLng[][];
  tiltedlowerHeights: any[];
  tiltedAverageElevation: number[];
  detectionPointsHeight: number[];
  slopeArea: any[];
  verticalSlopeArea: any[];
  verticalLowerHeight: any[];
  verticalUpperHeight: any[];
  tiltedupperHeights: any[];
  tiltedIntersection: boolean;
  polygons: { lat: number; lng: number; isUpperEdgePoint?: boolean }[][];
  verticalPolygons: {
    lat: number;
    lng: number;
    isUpperEdgePoint?: boolean;
  }[][];
  detectionPoints: { lat: number; lng: number }[][];
  mapScreenShotUrl: string;
  rulerLines: {
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
  }[];

  tiltedPolygons: { lat: number; lng: number; isUpperEdgePoint?: boolean }[][];
  tiltedElevationChecked: boolean[];
  options: any;
  center: { lat: number; lng: number };
  updateTiltedPolygon: any[];
  key: number;
  zoom: number;
  tilt: number;
  selectedLine: { value: any; type: string } | null;
  selectedValue: {
    value: any;
    type: string;
    index: number;
    distance: any;
  } | null;
  selectedArea: { value: any } | null;
  selectedLowerValues: { value: any; type: string; index: number } | null;
  selectedPolygonIndex: number | null;
  polygonDetails: {
    area: number;
    width: number;
    height: number;
    latLng: { lat: number; lng: number } | null;
  };
  elevationData: {
    [x: string]: any;
    lat: number;
    lng: number;
    elevation: number;
  }[];
}

const initialState: PolygonData = {
  tiltedAzimuthValue: [],
  tiltedEdgeChecked: [],
  simulationParameter: {
    grid_width: 1,
    resolution: 1,
    sun_elevation_threshold: 5,
    beam_spread: 5,
    sun_angle: 0.5,
    sun_reflection_threshold: 10,
    intensity_threshold: 30000,
    moduleType: 1,
  },
  verticalElevationChecked: [],
  verticalAzimuthChecked: [],
  tiltedElevationChecked: [],
  tiltedIntersection: false,
  verticalUpperHeight: [],
  excludeArea: [],
  tiltedAzimuthChecked: [],
  showTiltedTooltip: false,
  showVerticalTooltip: false,
  tiltedAverageElevation: [],
  verticalLowerHeight: [],
  slopeArea: [],
  verticalSlopeArea: [],
  CalculateGlare: {
    percentage: 0,
  },
  mapScreenShotUrl: "",
  tiltedSwap: [],
  verticalSwap: [],
  verticalAverageElevation: [],
  verticalAzimuthValue: [],
  polygons: [],
  tiltedupperHeights: [],
  detectionPointsHeight: [],
  tiltedlowerHeights: [],
  updateTiltedPolygon: [],
  verticalPolygons: [],
  detectionPoints: [],
  rulerLines: [],
  tiltedPolygons: [],
  elevationData: [],
  options: {
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
  },
  selectedLine: null,
  selectedValue: null,
  selectedArea: null,
  selectedLowerValues: null,
  selectedPolygonIndex: null,
  center: { lat: 48.08728745409168, lng: 11.566058110369891 },
  key: Date.now(),
  zoom: 20,
  tilt: 0,
  polygonDetails: {
    area: 0,
    width: 0,
    height: 0,
    latLng: null,
  },
};

const bmapSlice = createSlice({
  name: "bmap",
  initialState,
  reducers: {
    setElevationData: (
      state: { elevationData: any[] },
      action: PayloadAction<{
        index: number;
        elevationData: { lat: number; lng: number; elevation: number }[];
      }>
    ) => {
      const { index, elevationData } = action.payload;
      state.elevationData[index] = elevationData;
    },
    addExcludeArea: (
      state,
      action: PayloadAction<{ index: number; latlng: LatLng }>
    ) => {
      const { index, latlng } = action.payload;
      const updatedExcludeArea = [...state.excludeArea];
      if (!updatedExcludeArea[index]) {
        updatedExcludeArea[index] = [];
      }
      updatedExcludeArea[index].push(latlng);
      state.excludeArea = updatedExcludeArea;
    },
    deleteExcludeArea: (state, action: PayloadAction<{ index: number }>) => {
      const { index } = action.payload;
      const updatedExcludeArea = [...state.excludeArea];

      if (index >= 0 && index < updatedExcludeArea.length) {
        updatedExcludeArea.splice(index, 1); // Remove the element at the specified index
      }

      state.excludeArea = updatedExcludeArea;
    },
    removeExcludeArea: (state) => {
      state.excludeArea = [];
    },
    setMapCenter: (
      state: { center: any },
      action: PayloadAction<{ lat: number; lng: number }>
    ) => {
      state.center = action.payload;
    },
    setZoomLevel: (state: { zoom: any }, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    setTiltLevel: (state: { tilt: any }, action: PayloadAction<number>) => {
      state.tilt = action.payload;
    },
    addVerticalPolygon: (
      state: { verticalPolygons: any[]; verticalSlopeArea: number[] },
      action: PayloadAction<{
        index: number;
        verticalPolygon: { lat: number; lng: number }[];
      }>
    ) => {
      const { index, verticalPolygon } = action.payload;
      state.verticalPolygons[index] = verticalPolygon;
      state.verticalSlopeArea[index] = 90;
    },
    addVerticalSlopeArea: (state, action) => {
      const { index, value } = action.payload;
      const newSlope = [...state.verticalSlopeArea];
      newSlope[index] = value;
      return {
        ...state,
        verticalSlopeArea: newSlope,
      };
    },
    setTiltedPVIntersection: (state, action) => {
      const { value } = action.payload;
      state.tiltedIntersection = value;
    },
    removeVerticalSlopeArea: (state, action: PayloadAction<number>) => {
      const indexToRemove = action.payload;
      state.verticalSlopeArea.splice(indexToRemove, 1);
    },
    removeVerticalPolygon: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      const updatedVerticalPolygons = [...state.verticalPolygons];

      if (index >= 0 && index < updatedVerticalPolygons.length) {
        updatedVerticalPolygons.splice(index, 1);
        state.verticalPolygons = updatedVerticalPolygons;
      }
    },
    addSlopeArea: (state, action) => {
      const { index, value } = action.payload;
      const newSlope = [...state.slopeArea];
      newSlope[index] = value;
      return {
        ...state,
        slopeArea: newSlope,
      };
    },
    setTilElevationCheck: (state, action) => {
      const { index, check } = action.payload;
      const checked = [...state.tiltedElevationChecked];
      checked[index] = check;
      return {
        ...state,
        tiltedElevationChecked: checked,
      };
    },
    setTilAzimuthCheck: (state, action) => {
      const { index, check } = action.payload;
      const checked = [...state.tiltedAzimuthChecked];
      checked[index] = check;
      return {
        ...state,
        tiltedAzimuthChecked: checked,
      };
    },
    setVerticalElevationCheck: (state, action) => {
      const { index, check } = action.payload;
      const checked = [...state.verticalElevationChecked];
      checked[index] = check;
      return {
        ...state,
        verticalElevationChecked: checked,
      };
    },
    setVerticalAzimuthCheck: (state, action) => {
      const { index, check } = action.payload;
      const checked = [...state.verticalAzimuthChecked];
      checked[index] = check;
      return {
        ...state,
        verticalAzimuthChecked: checked,
      };
    },
    setTilEdgeCheck: (state, action) => {
      const { index, check } = action.payload;
      const checked = [...state.tiltedEdgeChecked];
      checked[index] = check;
      return {
        ...state,
        tiltedEdgeChecked: checked,
      };
    },
    removeSlopeArea: (state, action: PayloadAction<number>) => {
      const indexToRemove = action.payload;
      state.slopeArea.splice(indexToRemove, 1);
    },
    addDetectionPoints: (
      state: { detectionPoints: any[] },
      action: PayloadAction<{
        index: number;
        detectionPoints: { lat: number; lng: number }[];
      }>
    ) => {
      const { index, detectionPoints } = action.payload;
      state.detectionPoints[index] = detectionPoints;
    },
    removeDetectionPoint: (state, action) => {
      state.detectionPoints.splice(action.payload, 1);
    },
    addRulerLine: (
      state: {
        rulerLines: {
          start: { lat: number; lng: number };
          end: { lat: number; lng: number };
        }[];
      },
      action: PayloadAction<{
        index: number;
        rulerLine: { lat: number; lng: number; type: string }[];
      }>
    ) => {
      const { index, rulerLine } = action.payload;
      const newRulerLine = {
        start: {
          lat: rulerLine[0]?.lat,
          lng: rulerLine[0]?.lng,
        },
        end: {
          lat: rulerLine[1]?.lat,
          lng: rulerLine[1]?.lng,
        },
      };

      state.rulerLines[index] = newRulerLine;
    },

    removeRulerLine: (state) => {
      // const index = action.payload;
      // if (index >= 0 && index + 1 < state.rulerLines.length) {
      state.rulerLines = [];
      // }
    },
    // removeRulerLine: (state, action: PayloadAction<number>) => {
    //   const index = action.payload;
    //   if (index >= 0 && index + 1 < state.rulerLines.length) {
    //     state.rulerLines.splice(index, 2);
    //   }
    // },
    setVeticalAverageElevation: (state, action) => {
      const { value, index } = action.payload;
      const newValue = [...state.verticalAverageElevation];
      newValue[index] = value;
      return {
        ...state,
        verticalAverageElevation: newValue,
      };
    },
    removeVerticalAvgElevation: (state, action) => {
      const { index } = action.payload;
      state.verticalAverageElevation.slice(index, 1);
    },
    addPolygon: (
      state: { polygons: any[] },
      action: PayloadAction<{ polygon: { lat: number; lng: number }[] }>
    ) => {
      state.polygons.push(action.payload.polygon);
    },
    addTiltedPolygon: (
      state: { tiltedPolygons: any[] },
      action: PayloadAction<{
        index: number;
        tiltedPolygon: { lat: number; lng: number }[];
      }>
    ) => {
      const { index, tiltedPolygon } = action.payload;
      state.tiltedPolygons[index] = tiltedPolygon;
    },

    updateTiltedPolygon: (state, action) => {
      const { polygonIndex, markerIndex, newCoords } = action.payload;

      // Make a copy of the state's tiltedPolygons array
      const updatedPolygons = [...state.tiltedPolygons];

      // Update the specified polygon's coordinates
      updatedPolygons[polygonIndex] = updatedPolygons[polygonIndex].map(
        (coord, coordIndex) => (coordIndex === markerIndex ? newCoords : coord)
      );

      // Return the updated state
      return { ...state, tiltedPolygons: updatedPolygons };
    },
    CalculateGlare: (state, action: PayloadAction<{ percentage: number }>) => {
      const { percentage } = action.payload;
      state.CalculateGlare.percentage = percentage;
    },
    setTiltedSwap: (state, action) => {
      const { index, checked } = action.payload;
      const newChecked = [...state.tiltedSwap];
      newChecked[index] = checked;
      return {
        ...state,
        tiltedSwap: newChecked,
      };
    },
    setVerticalSwap: (state, action) => {
      const { index, checked } = action.payload;
      const newChecked = [...state.verticalSwap];
      newChecked[index] = checked;
      return {
        ...state,
        verticalSwap: newChecked,
      };
    },
    deleteTiltedSwap: (state, action) => {
      const deleteSwap = [...state.tiltedSwap];
      deleteSwap.splice(action.payload.index, 1);
      state.tiltedSwap = deleteSwap;
    },
    deleteVerticalSwap: (state, action) => {
      const deleteSwap = [...state.verticalSwap];
      deleteSwap.splice(action.payload.index, 1);
      state.verticalSwap = deleteSwap;
    },
    setTiltedLowerHeight: (state, action) => {
      const { index, lowerFloatValue } = action.payload;
      const newHeights = [...state.tiltedlowerHeights];
      newHeights[index] = lowerFloatValue;
      return {
        ...state,
        tiltedlowerHeights: newHeights,
      };
    },
    setTiltedUpperHeight: (state, action) => {
      const { index, floatValue } = action.payload;
      const newHeights = [...state.tiltedupperHeights];
      newHeights[index] = floatValue;
      return {
        ...state,
        tiltedupperHeights: newHeights,
      };
    },
    setVerticalLowerHeight: (state, action) => {
      const { index, floatValue } = action.payload;
      const newHeights = [...state.verticalLowerHeight];
      newHeights[index] = floatValue;
      return {
        ...state,
        verticalLowerHeight: newHeights,
      };
    },
    setVerticalUpperHeight: (state, action) => {
      const { index, floatValue } = action.payload;
      const newHeights = [...state.verticalUpperHeight];
      newHeights[index] = floatValue;
      return {
        ...state,
        verticalUpperHeight: newHeights,
      };
    },
    settiltedAverageElevation: (state, action) => {
      const { index, elevation } = action.payload;
      const newElevation = [...state.tiltedAverageElevation];
      newElevation[index] = elevation;
      return {
        ...state,
        tiltedAverageElevation: newElevation,
      };
    },

    setVerticalAzimutyhValue: (state, action) => {
      const { index, azimuth } = action.payload;
      const newAzimuth = [...state.verticalAzimuthValue];
      newAzimuth[index] = azimuth;
      return {
        ...state,
        verticalAzimuthValue: newAzimuth,
      };
    },
    setTiltedAzimutyhValue: (state, action) => {
      const { index, azimuth } = action.payload;
      const newAzimuth = [...state.tiltedAzimuthValue];
      newAzimuth[index] = azimuth;
      return {
        ...state,
        tiltedAzimuthValue: newAzimuth,
      };
    },
    removeTiltedAverageElevation: (
      state,
      action: PayloadAction<{ index: number }>
    ) => {
      const tiltedAverageElevation = [...state.tiltedAverageElevation];
      tiltedAverageElevation.splice(action.payload.index, 1);
      state.tiltedAverageElevation = tiltedAverageElevation;
    },

    deleteVerticalHeights: (
      state,
      action: PayloadAction<{ index: number }>
    ) => {
      const tiltedPolygonUpperHeight = [...state.verticalUpperHeight];
      tiltedPolygonUpperHeight.splice(action.payload.index, 1);
      state.verticalUpperHeight = tiltedPolygonUpperHeight;

      const tiltedPolygonlowerHeight = [...state.verticalLowerHeight];
      tiltedPolygonlowerHeight.splice(action.payload.index, 1);
      state.verticalLowerHeight = tiltedPolygonlowerHeight;
    },
    deletePolygonHeights: (state, action: PayloadAction<{ index: number }>) => {
      const tiltedPolygonUpperHeight = [...state.tiltedupperHeights];
      tiltedPolygonUpperHeight.splice(action.payload.index, 1);
      state.tiltedupperHeights = tiltedPolygonUpperHeight;

      const tiltedPolygonlowerHeight = [...state.tiltedlowerHeights];
      tiltedPolygonlowerHeight.splice(action.payload.index, 1);
      state.tiltedlowerHeights = tiltedPolygonlowerHeight;
    },
    setScreenShotUrl: (state, action) => {
      state.mapScreenShotUrl = action.payload;
    },
    setdetectionPointsHeight: (state, action) => {
      const { index, value } = action.payload;
      const newHeights = [...state.detectionPointsHeight];
      newHeights[index] = value;
      return {
        ...state,
        detectionPointsHeight: newHeights,
      };
    },
    clearAllPolygonsAndDetectionPoints: (state) => {
      state.detectionPoints = [];
      state.detectionPointsHeight = [];
      state.verticalPolygons = [];
      state.verticalLowerHeight = [];
      state.verticalUpperHeight = [];
      state.verticalSlopeArea = [];
      state.tiltedPolygons = [];
      state.tiltedlowerHeights = [];
      state.tiltedupperHeights = [];
      state.slopeArea = [];
      state.excludeArea = [];
      state.rulerLines = [];
    },
    deletedetectionPointsHeight: (
      state,
      action: PayloadAction<{ index: number }>
    ) => {
      const updatedTiltedPolygons = [...state.detectionPointsHeight];
      updatedTiltedPolygons.splice(action.payload.index, 1);
      state.detectionPointsHeight = updatedTiltedPolygons;
    },
    deleteAzimuthValue: (state, action: PayloadAction<{ index: number }>) => {
      const updatedVerticalAzimuth = [...state.verticalAzimuthValue];
      updatedVerticalAzimuth.splice(action.payload.index, 1);
      state.verticalAzimuthValue = updatedVerticalAzimuth;
    },
    deleteTiltedAzimuthValue: (
      state,
      action: PayloadAction<{ index: number }>
    ) => {
      const updatedTltedAzimuth = [...state.tiltedAzimuthValue];
      updatedTltedAzimuth.splice(action.payload.index, 1);
      state.tiltedAzimuthValue = updatedTltedAzimuth;
    },
    deleteTiltedchecked: (state, action: PayloadAction<{ index: number }>) => {
      const tiltedElevationChecked = [...state.tiltedElevationChecked];
      tiltedElevationChecked.splice(action.payload.index, 1);
      state.tiltedElevationChecked = tiltedElevationChecked;

      const tiltedAzimuthChecked = [...state.tiltedAzimuthChecked];
      tiltedAzimuthChecked.splice(action.payload.index, 1);
      state.tiltedAzimuthChecked = tiltedAzimuthChecked;

      const tiltedEdgeChecked = [...state.tiltedEdgeChecked];
      tiltedEdgeChecked.splice(action.payload.index, 1);
      state.tiltedEdgeChecked = tiltedEdgeChecked;
    },
    deleteVerticalchecked: (
      state,
      action: PayloadAction<{ index: number }>
    ) => {
      const verticalElevationChecked = [...state.verticalElevationChecked];
      verticalElevationChecked.splice(action.payload.index, 1);
      state.verticalElevationChecked = verticalElevationChecked;

      const verticalAzimuthChecked = [...state.verticalAzimuthChecked];
      verticalAzimuthChecked.splice(action.payload.index, 1);
      state.verticalAzimuthChecked = verticalAzimuthChecked;
    },
    deletePolygon: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      const updatedTiltedPolygon = [...state.tiltedPolygons];

      if (index >= 0 && index < updatedTiltedPolygon.length) {
        updatedTiltedPolygon.splice(index, 1);
        state.tiltedPolygons = updatedTiltedPolygon;
      }
    },
    selectLine: (
      state: any,
      action: PayloadAction<{ value: any; type: string; index: number }>
    ) => {
      state.selectedPolygonIndex = action.payload.index;
      state.selectedLine = {
        value: action.payload.value,
        type: action.payload.type,
      };
    },
    selectedValues: (
      state: any,
      action: PayloadAction<{
        value: any;
        type: string;
        index: number;
        distance: any;
      }>
    ) => {
      state.selectedValue = {
        value: action.payload.value,
        type: action.payload.type,
        index: action.payload.index,
        distance: action.payload.distance,
      };
    },
    selectedArea: (state: any, action: PayloadAction<{ value: any }>) => {
      state.selectedArea = { value: action.payload.value };
    },

    selectedLowerValues: (
      state: any,
      action: PayloadAction<{ value: any; type: string; index: number }>
    ) => {
      state.selectedLowerValues = {
        value: action.payload.value,
        type: action.payload.type,
        index: action.payload.index,
      };
    },
    clearPolygons: (state: any) => {
      state.polygons = [];
      state.key = Date.now();
    },
    updatePolygon: (
      state: { polygons: { [x: string]: any } },
      action: PayloadAction<{
        index: number;
        polygon: { lat: number; lng: number }[];
      }>
    ) => {
      const { index, polygon } = action.payload;
      state.polygons[index] = polygon;
    },
    showTiltedTooltip: (state, action) => {
      state.showTiltedTooltip = action.payload;
    },
    showVerticalTooltip: (state, action) => {
      state.showVerticalTooltip = action.payload;
    },
    setSimulationParameter: (
      state,
      action: PayloadAction<{ key: string; value: string }>
    ) => {
      return {
        ...state,
        simulationParameter: {
          ...state.simulationParameter,
          [action.payload.key]: action.payload.value,
        },
      };
    },
    updatePolygonDetails: (
      state: {
        polygons: any[];
        polygonDetails: any;
        selectedPolygonIndex: number | null;
      },
      action: PayloadAction<{
        area: number;
        width: number;
        height: number;
        latLng: { lat: number; lng: number };
      }>
    ) => {
      const { area, width, height, latLng } = action.payload;
      const updatedPolygons = state.polygons.map((polygon: any[]) => {
        return polygon.map((point: any, pointIndex: number, array: any[]) => {
          const nextPointIndex = (pointIndex + 1) % array.length;

          // Check if the point is part of the upper edge
          const isUpperEdgePoint =
            state.selectedPolygonIndex !== null &&
            (pointIndex === 0 || nextPointIndex === 0);

          return {
            ...point,
            area,
            width,
            height,
            lat: latLng.lat,
            lng: latLng.lng,
            isUpperEdgePoint,
          };
        });
      });
      state.polygons = updatedPolygons;
      state.polygonDetails = action.payload;
    },
  },
});

export const {
  setMapCenter,
  setZoomLevel,
  setTiltLevel,
  selectLine,
  selectedValues,
  selectedArea,
  settiltedAverageElevation,
  removeTiltedAverageElevation,
  selectedLowerValues,
  addPolygon,
  addVerticalPolygon,
  addDetectionPoints,
  addRulerLine,
  addTiltedPolygon,
  deletePolygon,
  clearPolygons,
  updatePolygon,
  updatePolygonDetails,
  setElevationData,
  removeDetectionPoint,
  removeRulerLine,
  removeVerticalPolygon,
  deleteTiltedSwap,
  updateTiltedPolygon,
  setTiltedLowerHeight,
  setTiltedUpperHeight,
  setdetectionPointsHeight,
  setVerticalLowerHeight,
  setVerticalUpperHeight,
  CalculateGlare,
  setSimulationParameter,
  deletedetectionPointsHeight,
  deletePolygonHeights,
  deleteVerticalHeights,
  clearAllPolygonsAndDetectionPoints,
  addSlopeArea,
  removeVerticalAvgElevation,
  setVeticalAverageElevation,
  removeSlopeArea,
  setTiltedSwap,
  addVerticalSlopeArea,
  deleteTiltedAzimuthValue,
  setScreenShotUrl,
  removeVerticalSlopeArea,
  removeExcludeArea,
  deleteExcludeArea,
  setTiltedAzimutyhValue,
  addExcludeArea,
  setTiltedPVIntersection,
  showTiltedTooltip,
  setVerticalAzimutyhValue,
  deleteAzimuthValue,
  showVerticalTooltip,
  setTilElevationCheck,
  setTilAzimuthCheck,
  setVerticalElevationCheck,
  setVerticalAzimuthCheck,
  setTilEdgeCheck,
  deleteTiltedchecked,
  deleteVerticalchecked,
  deleteVerticalSwap,
  setVerticalSwap,
} = bmapSlice.actions;

export default bmapSlice.reducer;
