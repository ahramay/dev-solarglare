import React from "react";
import { ThreeDots } from "react-loader-spinner";

const Loader: React.FC = () => {
  return (
    <ThreeDots
      visible={true}
      height="10"
      width="45"
      color="#fff"
      radius="100"
      ariaLabel="three-dots-loading"
      wrapperStyle={{}}
      wrapperClass=""
    />
  );
};

const Loader_2: React.FC = () => {
  return (
    <ThreeDots
      visible={true}
      height="10"
      width="45"
      color="#000"
      radius="100"
      ariaLabel="three-dots-loading"
      wrapperStyle={{}}
      wrapperClass=""
    />
  );
};
export default Loader;
export {Loader_2}