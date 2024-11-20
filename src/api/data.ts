import axios from "axios";

export const api = {
  getAzimuth: async (data: any) => {
    try {
      const response = await axios.put(`https://solarglare.work/azimuth`, data);

      console.log(response);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getElevation: async (lat: number, long: number) => {
    try {
      const response = await axios.get(
        `https://solarglare.work/elevation/?lat=${lat}&long=${long}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
};
