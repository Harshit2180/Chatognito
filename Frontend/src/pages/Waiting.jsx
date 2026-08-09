import React, { useEffect, useState } from "react";
import { Users, Heart, AlertCircle } from "lucide-react";
import { socket } from "../socket/socket.js";

const Waiting = ({ userData, queueError }) => {
  const [cycleIndex, setCycleIndex] = useState(0);
  const interests = userData?.interests || [];

  // Join the matching queue once. match_found / partner_disconnected are now
  // handled at the App level so nothing gets missed during the screen transition.
  useEffect(() => {
    if (!userData) return;
    socket.emit("join_queue", userData);
  }, [userData]);

  // Cycle through the user's picked interests in the card
  useEffect(() => {
    if (interests.length === 0) return;
    const timer = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % interests.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [interests]);

  const currentInterest = interests[cycleIndex] || "...";

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-6 font-sans">
      <div className="bg-[#FDFBF9] border-[3px] border-black rounded-[2rem] w-full max-w-md shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col items-center h-[750px] max-h-[90vh] p-8 pt-10">
        {/* Spinner Badge */}
        <div className="relative flex items-center justify-center w-24 h-24 bg-[#FE6B6B] rounded-full border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-10">
          <Users size={36} color="white" strokeWidth={2} />
          <div className="absolute inset-0 border-4 border-transparent border-t-black rounded-full animate-spin"></div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-black mb-3 tracking-tighter text-center uppercase" style={{ transform: "scaleX(1.15)", display: "inline-block" }}>
          Finding Your Match
        </h1>

        {queueError && (
          <div className="flex items-center gap-2 bg-red-50 border-[2px] border-red-400 rounded-xl px-4 py-2 mb-6">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-red-600 font-semibold text-sm">{queueError}</p>
          </div>
        )}

        <p className="text-[#1e1d1d] font-medium text-lg mt-1 mb-10 text-center">Looking for someone who loves...</p>

        {/* Interest Card */}
        <div className="border-[2px] border-black rounded-xl px-10 py-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white mb-10">
          <span className="text-3xl font-black text-black tracking-widest uppercase">{currentInterest}</span>
        </div>

        {/* Interests Selected Pill */}
        <div className="flex items-center gap-2 border-[2px] border-black rounded-full px-6 py-3 bg-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] mb-auto">
          <Heart size={20} className="text-[#ff0000]" fill="#ff0000" />
          <span className="text-lg font-bold">{interests.length} Interests Selected</span>
        </div>

        {/* Footer Text */}
        <p className="text-gray-400 font-medium pt-6">This might take a moment...</p>
      </div>
    </div>
  );
};

export default Waiting;
