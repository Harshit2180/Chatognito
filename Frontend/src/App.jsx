import { useEffect, useRef, useState } from "react";
import Home from "./pages/Home";
import Waiting from "./pages/Waiting";
import Chat from "./pages/Chat";
import { socket } from "./socket/socket.js";

function App() {
  const [step, setStep] = useState("FORM");
  const [userData, setUserData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const [queueError, setQueueError] = useState(null);
  const [connectionLost, setConnectionLost] = useState(false);

  // Event handlers below are registered once, so they'd otherwise close over
  // stale values of step/matchData. Refs keep them reading the latest state.
  const stepRef = useRef(step);
  const matchDataRef = useRef(matchData);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  
  useEffect(() => {
    matchDataRef.current = matchData;
  }, [matchData]);

  // All socket listeners live here for the whole session, not per-page.
  // This closes the gap that existed when Waiting.jsx unmounted and Chat.jsx
  // hadn't attached its own listeners yet — an event fired in that window
  // used to be silently dropped (e.g. the partner disconnecting right as
  // you're matched, before the Chat screen finishes mounting).
  useEffect(() => {
    socket.connect();

    const handleMatchFound = (data) => {
      setMatchData(data);
      setMessages([]);
      setPartnerLeft(false);
      setPartnerTyping(false);
      setStep("CHAT");
    };

    const handlePartnerDisconnected = () => {
      setPartnerLeft(true);
      setPartnerTyping(false);
    };

    const handleReceiveMessage = ({ content, timestamp }) => {
      setMessages((prev) => [...prev, { text: content, timestamp, sender: "them" }]);
      setPartnerTyping(false);
    };

    const handleMessageSent = ({ content, timestamp }) => {
      setMessages((prev) => [...prev, { text: content, timestamp, sender: "me" }]);
    };

    const handlePartnerTyping = ({ isTyping }) => setPartnerTyping(isTyping);

    const handleQueueError = ({ message }) => setQueueError(message);

    // Fires on the very first connect too — harmless, since stepRef will be
    // "FORM" at that point and the rejoin condition below just won't trigger.
    const handleConnect = () => {
      setConnectionLost(false);
      if (stepRef.current === "CHAT" && matchDataRef.current?.roomId) {
        socket.emit("rejoin_room", { roomId: matchDataRef.current.roomId });
      }
    };

    const handleDisconnect = () => {
      // Only matters visually if we're mid-chat; harmless no-op otherwise
      setConnectionLost(true);
    };

    const handleRejoinFailed = () => {
      // Grace period expired before we reconnected — the room is already gone
      setPartnerLeft(true);
    };

    socket.on("match_found", handleMatchFound);
    socket.on("partner_disconnected", handlePartnerDisconnected);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("partner_typing", handlePartnerTyping);
    socket.on("queue_error", handleQueueError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("rejoin_failed", handleRejoinFailed);

    return () => {
      socket.off("match_found", handleMatchFound);
      socket.off("partner_disconnected", handlePartnerDisconnected);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("partner_typing", handlePartnerTyping);
      socket.off("queue_error", handleQueueError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("rejoin_failed", handleRejoinFailed);
      socket.disconnect();
    };
  }, []);

  const startOver = (nextStep) => {
    setMatchData(null);
    setMessages([]);
    setPartnerLeft(false);
    setPartnerTyping(false);
    setQueueError(null);
    setConnectionLost(false);
    setStep(nextStep);
  };

  if (step === "FORM") return <Home setStep={setStep} setUserData={setUserData} />;

  if (step === "WAITING") return <Waiting userData={userData} queueError={queueError} />;

  if (step === "CHAT") return <Chat setStep={startOver} matchData={matchData} messages={messages} partnerTyping={partnerTyping} partnerLeft={partnerLeft} connectionLost={connectionLost} />;

  return null;
}

export default App;
