/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 15/10/2024 - 13:44:37
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 15/10/2024
    * - Author          : 
    * - Modification    : 
**/
import axios from "axios";
import { resolve } from "path";

class NetworkService {
  public getElevationURL(url: string) {
    return new Promise((resolve) => {
      axios
        .get(url)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          console.error("Error:", error);
          resolve(error);
        });
    });
  }
  public putData(url: string, data: any) {
    return new Promise((resolve) => {
      axios
        .put(url, data)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          console.error("Error:", error);
          resolve(error);
        });
    });
  }
  public getPdf(url: string, data: any) {
    return new Promise((resolve) => {
      axios
        .post(url, data)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          console.error("Error:", error);
          resolve(error);
        });
    });
  }
  putDataAzimuth = async (data: any) => {
    const apiUrl = `https://solar-glare.onrender.com/azimuth/`;
    try {
      let network = new NetworkService();
      const response = await network.putData(apiUrl, data);
      console.log("Response:", response);
      return response;
    } catch (error) {
      console.error("Error putting data:", error);
    }
  };
  getVerticalElevation = async (lat: number, lon: number): Promise<any> => {
    return new Promise(async (resolve) => {
      const apiUrl = `https://solar-glare.onrender.com/elevation/?lat=${lat}&long=${lon}`;
      try {
        const elevationData = (await this.getElevationURL(apiUrl)) as any;
        const result = elevationData[0].results[0].elevation;
        console.log(result);

        resolve(result);
      } catch (error) {
        console.error("Error fetching elevation data:", error);
        throw error;
      }
    });
  };
  getElevation = async (lat: number, lon: number): Promise<any> => {
    const apiUrl = `https://solar-glare.onrender.com/elevation/?lat=${lat}&long=${lon}`;
    try {
      const elevationData = await this.getElevationURL(apiUrl);
      return elevationData;
    } catch (error) {
      console.error("Error fetching elevation data:", error);
      throw error;
    }
  };
  getPDF = async (data: any): Promise<any> => {
    // const apiUrl = `https://solar-glare.onrender.com/getPDF`;
    const apiUrl = `https://solarglare.work/getPDF`;
    try {
      const pdf = await this.getPdf(apiUrl, data);
      return pdf;
    } catch (error) {
      console.error("Error fetching elevation data:", error);
      throw error;
    }
  };
}

export default NetworkService;
