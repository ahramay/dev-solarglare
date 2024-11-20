/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 08/11/2024 - 23:17:58
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 08/11/2024
    * - Author          : 
    * - Modification    : 
**/
import React, { useEffect, useState } from "react";
import CheckoutForm from "../../components/pages/checkoutForm";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useLocation } from "react-router-dom";

const Payment: React.FC = () => {
  const [stripePromise, setStripePromise] = useState<Stripe | null>(null);
  const location = useLocation();
  const clientSecret = location?.state?.clientSecret;
  useEffect(() => {
    const fetchStripePromise = async () => {
      const stripe = await loadStripe("pk_live_51OclhHFOvck8PfBnVyC2XXKoUe1Ov7E0YOkFvA2sag2jCUWl6bbKtpnCMAxAdKtop5wD3jcAgKEBGyuPr2uE019900Lcym8nz1");
      console.log(stripe)
      setStripePromise(stripe);
    };

    fetchStripePromise();
  }, [process.env.REACT_APP_STRIPE_PUBLISH_KEY]);
  return (
    <React.Fragment>
      {clientSecret ? (
        <div>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
        </div>
      ) : (
        <div>
          <Navbar />
          <div className="text-center nothingToShow mt-5 pt-5">
            <h2>Something went wrong please try again</h2>
          </div>
          <Footer />
        </div>
      )}
    </React.Fragment>
  );
};

export default Payment;
