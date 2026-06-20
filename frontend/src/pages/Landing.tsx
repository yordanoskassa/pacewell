import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Heart, Activity, AlertTriangle, TrendingUp, FileText, Brain } from "lucide-react";
import Logo from "../components/Logo";
import { setUserId } from "../api/client";

const CONDITIONS = [
  "POTS",
  "Dysautonomia",
  "Long COVID",
  "ME/CFS",
  "Autoimmune illness",
  "Anemia",
  "Other",
];

const FEATURES = [
  {
    icon: Heart,
    title: "Track your heart rate in real time",
    desc: "Connect your wearable to monitor heart-rate spikes throughout the day and see how your body responds to everyday activities.",
  },
  {
    icon: Activity,
    title: "Identify your triggers",
    desc: "Log activities like showering, walking, standing, or exercising to uncover patterns that lead to tachycardia episodes.",
  },
  {
    icon: AlertTriangle,
    title: "Understand what causes crashes",
    desc: "Track symptoms like dizziness, fatigue, brain fog, or post-exertional malaise to see what events or activities precede them.",
  },
  {
    icon: TrendingUp,
    title: "Pace yourself more effectively",
    desc: "Recognize when your heart rate is approaching unsafe or unsustainable levels so you can rest before symptoms escalate.",
  },
  {
    icon: Brain,
    title: "See long-term patterns",
    desc: "View weekly and monthly insights showing how your heart rate, activities, and symptoms interact over time.",
  },
  {
    icon: FileText,
    title: "Generate reports for clinicians",
    desc: "Export clear summaries of your heart-rate trends, triggers, and symptom patterns to share with your doctor.",
  },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserIdInput] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const id = userId.trim();
    if (!id) return;
    setUserId(id);
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0f]">
      {/* Hero with video */}
      <div className="relative min-h-screen w-full overflow-hidden">
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
        <div className="absolute inset-0 hero-overlay z-[1]" aria-hidden="true" />

        <div className="absolute inset-0 z-10 flex flex-col px-4 sm:px-10 lg:px-12 py-4 sm:py-8">
          <nav className="flex items-center justify-between gap-3">
            <div className="glass rounded-2xl px-4 py-2.5 sm:px-6 sm:py-4 flex items-center gap-2 sm:gap-3 min-w-0">
              <Logo className="w-5 h-5 sm:w-7 sm:h-7 text-white shrink-0" />
              <span className="font-askan text-white text-base sm:text-xl tracking-wide truncate">
                PaceWell
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="ml-auto text-white sm:hidden shrink-0"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-6 lg:gap-8">
              <a href="#features" className="text-white/70 hover:text-white text-sm transition-colors">
                Features
              </a>
              <a href="#conditions" className="text-white/70 hover:text-white text-sm transition-colors">
                Who It&apos;s For
              </a>
              <a href="#waitlist" className="text-white/70 hover:text-white text-sm transition-colors">
                Waitlist
              </a>
            </div>

            <button
              type="button"
              onClick={handleGetStarted}
              disabled={!userId.trim()}
              className="hidden sm:block bg-white text-gray-900 font-medium text-sm px-6 py-3 rounded-full hover:bg-white/90 transition-colors shrink-0 disabled:opacity-40"
            >
              Get Started
            </button>
          </nav>

          {menuOpen && (
            <div className="sm:hidden absolute top-[4.5rem] left-4 right-4 glass-heavy rounded-2xl p-5 z-50">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-white text-sm" onClick={() => setMenuOpen(false)}>
                  Features
                </a>
                <a href="#conditions" className="text-white text-sm" onClick={() => setMenuOpen(false)}>
                  Who It&apos;s For
                </a>
                <a href="#waitlist" className="text-white text-sm" onClick={() => setMenuOpen(false)}>
                  Waitlist
                </a>
                <button
                  type="button"
                  onClick={handleGetStarted}
                  disabled={!userId.trim()}
                  className="bg-white text-gray-900 font-medium text-sm px-6 py-3 rounded-full w-full mt-2 disabled:opacity-40"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 sm:hidden" />

          <div className="flex flex-col sm:flex-1 sm:flex-row sm:items-end pb-4 sm:pb-12 lg:pb-16 sm:mt-auto">
            <div className="flex-1 flex flex-col gap-4 sm:gap-6">
              <p className="text-white/60 text-xs sm:text-sm uppercase tracking-wider">
                Understand your heart rate. Prevent crashes.
              </p>
              <h1 className="font-askan text-white text-[2rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5rem] leading-[1.05] tracking-tight max-w-[720px]">
                Pace your day with confidence.
              </h1>
              <p className="text-white/70 text-sm sm:text-base md:text-lg max-w-[560px] leading-relaxed">
                For people living with tachycardia-related conditions like POTS and dysautonomia,
                everyday activities can trigger sudden heart-rate spikes and debilitating crashes.
                PaceWell helps you connect the dots between your heart rate, daily activities, and
                symptoms so you can better understand your limits and pace yourself safely.
              </p>

              <div className="flex flex-col gap-3 max-w-[480px]">
                <div className="glass rounded-full flex items-center relative">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={userId}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGetStarted()}
                    className="bg-transparent text-white placeholder-white/40 pl-4 sm:pl-6 pr-28 sm:pr-32 py-3 sm:py-4 text-sm w-full outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    disabled={!userId.trim()}
                    className="absolute right-1.5 bg-white text-gray-900 text-xs sm:text-sm font-medium px-3 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-white/90 transition-colors disabled:opacity-40"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-2 self-end">
              <span className="glass text-white text-xs sm:text-sm px-4 py-2 rounded-full">
                POTS &amp; Dysautonomia
              </span>
              <span className="glass text-white text-xs sm:text-sm px-4 py-2 rounded-full">
                Trigger Identification
              </span>
              <span className="glass text-white text-xs sm:text-sm px-4 py-2 rounded-full">
                AI Pacing Insights
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="relative z-10 px-4 sm:px-10 lg:px-12 py-16 sm:py-24 max-w-[1100px] mx-auto">
        <section className="mb-20 sm:mb-28">
          <p className="text-white/50 text-sm leading-relaxed max-w-[720px]">
            By combining wearable heart-rate data with simple activity and symptom tracking, PaceWell
            helps you identify the patterns that lead to crashes and fatigue.
          </p>
        </section>

        <section id="features" className="mb-20 sm:mb-28">
          <h2 className="font-askan text-white text-2xl sm:text-4xl mb-3">
            What PaceWell Helps You Do
          </h2>
          <p className="text-white/40 text-sm mb-10 max-w-[560px]">
            Built to help you understand your body&apos;s limits and manage your energy more safely.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-5 sm:p-6">
                <f.icon size={20} className="text-rose-400 mb-3" />
                <h3 className="text-white text-sm font-medium mb-2">{f.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="conditions" className="mb-20 sm:mb-28">
          <h2 className="font-askan text-white text-2xl sm:text-4xl mb-3">
            Built for people living with tachycardia and related conditions
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-[720px] mb-8">
            PaceWell is designed for people navigating conditions where heart-rate regulation and
            energy management are critical, including POTS, dysautonomia, Long COVID, ME/CFS, autoimmune
            illnesses, and anemia.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-white/80 text-sm font-medium mb-4 uppercase tracking-wider text-[10px]">
                Conditions we support
              </h3>
              <ul className="space-y-2">
                {[
                  "POTS (Postural Orthostatic Tachycardia Syndrome)",
                  "Dysautonomia",
                  "Long COVID",
                  "ME/CFS and chronic fatigue conditions",
                  "Autoimmune illnesses",
                  "Anemia and other conditions that affect heart rate and energy",
                ].map((c) => (
                  <li key={c} className="text-white/60 text-sm flex gap-2">
                    <span className="text-rose-400/60">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-white/80 text-sm font-medium mb-4 uppercase tracking-wider text-[10px]">
                PaceWell helps you
              </h3>
              <ul className="space-y-2">
                {[
                  "Understand your body's limits",
                  "Identify heart-rate triggers",
                  "Track symptoms and crashes",
                  "Manage your energy more safely",
                ].map((c) => (
                  <li key={c} className="text-white/60 text-sm flex gap-2">
                    <span className="text-emerald-400/60">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="waitlist" className="glass-card rounded-2xl p-6 sm:p-10">
          <h2 className="font-askan text-white text-2xl sm:text-3xl mb-2">
            Join the Early Access Waitlist
          </h2>
          <p className="text-white/50 text-sm mb-8 max-w-[560px]">
            We&apos;re currently building PaceWell and inviting early users to help shape the product.
            Join to get early access, help guide feature development, and receive an early-supporter
            discount on premium features.
          </p>

          {waitlistSubmitted ? (
            <div className="text-emerald-400 text-sm">
              You&apos;re on the list! We&apos;ll be in touch soon.
            </div>
          ) : (
            <form
              name="waitlist"
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
              onSubmit={() => setWaitlistSubmitted(true)}
              className="space-y-5 max-w-[480px]"
            >
              <input type="hidden" name="form-name" value="waitlist" />
              <p className="hidden">
                <label>
                  Don&apos;t fill this out: <input name="bot-field" />
                </label>
              </p>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  Email Address *
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none placeholder-white/30"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  Name (Optional)
                </span>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none placeholder-white/30"
                />
              </label>

              <fieldset>
                <legend className="text-[10px] text-white/40 uppercase tracking-wider mb-3">
                  Which conditions apply to you? (Optional)
                </legend>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <label
                      key={c}
                      className="flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs text-white/70 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <input type="checkbox" name="conditions" value={c} className="accent-rose-400" />
                      {c}
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                className="bg-white text-gray-900 font-medium text-sm px-8 py-3 rounded-full hover:bg-white/90 transition-colors"
              >
                Join the Waitlist →
              </button>
            </form>
          )}
        </section>

        <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5 text-white/40" />
            <span className="font-askan text-white/40 text-sm">PaceWell</span>
          </div>
          <p className="text-white/20 text-xs text-center">
            Not a medical device. Always consult your care team for clinical decisions.
          </p>
          <button
            type="button"
            onClick={handleGetStarted}
            disabled={!userId.trim()}
            className="text-white/50 hover:text-white text-xs transition-colors disabled:opacity-30"
          >
            Get started →
          </button>
        </footer>
      </div>
    </div>
  );
}
