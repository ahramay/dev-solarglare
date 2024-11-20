
class PolygonService {

    polygons: any[] = [];
    distance: { [key: string]: number } = {};
    selectedArea:any;
    private static instance: PolygonService | null = null;
    dispatch: any;
    private constructor() {
    }
    static getInstance(): PolygonService {
      if (!PolygonService.instance) {
        PolygonService.instance = new PolygonService();
      }
  
      return PolygonService.instance;
    }
    getArea(selectedArea: any){
      this.selectedArea = selectedArea
    }
  }

export default PolygonService;