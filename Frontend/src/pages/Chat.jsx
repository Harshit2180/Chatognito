import React, { useEffect, useRef, useState } from "react";
import { Send, LogOut, Heart, Flag, WifiOff } from "lucide-react";
import { socket } from "../socket/socket.js";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const Chat = ({ setStep, matchData, messages, partnerTyping, partnerLeft, connectionLost }) => {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const roomId = matchData?.roomId;
  const partnerName = matchData?.partnerName || "Stranger";
  const sharedInterests = matchData?.sharedInterests || [];
  const inputDisabled = partnerLeft || connectionLost;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const sendMessage = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !roomId || inputDisabled) return;

    socket.emit("send_message", { content: text, isEmoji: false });
    socket.emit("typing", { isTyping: false });
    setDraft("");
  };

  const handleDraftChange = (e) => {
    setDraft(e.target.value);

    socket.emit("typing", { isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { isTyping: false });
    }, 1500);
  };

  const endChat = () => {
    socket.emit("disconnect_chat");
    setStep("FORM");
  };

  const reportAndBlock = () => {
    if (!window.confirm(`Report and block ${partnerName}? This ends the chat.`)) return;
    socket.emit("report_partner");
    setStep("FORM");
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-6 font-sans">
      <div className="bg-[#FDFBF9] border-[3px] border-black rounded-[2rem] w-full max-w-md shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col h-[750px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b-[3px] border-black p-5 flex items-center justify-between bg-[#FE6B6B]">
          <div>
            <p className="font-black text-xl text-white uppercase tracking-tight">{partnerName}</p>
            {sharedInterests.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Heart size={14} className="text-white" fill="white" />
                <p className="text-white font-semibold text-xs uppercase tracking-wide">
                  {sharedInterests.slice(0, 3).join(" · ")}
                  {sharedInterests.length > 3 ? ` +${sharedInterests.length - 3}` : ""}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reportAndBlock} disabled={partnerLeft} className="bg-white text-black rounded-full p-2.5 border-[2px] border-black hover:bg-black hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Report and block" title="Report and block">
              <Flag size={18} strokeWidth={2.5} />
            </button>
            <button onClick={endChat} className="bg-black text-white rounded-full p-2.5 border-[2px] border-black hover:bg-white hover:text-black transition-colors cursor-pointer" aria-label="End chat">
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {messages.length === 0 && <p className="text-center text-gray-400 font-medium mt-10">Say hi! You both like {sharedInterests[0] ? sharedInterests[0].toLowerCase() : "the same things"}.</p>}

          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl border-[2px] border-black font-medium text-sm break-words whitespace-pre-wrap ${msg.sender === "me" ? "bg-black text-white rounded-br-sm" : "bg-white text-black rounded-bl-sm"}`}>{msg.text}</div>
              {msg.timestamp && <span className="text-[10px] text-gray-400 font-medium mt-1 px-1">{formatTime(msg.timestamp)}</span>}
            </div>
          ))}

          {partnerTyping && !partnerLeft && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm border-[2px] border-black bg-white text-gray-400 font-medium text-sm">typing...</div>
            </div>
          )}

          {connectionLost && !partnerLeft && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 bg-yellow-50 border-[2px] border-yellow-400 rounded-full px-4 py-2">
                <WifiOff size={14} className="text-yellow-600 animate-pulse" />
                <span className="text-yellow-700 font-semibold text-xs">Reconnecting...</span>
              </div>
            </div>
          )}

          {partnerLeft && <p className="text-center text-gray-400 font-semibold text-sm py-2">{partnerName} has left the chat.</p>}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t-[3px] border-black p-4 flex items-center gap-3">
          <input type="text" value={draft} onChange={handleDraftChange} placeholder={partnerLeft ? "Chat has ended" : connectionLost ? "Reconnecting..." : "Type a message..."} disabled={inputDisabled} className="flex-1 border-[2px] border-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 font-medium text-black disabled:bg-gray-100" />
          <button type="submit" disabled={!draft.trim() || inputDisabled} className={`rounded-xl p-3.5 border-[2px] border-black transition-colors ${draft.trim() && !inputDisabled ? "bg-[#ff0000] text-white hover:bg-black cursor-pointer" : "bg-gray-200 text-gray-400"}`} aria-label="Send message">
            <Send size={20} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
