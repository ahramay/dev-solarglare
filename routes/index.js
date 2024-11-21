const transactionRoute = require("./transactionRoutes");
const couponRoute = require("./couponRoutes")
const Router = require("express");
const router = Router();

const defaultRoutes = [
  {
    path: "/transaction",
    route: transactionRoute,
  },
  {
    path: "/get_coupon",
    route: couponRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
