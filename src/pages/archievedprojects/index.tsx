import React, { useEffect, useState } from "react";
import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import LeftArrow from "../../images/ion_arrow-back.png";
import { Link } from "react-router-dom";
import ChevronDown from "../../images/tabler_chevron-down.png";
import { Image } from "react-bootstrap";
import SearchIcon from "../../images/octicon_search-24.png";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import ArchieveCard from "../../components/pages/archieveCards";

const ArchieveProject: React.FC = () => {
  const [data, setData] = useState([{}]);
  const [render, setRender] = useState(true);
  const [searchValue, SetSearchValue] = useState("");
  const user = auth.currentUser?.uid;

  const handleStatusChange = () => {
    setRender((prevRender) => !prevRender);
  };

  // To get archieve projects and search from archieved projects
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        let q;

        if (searchValue.trim() === "") {
          q = query(
            collection(db, "projects"),
            where("userId", "==", user),
            where("status", "==", "archieve")
          );
        } else {
          q = query(
            collection(db, "projects"),
            where("userId", "==", user),
            where("status", "==", "archieve"),
            where("projectName", ">=", searchValue),
            where("projectName", "<=", searchValue + "\uf8ff")
          );
        }

        const querySnapshot = await getDocs(q);
        const newData = querySnapshot.docs.map((doc) => {
          return { ...doc.data(), id: doc.id };
        });

        setData(newData);
      }
    };

    fetchData();
  }, [searchValue, user, render]);

  return (
    <React.Fragment>
      <Navbar />
      <div className="my-4 d-flex align-items-end ">
        <Link
          style={{ width: "fit-content",position:"absolute" }}
          className="text-decoration-none"
          to="/dashboard"
        >
          <div className="mx-3 d-flex align-items-center">
            <Image className="mb-3" src={LeftArrow} alt="back_arrow" />
            <p className="d-none d-sm-inline  mx-2 backToDashboard">
              Dashboard
            </p>
          </div>
        </Link>
        <h1 className="newProjects  mx-auto ">Archived projects</h1>
      </div>
      <div className="d-block d-sm-flex justify-content-between mx-4  mt-3">
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span>Sort By </span>
          <img src={ChevronDown} alt="chevron_down" />
        </div>
        <div className="mt-3 searchDiv">
          <img src={SearchIcon} alt="Search Icon" className="searchIcon" />
          <input
            className="activeSearch"
            type="text"
            placeholder="Search"
            onChange={(e) => {
              const value = e.target.value.trim().toLocaleLowerCase();
              SetSearchValue(value);
            }}
          />
        </div>
      </div>
      {data.length > 0 ? (
        <Container fluid className="my-5">
          <Row style={{ marginBottom: "180px" }} className="gy-3 ">
            {data?.map((value: any) => {
              return (
                <Col key={value.projectName} xl={3} lg={4} md={5} sm={6}>
                  <ArchieveCard
                    data={value}
                    onStatusChange={handleStatusChange}
                  />
                </Col>
              );
            })}
          </Row>
        </Container>
      ) : (
        <div className="text-center nothingToShow">
          <h2>Nothing to show</h2>
        </div>
      )}

      <Footer />
    </React.Fragment>
  );
};

export default ArchieveProject;
