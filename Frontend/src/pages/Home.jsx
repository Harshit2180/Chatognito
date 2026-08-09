import { Sparkles, Users, Circle } from "lucide-react";
import React from "react";
import { useState, useEffect } from "react";
import { SERVER_URL } from "../socket/socket.js";

const genderArr = ["MALE", "FEMALE", "NON-BINARY", "PREFER NOT TO SAY"];
const interestsArr = ["MUSIC", "MOVIES", "SPORTS", "GAMING", "TECH", "TRAVEL", "FOOD", "BOOKS", "ART", "FITNESS", "PHOTOGRAPHY", "COOKING", "DANCING", "FASHION", "NATURE"];

const Home = ({ setStep, setUserData }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    interests: [],
  });
  const [onlineCount, setOnlineCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/stats`);
        const data = await res.json();
        if (!cancelled) setOnlineCount(data.onlineNow);
      } catch {
        // Stats are a nice-to-have — fail silently rather than disrupt the form
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleGenderSelect = (gender) => {
    setFormData({ ...formData, gender });
  };

  const toggleInterest = (interest) => {
    setFormData((prev) => {
      const isSelected = prev.interests.includes(interest);
      return {
        ...prev,
        interests: isSelected ? prev.interests.filter((i) => i !== interest) : [...prev.interests, interest],
      };
    });
  };

  const ageNum = Number(formData.age);
  const isAgeValid = formData.age.trim() !== "" && Number.isInteger(ageNum) && ageNum >= 13 && ageNum <= 120;

  const isFormValid = formData.name.trim() !== "" && isAgeValid && formData.gender !== "" && formData.interests.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const payload = {
      ...formData,
      age: Number(formData.age),
    };

    setUserData(payload);
    setStep("WAITING");
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-6 font-sans">
      <div className="bg-[#FDFBF9] border-[3px] border-black rounded-[2rem] w-full max-w-md shadow-[10px_10px_0_0_rgba(0,0,0,1)] relative flex flex-col h-[750px] max-h-[90vh]">
        <div className="overflow-y-auto p-8 pt-10 custom-scrollbar flex-1">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-[#FE6B6B] rounded-full p-4 border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-6">
              <Users size={40} color="white" strokeWidth={2} />
            </div>
            <h1 className="text-4xl font-black mb-3 tracking-tighter" style={{ transform: "scaleX(1.3)", display: "inline-block" }}>
              Chatognito
            </h1>
            <p className="text-[#1e1d1d] font-medium text-xl mt-1">Meet new people with shared interests!</p>
            {onlineCount !== null && (
              <div className="flex items-center gap-1.5 mt-3 border-[2px] border-black rounded-full px-3 py-1 bg-white">
                <Circle size={8} className="text-green-500" fill="currentColor" />
                <span className="text-xs font-bold uppercase tracking-wide">{onlineCount} online</span>
              </div>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Input */}
            <div>
              <label className="block font-bold text-sm mb-2 uppercase tracking-wide">Your Name</label>
              <input type="text" placeholder="Enter your name or pseudonym" className="w-full border-[2px] border-black rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 font-medium text-black" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <label className="block font-bold text-sm mb-2 uppercase tracking-wide">Age</label>
              <input type="number" placeholder="18" min="13" max="120" className="w-full border-[2px] border-black rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 font-medium text-black" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
              {formData.age.trim() !== "" && !isAgeValid && <p className="text-red-500 text-xs font-semibold mt-1.5">Age must be between 13 and 120.</p>}
            </div>

            <div>
              <label className="block font-bold text-sm mb-2 uppercase tracking-wide">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                {genderArr.map((genderOption) => (
                  <button key={genderOption} type="button" onClick={() => handleGenderSelect(genderOption)} className={`w-full border-[2px] cursor-pointer border-black rounded-xl py-3 text-sm font-bold transition-colors ${formData.gender === genderOption ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}>
                    {genderOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="block font-bold text-sm mb-2 uppercase tracking-wide">Pick your interests (Select at least 1)</label>
              <div className="flex flex-wrap gap-2.5">
                {interestsArr.map((interest) => (
                  <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`border-[2px] border-black cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition-colors ${formData.interests.includes(interest) ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}>
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 pb-4">
              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full rounded-[2rem] py-4 flex items-center justify-center gap-2 font-black text-xl transition-all duration-300
                  ${isFormValid ? "bg-[#ff0000] text-white shadow-[5px_5px_0_0_#28282B] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0_0_#000000] cursor-pointer" : "bg-[#f54242] text-white shadow-[5px_5px_0_0_#28282B]"}`}
              >
                <Sparkles size={24} strokeWidth={2.5} />
                Start Chatting
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Global styles for the custom scrollbar */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #A0A0A0;
          border-radius: 20px;
          border: 2px solid #FDFBF9;
        }
      `,
        }}
      />
    </div>
  );
};

export default Home;
