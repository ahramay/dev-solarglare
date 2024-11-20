import { addPolygon } from "../store/reducers/bmapSlice";

class PmapService {

    polygons: any[] = [];
    distance: { [key: string]: number } = {};

    private static instance: PmapService | null = null;
    dispatch: any;
  
    private constructor() {
    }
    getAllpolygons(polygons: any) {
        const points = polygons[0];
    
        for (let i = 0; i < points.length - 1; i++) {
          const point1 = points[i];
          const point2 = points[i + 1];
          const distance = this.haversineDistance(point1.lat, point1.lng, point2.lat, point2.lng);
          this.distance = { ...this.distance, [`Point${i + 1}`]: distance };
        }
        const lastPoint = points[points.length - 1];
        const firstPoint = points[0];
        const distanceFromLastToFirst = this.haversineDistance(lastPoint.lat, lastPoint.lng, firstPoint.lat, firstPoint.lng);
        this.distance['point4'] = distanceFromLastToFirst;
        return this.distance;
      }
     toRadians = (degrees: number): number => {
        return (degrees * Math.PI) / 180;
      };
    haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371000;
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

    static getInstance(): PmapService {
      if (!PmapService.instance) {
        PmapService.instance = new PmapService();
      }
  
      return PmapService.instance;
    }

    setPolygon(event: any): void {

    }
    getPolygon(index: number): any | null {
        return this.polygons[index] ?? null;
    }
    updateUpperEdgeLine(data: any, polygonIndex: number){
        let polygon = this.getPolygon(polygonIndex);
        const value = data;
    }




    calculatePolygonDimensions = (polygonCoords: any) => {
      const bounds = new google.maps.LatLngBounds();
      polygonCoords.forEach((item: any) => bounds.extend(new google.maps.LatLng(item.lat, item.lng)));
  
      const width = bounds.toSpan().lng();
      const height = bounds.toSpan().lat();
  
      return { width, height };
    };








  }

export default PmapService;