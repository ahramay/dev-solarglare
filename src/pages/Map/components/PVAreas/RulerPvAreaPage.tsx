import React, { useEffect, useState } from "react";
import { Dropdown, Container, Row, Col } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store";
import NetworkService from "../../../../services/network.service";
import { RxCaretDown } from "react-icons/rx";
import { IoClose, IoInformationCircleOutline } from "react-icons/io5";
import { removeRulerLine } from "../../../../store/reducers/bmapSlice";

const RulerPvAreaPage: React.FC = () => {
  const network = new NetworkService();
  const dispatch = useDispatch();
  const [distancePoint, setDistancePoint] = useState<any[]>([]);
  const [isDropdownActive, setIsDropdownActive] = useState(false);

  const rulerLines = useSelector((state: RootState) => state.bmap.rulerLines);
  const elevationData = useSelector(
    (state: RootState) => state.bmap.elevationData
  );
  useEffect(() => {
    calculateDistances();
  }, [rulerLines]);

  const calculateDistances = () => {
    const updatedDistancePoint: any[] = [];
    for (let i = 0; i < rulerLines.length - 1; i += 2) {
      const startPoint = rulerLines[i];
      const endPoint = rulerLines[i + 1];
      const distance = calculateDistance(startPoint, endPoint);
      updatedDistancePoint.push({ type: `Point ${i} to ${i + 1}`, distance });
    }
    setDistancePoint(updatedDistancePoint);
  };

  const calculateDistance = (start: any, end: any) => {
    const earthRadius = 6371e3;
    const lat1 = start.lat * (Math.PI / 180);
    const lat2 = end.lat * (Math.PI / 180);
    const lon1 = start.lng * (Math.PI / 180);
    const lon2 = end.lng * (Math.PI / 180);
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance.toFixed(2);
  };

  const handleRemovePoint = (index: number) => {
    const updatedDistancePoint = [...distancePoint];
    updatedDistancePoint.splice(index, 1);
    setDistancePoint(updatedDistancePoint);
    // dispatch(removeRulerLine(index));
  };
  return (
    <div className="RulerPvAreaPage">
      <Dropdown
        show={isDropdownActive && distancePoint.length > 0}
        style={{
          backgroundColor: distancePoint.length > 0 ? " " : "#ccc",
        }}
        onToggle={(isOpen) => setIsDropdownActive(isOpen)}
      >
        <Dropdown.Toggle variant="none" className="toggleButton">
          <p className="m-0 p-0">Ruler Points</p>
          {distancePoint.length > 0 && (
            <div>
              {isDropdownActive ? (
                <small>Hide All</small>
              ) : (
                <small>Show All</small>
              )}
            </div>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu className="w-100 border-black">
          <div className="d-flex justify-content-between mx-3 my-auto title">
            <div className="merriweather">RULER POINTS</div>
            <IoInformationCircleOutline
              className="pt-1"
              size={27}
              color="#003BB1"
            />
          </div>
          {distancePoint.length > 0 && (
            <Container>
              <Row className="gy-3">
                {distancePoint.map((point: any, index: number) => {
                  return (
                    <Col
                      key={`key_${index}`}
                      sm={6}
                      className="RulerPvAreaPageCol"
                    >
                      <div className="RulerPvAreaPAgeCol_div">
                        <div className="heading">
                          <h3 className="m-0 p-0">{point.type}</h3>
                          <IoClose
                            cursor={"pointer"}
                            size={17}
                            color="#fff"
                            onClick={() => {
                              handleRemovePoint(index);
                            }}
                          />
                        </div>
                        <h4 className="distance">Distance</h4>
                        <div className="pointDistance">
                          <p>{`${point.distance} meters`}</p>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Container>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default RulerPvAreaPage;
