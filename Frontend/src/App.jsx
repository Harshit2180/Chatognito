import { useState } from "react";
import Home from "./pages/Home";
import Waiting from "./pages/Waiting";
import Chat from "./pages/Chat";

function App() {
  const [step, setStep] = useState("FORM");
  const [userData, setUserData] = useState(null);

  if (step === "FORM") return <Home setStep={setStep} setUserData={setUserData} />;
  if (step === "WAITING") return <Waiting />;
  if (step === "CHAT") return <Chat setStep={setStep} />;

  return null;
}

export default App;