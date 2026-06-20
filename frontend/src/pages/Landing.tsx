import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { setUserId } from "../api/client";

export default function Landing() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const id = name.trim() || "guest";
    setUserId(id);
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0f]">
      <div className="relative min-h-screen w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-[80%_center] md:object-center"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260618_174853_aac61aa2-0f3f-4cf1-bc78-7f657dd11164.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 hero-overlay z-[1]" aria-hidden="true" />

        <div className="absolute inset-0 z-10 flex flex-col px-4 sm:px-10 py-6 sm:py-10">
          <nav className="flex items-center gap-2 sm:gap-3">
            <Logo className="w-6 h-6 text-white shrink-0" />
            <span className="font-askan text-white text-lg sm:text-xl tracking-wide">
              PaceWell
            </span>
          </nav>

          <div className="flex-1 flex flex-col justify-center max-w-lg pb-16">
            <p className="text-white/60 text-xs sm:text-sm uppercase tracking-wider mb-3">
              POTS &amp; dysautonomia
            </p>
            <h1 className="font-askan text-white text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight mb-4">
              Pace your day with confidence.
            </h1>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-8">
              Track heart rate, spot triggers, and understand your limits.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGetStarted()}
                className="glass rounded-full px-5 py-3.5 text-sm text-white placeholder-white/40 outline-none flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={handleGetStarted}
                className="bg-white text-gray-900 font-medium text-sm px-8 py-3.5 rounded-full hover:bg-white/90 transition-colors shrink-0"
              >
                Get Started
              </button>
            </div>
          </div>

          <p className="text-white/25 text-[10px] sm:text-xs">
            Not a medical device. Consult your care team for clinical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
