import axios from "axios";
export const api = {
  fetchClientSecret: async (data:{amount: number}) => {
    try {
      const response = await axios.post(
        `https://stripe.solarglare.work/transaction`,
        data
      );

      return response;
    } catch (error) {
      throw error;
    }
  },
  fetchCouponDetails: async (data:{couponID:string,originalAmount:number,paymentIntent_ID:string}) => {
    try {
      const response = await axios.post(
        `https://stripe.solarglare.work/get_coupon`,
        data
      );

      return response;
    } catch (error) {
      throw error;
    }
  },
};
