import { useSelector } from "react-redux";
import { RootState } from "../store";
import NetworkService from "./network.service";

class detectionPoint {
    network = new NetworkService();

    polygons: any[] = [];
    distance: { [key: string]: number } = {};
    selectedArea:any;
    private static instance: detectionPoint | null = null;
    dispatch: any;
    detectionPoints = useSelector((state: RootState) => state.bmap.detectionPoints);
    private constructor() {
      this.getDirectionElevationPoints();
    }
    static getInstance(): detectionPoint {
      if (!detectionPoint.instance) {
        detectionPoint.instance = new detectionPoint();
      }
      
      return detectionPoint.instance;
    }
    
    getDirectionElevationPoints(){
      
      {this.detectionPoints.map((point: any, index: number) => {
        return point;
      })}
    }



  }
export default detectionPoint;