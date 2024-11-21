const transactionController = require("../controllers/transactionController");
const Router = require("express");
const router = Router();

router.post("/", transactionController.CreatePaymentIntent);

module.exports = router;
