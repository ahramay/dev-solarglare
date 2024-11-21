/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 15/10/2024 - 13:37:00
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 15/10/2024
    * - Author          : 
    * - Modification    : 
**/
import axios from "axios";

export const api = {
  getAzimuth: async (data: any) => {
    try {
      const response = await axios.put(`https://dev.solarglare.work/azimuth`, data);

      console.log(response);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getElevation: async (lat: number, long: number) => {
    try {
      const response = await axios.get(
        `https://dev.solarglare.work/elevation/?lat=${lat}&long=${long}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
};
