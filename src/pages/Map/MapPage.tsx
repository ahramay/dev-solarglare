import React, { useEffect, useState } from "react";
import MapPageFooter from "./components/MapPageFooter";
import MapPageHeader from "./components/MapPageHeader";
import MapPageRender from "./components/MapPageRender";
import MapPageSidebar from "./components/MapPageSidebar";
import { useLocation, useNavigate } from "react-router-dom";

const MapPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate()
  const id = location.state;

  const [clickedPolygonVertices, setClickedPolygonVertices] = useState<
    { lat: number; lng: number }[] | null
  >(null);
  const [polygonNames, setPolygonNames] = useState<string[]>([]);

  // Function to update the name of a polygon
  const updatePolygonName = (index: number, newName: string) => {
    setPolygonNames((prevNames) => {
      const updatedNames = [...prevNames];
      updatedNames[index] = newName;
      return updatedNames;
    });
  };
  const handleNameChange = (index: number, newName: string) => {
    updatePolygonName(index, newName);
  };
  useEffect(()=>{

    if(!id){
      navigate("/start")
    }
  },[])

  return (
    <>
      {id && (
        <div>
          <MapPageHeader />
          <div className="Map-page-content">
            <div className="Map-render">
              <MapPageRender />
            </div>
            <div className="Map-sidebar">
              <MapPageSidebar />
            </div>
          </div>
          {/* <MapPageFooter /> */}
        </div>
      )}
    </>
  );
};
export default MapPage;
