const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const stripe = require("stripe");
require("dotenv").config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeInstance = new stripe(stripeSecretKey);

const applyCoupon = async (couponCode, originalAmount, paymentIntent_ID) => {
  try {
    let discountedPrice = 0;

    if (couponCode) {
      const coupon = await stripeInstance.coupons.retrieve(couponCode);
      
      if (coupon.valid) {
        if (coupon.percent_off) {
          discountedPrice = (originalAmount * coupon.percent_off) / 100;
        } else if (coupon.amount_off) {
          discountedPrice = coupon.amount_off;
        }
      }
    }

    const finalAmount = Math.max(originalAmount - discountedPrice, 0);

    await stripeInstance.paymentIntents.update(paymentIntent_ID, {
      amount: finalAmount,
    });

    return finalAmount; 
  } catch (e) {
    if (e.statusCode === 404) {
      throw new ApiError(httpStatus.NOT_FOUND, "Invalid coupon code");
    } else {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "An error occurred while applying the coupon"
      );
    }
  }
};

module.exports = {
  applyCoupon,
};
