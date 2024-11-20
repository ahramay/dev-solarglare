import Navbar from "../../components/shared/navbar";
import Footer from "../../components/shared/footer";
import { Button } from "react-bootstrap";
import ExamplePDF from "../../assests/full_report.pdf"
export default function Newpdf() {
  const fileUrl = localStorage.getItem("fileUrl");
  return (
    <div>
      <Navbar />
      {/* <a
        className="d-flex justify-content-center mt-5 text-decoration-none"
        href="/ass/test.pdf"
        download="docId"
      >
        <Button className="pdf-downloadPDF mb-0" variant="none">
          Download Pdf
        </Button>
      </a> */}
      <div className="d-flex justify-content-center mt-5">
        <iframe
          src={`${ExamplePDF}`}
          style={{
            width: `700px`,
            height: "800px",
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
