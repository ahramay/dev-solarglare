const catchAsync = require("../utils/catchAsync");
const transactionService = require("../services/transactionService");

const CreatePaymentIntent = catchAsync(async (req, res) => {
 const amount = req.body.amount
  const paymentIntent = await transactionService.CreatePaymentIntent(amount);
  res.status(200).send(paymentIntent);
});

module.exports = {
  CreatePaymentIntent,
};
