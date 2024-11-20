import React from "react";
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  ChartOptions,
  CategoryScale,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
const Glarediagram: React.FC = () => {
  Chart.register(PointElement, LineElement, LinearScale, CategoryScale, Filler);
  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Detection Point",
        backgroundColor: "#ffc",
        borderColor: "#ffc",
        borderWidth: 1,
        fill: true,
        data: [0, 0, 80, 65, 0, 100],
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: function (value) {
            return value === 0 || value === 100 ? '' : value;
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        title: {
          font: {
            size: 15,
            family: "Lato",
            style: "normal",
            weight: 400,
          },
          display: true,
          text: "Minuten mid Blendwirkung",
        },
      },
      x: {
        display: true,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          font: {
            size: 15,
            family: "Lato",
            style: "normal",
            weight: 400,
          },
          display: true,
          text: "Months",
        },
      },
    },
  };
  return (
    <React.Fragment>
      <div className="my-4">
        <p className="detectionPoint">Detection point P1 (1.6m height)</p>
        <Line className="m-auto glareLine" data={data} options={options} />
      </div>
    </React.Fragment>
  );
};
export default Glarediagram;
