import React, { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { StripeError, PaymentIntent } from "@stripe/stripe-js";
import Navbar from "../shared/navbar";
import Footer from "../shared/footer";
import { db, auth } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../shared/loader";
import { api } from "../../api/transaction";
import { toast } from "react-toastify";

const CheckoutForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [couponID, setCouponId] = useState("");
  const [error, setError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [apply, setApply] = useState("Apply");
  const [amount, setAmount] = useState(19);
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const location = useLocation();

  // handle transaction and store data into database
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
  
    if (!stripe || !elements) {
      console.error("Stripe or elements not available");
      setError("Payment cannot be processed. Please refresh the page and try again.");
      setIsLoading(false);
      return;
    }
  
    try {
      // Confirm the payment
      const { paymentIntent, error }: { paymentIntent?: PaymentIntent; error?: StripeError } =
        await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: "https://pv-glarecheck.com/thank-you/", 
          },
          redirect: "if_required", 
        });
  
      if (error) {
        console.error("Error confirming payment:", error.message);
        setError("A processing error occurred while confirming your payment. Please try again later.");
        setIsLoading(false);
        return;
      }
      if (paymentIntent && paymentIntent.status === "succeeded") {
        await setDoc(
          doc(db, "paidReport", location.state.projectId),
          {
            transactionID: paymentIntent.id,
            owner: auth.currentUser?.uid,
            amount: paymentIntent.amount / 100, 
            paymentStatus: true,
            createdAt: new Date(paymentIntent.created * 1000), 
          },
          { merge: true }
        );
  
        localStorage.removeItem("stripeClientSecret");
        window.location.href = "https://pv-glarecheck.com/thank-you/";
        setIsLoading(false);
      }    
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("An unexpected error occurred. Please try again later.");
      setIsLoading(false);
    }
  };
  
  const ApplyCoupon = async () => {
    if (couponID != "") {
      setCouponLoading(true);
      await api
        .fetchCouponDetails({
          couponID,
          originalAmount: 1900,
          paymentIntent_ID: location.state.paymentIntents_ID,
        })
        .then((data) => {
          setAmount(data.data.discountedPrice / 100);
          setApply("Applied");
        })
        .catch((e) => {
          if (e.request.status === 404) {
            setApply("Apply");
            toast.error("Invalid coupon code");
          } else {
            toast.error("Something went wrong please try again later");
          }
        })
        .finally(() => {
          setCouponLoading(false);
        });
    } else {
      toast.warning("Please enter the coupon code");
    }
  };

  return (
    <React.Fragment>
      <Navbar />
      <h4
        className="text-center pt-4 mt-4"
        style={{ color: "#fffff", fontWeight: "500" }}
      >
        The Total Cost for Your Purchase Is {amount}€.
      </h4>
      <form className="container checkoutForm" onSubmit={handleSubmit}>
        <PaymentElement />
        <div className="d-flex justify-content-between mt-3">
          <input
            onChange={(e) => {
              setCouponId(e.target.value.trim());
            }}
            type="text"
            placeholder="Enter Coupon"
            className="couponInput"
          />
          <button
            onClick={ApplyCoupon}
            type="button"
            className="couponBtn text-center"
          >
            {couponLoading ? <Loader /> : apply}
          </button>
        </div>
        {error && <small className="error">{error}</small>}
        <button
          className="d-flex justify-content-center align-items-center mb-5 payBtn"
          style={{ height: "35px" }}
          type="submit"
        >
          {isLoading ? <Loader /> : "PAY"}
        </button>
      </form>
      <Footer />
    </React.Fragment>
  );
};

export default CheckoutForm;
