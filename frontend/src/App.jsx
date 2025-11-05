import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Pets from "./pages/Pets";
import TemplateCreator from "./pages/TemplateCreator";

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/pets" element={<Pets/>} />
        <Route path="/create-template" element={<TemplateCreator />} />
      </Routes>
    </Router>
  );
}
