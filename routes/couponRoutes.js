const couponController = require("../controllers/coupons.Controller");
const Router = require("express");
const router = Router();

router.post("/", couponController.checkCoupon);

module.exports = router;
