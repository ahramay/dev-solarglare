import React, { useState, useEffect } from "react";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import { Link } from "react-router-dom";
import { Image, Container, Row, Col } from "react-bootstrap";
import Backarrow from "../../images/ion_arrow-back.png";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";

const Biling: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const user = auth.currentUser?.uid;

  const convertDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);

    // Define the formatting options
    const options = {
      day: "2-digit" as const,
      month: "long" as const,
      year: "numeric" as const,
      hour: "2-digit" as const,
      minute: "2-digit" as const,
      hour12: false,
    };

    // Format the date and time
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const q = query(
          collection(db, "paidReport"),
          where("userId", "==", user),
          where("paymentStatus", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const newData = querySnapshot.docs.map((doc) => {
          console.log(doc.data());
          return { ...doc.data(), id: doc.id };
        });
        setData(newData);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div>
      <Navbar />
      <div className="my-3 d-flex align-items-center ">
        <Link
          style={{ width: "fit-content", position: "absolute" }}
          className="text-decoration-none"
          to="/dashboard"
        >
          <div className="mx-3 d-flex align-items-center">
            <Image className="mb-3" src={Backarrow} alt="back_arrow" />
            <p className="d-none d-sm-inline  mx-2 backToDashboard">
              Dashboard
            </p>
          </div>
        </Link>
        <h1 className="newProjects mx-auto">Billing Details</h1>
      </div>
      {data[0]?.id ? (
        <Container fluid className="my-5">
          <Row style={{ marginBottom: "180px" }} className="gy-5 ">
            {data.map((value) => (
              <Col key={value.id} xl={3} lg={4} md={5} sm={8}>
                <div className="reportsCard px-3">
                  <div className="d-flex m-0 justify-content-between align-items-center pt-3">
                    <p className="reportHome">{value.projectName}</p>
                  </div>
                  <hr className="m-0" />
                  <p className="mt-2 m-0 reportCardText">
                    <b>Amount</b> : {`${value.amount / 100}€`}
                  </p>
                  <p className="m-0 reportCardText">
                    <b>Date</b> : {convertDate(Number(value?.createdAt))}
                  </p>
                  <p className="m-0 reportCardText">
                    <b>ID</b> : {value.transactionID}
                  </p>
                  <p className="m-0 reportCardText">
                    <b>Report ID</b> : {value.id}
                  </p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      ) : (
        <div className="text-center nothingToShow">
          <h2>Nothing to show</h2>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Biling;
