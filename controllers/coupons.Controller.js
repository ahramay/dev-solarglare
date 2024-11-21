const catchAsync = require("../utils/catchAsync");
const couponService = require("../services/couponsService")

const checkCoupon = catchAsync(async (req, res) => {
  const code = req.body.couponID
  const amount = req.body.originalAmount
  const paymentIntent_ID = req.body.paymentIntent_ID
  const couponResponse = await couponService.applyCoupon(code,amount,paymentIntent_ID);
  res.status(200).send({discountedPrice:couponResponse})
});

module.exports = {
    checkCoupon,
};
