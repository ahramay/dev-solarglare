const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const stripe = require("stripe");
require("dotenv").config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeInstance = new stripe(stripeSecretKey);

const CreatePaymentIntent = async (originalAmount) => {
  try {
    const paymentIntent = await stripeInstance.paymentIntents.create({
      currency: "eur",
      amount: originalAmount,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return {
      paymentIntents_ID: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    throw new ApiError(
      httpStatus.PAYMENT_REQUIRED,
      "Error Creating PaymentIntent"
    );
  }
};

module.exports = {
  CreatePaymentIntent,
};
