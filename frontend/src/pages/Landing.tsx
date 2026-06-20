import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../components/Logo";
import { setUserId } from "../api/client";

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [userId, setUserIdInput] = useState("");
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const id = userId.trim() || email.split("@")[0] || "demo";
    setUserId(id);
    navigate("/dashboard");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-[80%_center] md:object-[right_center] lg:object-center"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260618_174853_aac61aa2-0f3f-4cf1-bc78-7f657dd11164.mp4"
          type="video/mp4"
        />
      </video>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col px-4 sm:px-10 lg:px-12 py-4 sm:py-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between">
          <div className="glass rounded-2xl px-4 py-2.5 sm:px-6 sm:py-4 flex items-center">
            <Logo className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            <span className="font-askan text-white text-base sm:text-xl tracking-wide ml-2">
              PaceWell
            </span>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="ml-4 sm:ml-32 md:ml-64 lg:ml-96 text-white sm:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Desktop nav links */}
            <div className="hidden sm:flex ml-12 md:ml-32 lg:ml-64 gap-8">
              <a href="#features" className="text-white/70 hover:text-white text-sm transition-colors">
                Features
              </a>
              <a href="#how" className="text-white/70 hover:text-white text-sm transition-colors">
                How It Works
              </a>
              <a href="#insights" className="text-white/70 hover:text-white text-sm transition-colors">
                AI Insights
              </a>
            </div>
          </div>

          <button
            onClick={handleGetStarted}
            className="hidden sm:block bg-white text-gray-900 font-medium text-sm px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
          >
            Open Dashboard
          </button>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden absolute top-[4.5rem] left-4 right-4 glass-heavy rounded-2xl p-5 z-50">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-white text-sm">Features</a>
              <a href="#how" className="text-white text-sm">How It Works</a>
              <a href="#insights" className="text-white text-sm">AI Insights</a>
              <button
                onClick={handleGetStarted}
                className="bg-white text-gray-900 font-medium text-sm px-6 py-3 rounded-full w-full mt-2"
              >
                Open Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Spacer for mobile */}
        <div className="flex-1 sm:hidden" />

        {/* Main Content */}
        <div className="flex flex-col sm:flex-1 sm:flex-row sm:items-end pb-4 sm:pb-12 lg:pb-16 sm:mt-auto">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-4 sm:gap-6">
            <h1 className="font-askan text-white text-[2rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] tracking-tight max-w-[700px]">
              Your heart, always understood.
            </h1>

            <p className="text-white/70 text-xs sm:text-base md:text-lg max-w-[520px] leading-relaxed">
              PaceWell monitors your heart rate in real-time, detects patterns, and uses AI to give you
              actionable health insights. Built for people who want to understand their body better.
            </p>

            {/* User ID + Get Started */}
            <div className="flex flex-col gap-3 max-w-[480px]">
              <div className="glass rounded-full flex items-center relative">
                <input
                  type="text"
                  placeholder="Enter your user ID to get started"
                  value={userId}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGetStarted()}
                  className="bg-transparent text-white placeholder-white/40 px-4 sm:px-6 py-3 sm:py-4 text-sm flex-1 outline-none"
                />
                <button
                  onClick={handleGetStarted}
                  className="absolute right-1.5 bg-white text-gray-900 text-xs sm:text-sm font-medium px-3 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-white/90 transition-colors"
                >
                  Launch App
                </button>
              </div>
            </div>

            {/* Feature pills - mobile */}
            <div className="flex sm:hidden flex-wrap gap-2 mt-2">
              <span className="glass text-white text-xs px-3 py-1.5 rounded-full">
                Heart Rate Tracking
              </span>
              <span className="glass text-white text-xs px-3 py-1.5 rounded-full">
                AI-Powered Insights
              </span>
              <span className="glass text-white text-xs px-3 py-1.5 rounded-full">
                Clinician Reports
              </span>
            </div>
          </div>

          {/* Right Column - feature pills desktop */}
          <div className="hidden sm:flex flex-col items-end gap-2 self-end">
            <span className="glass text-white text-xs sm:text-sm px-4 py-2 rounded-full">
              Real-time Heart Rate Monitoring
            </span>
            <span className="glass text-white text-xs sm:text-sm px-4 py-2 rounded-full">
              AI-Powered Health Insights
            </span>
            <span className="glass text-white text-xs sm:text-sm px-4 py-2 rounded-full">
              Clinician-Ready Reports
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
