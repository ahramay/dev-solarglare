import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../store";
import { Form, Modal, Image } from "react-bootstrap";
import { RiCloseFill } from "react-icons/ri";
import TooltipImg_1 from "../../../../images/verticalTooltip.png";
import { showVerticalTooltip } from "../../../../store/reducers/bmapSlice";

const VerticalTooltip: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const dispatch = useDispatch();
  const selectedArea = useSelector(
    (state: RootState) => state.bmap.selectedArea
  );
  const openVerticalTooltip = useSelector(
    (state: RootState) => state.bmap.showVerticalTooltip
  );

  useEffect(() => {
    if (selectedArea?.value === "vertical" && !openVerticalTooltip) {
      setShowTooltip(true);
    }
  }, [selectedArea]);

  const handleClose = () => {
    setShowTooltip(false);
  };

  return (
    <Modal
      show={showTooltip}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      className="TiltedTooltip"
    >
      <Modal.Header className="d-flex justify-content-between align-content-center border-0">
        <Modal.Title id="contained-modal-title-vcenter">
          Enter altitude/angle parameters
        </Modal.Title>
        <RiCloseFill
          style={{ cursor: "pointer" }}
          size={30}
          onClick={handleClose}
        />
      </Modal.Header>

      <Modal.Body className="mt-0 pt-0" style={{ top: "0px" }}>
        <p>Ask Mattheas about this to explain correctly</p>
        <Image
          src={TooltipImg_1}
          alt="tooltipImage__1"
          height={400}
          width={"auto"}
          style={{ objectFit: "contain" }}
        />
        <br />

        <div className="d-flex justify-content-end align-items-center me-3 gap-3 py-3 ">
          <label className="tiltedtooltipCheck" htmlFor="dont-show-checkbox">
            <Form.Check
              type="checkbox"
              id="dont-show-checkbox"
              onChange={(e) => {
                dispatch(showVerticalTooltip(e.target.checked));
              }}
            />
            Don’t show this again
          </label>

          <p className="gotitBtn " onClick={handleClose}>
            <span>Got it</span>
          </p>
        </div>
      </Modal.Body>
    </Modal>
  );
};
export default VerticalTooltip;
