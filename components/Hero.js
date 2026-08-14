"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Volume2,
  Send,
  Phone,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Languages,
} from "lucide-react";

const DISTRICTS = [
  {
    key: "nowshera",
    name: "Nowshera",
    river: "Kabul River",
    risk: "high",
    discharge: 452000,
    landmark: "the GT Road bypass",
    window: "by Maghrib, around 6pm",
  },
  {
    key: "charsadda",
    name: "Charsadda",
    river: "Kabul River",
    risk: "medium",
    discharge: 318000,
    landmark: "the Peshawar road ridge",
    window: "within 6 to 12 hours",
  },
  {
    key: "peshawar",
    name: "Peshawar",
    river: "Bara River",
    risk: "medium",
    discharge: 244000,
    landmark: "the Ring Road overpass",
    window: "within 6 to 12 hours",
  },
  {
    key: "swat",
    name: "Swat",
    river: "Swat River",
    risk: "low",
    discharge: 176000,
    landmark: "the Mingora ridge road",
    window: "no rise expected yet",
  },
  {
    key: "mardan",
    name: "Mardan",
    river: "Kalpani River",
    risk: "low",
    discharge: 151000,
    landmark: "the Swabi road",
    window: "no rise expected yet",
  },
];

function GithubMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-2.15c-3.16.69-3.83-1.35-3.83-1.35-.52-1.31-1.26-1.66-1.26-1.66-1.03-.71.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.65 1.24 3.3.95.1-.73.4-1.24.72-1.53-2.52-.29-5.17-1.26-5.17-5.62 0-1.24.44-2.26 1.17-3.05-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.81 1.17 3.05 0 4.37-2.66 5.33-5.19 5.61.41.36.77 1.06.77 2.14v3.17c0 .3.21.66.79.55A11.03 11.03 0 0 0 23.02 11.5C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  );
}

const RISK_META = {
  high: { color: "#ef4a3d", label: "High risk", icon: AlertTriangle },
  medium: { color: "#f2a93b", label: "Medium risk", icon: Droplets },
  low: { color: "#35d399", label: "Low risk", icon: CheckCircle2 },
};

const LANGUAGES = [
  { key: "en", label: "EN" },
  { key: "roman", label: "Roman" },
  { key: "ps", label: "پښتو", dir: "rtl" },
];

function buildAlert(d) {
  if (d.risk === "high") {
    return {
      en: `Urgent — ${d.name}: the ${d.river} is rising fast. Water will reach knee to waist depth ${d.window}. Move your family and animals to ${d.landmark} now.`,
      roman: `${d.name} ta khatarnak khabardari: ${d.river} dera ghrandai loredzi. Obah ${d.window} kamar-jag lware wi. Khpal koranai aw tsarwi ${d.landmark} ta osa olegday.`,
      ps: `${d.name} ته خطرناک خبرداری: ${d.river} ډېره ګړندۍ لوړېږي. اوبه به ${d.window} د زنګون تر کمر پورې لوړې وي. خپل کورنۍ او څاروي اوس مهال ${d.landmark} ته ولیږدئ.`,
    };
  }
  if (d.risk === "medium") {
    return {
      en: `Watch — ${d.name}: the ${d.river} is rising. Low-lying streets may flood ${d.window}. Keep essentials packed and stay near ${d.landmark}.`,
      roman: `${d.name} lapara khabardari: ${d.river} lwaregi. Teto sarakuna ${d.window} tar obo lande kedai shi. Zaroori shai chmatawali wasata.`,
      ps: `${d.name} لپاره خبرداری: ${d.river} لوړېږي. ټیټې سړکونه ${d.window} تر اوبو لاندې کېدای شي. اړین توکي چمتو وساتئ.`,
    };
  }
  return {
    en: `Calm — ${d.name}: the ${d.river} is steady today. Risk is low, no action needed. We are still watching for you.`,
    roman: `${d.name} nan aaram day: ${d.river} sam dy. Khatar kam dy, os hits kar pakar na dy. Mung ba mudam gorо.`,
    ps: `${d.name} نن آرام دی: ${d.river} ثابت دی. خطر کم دی، اوس هېڅ کار پکار نه دی. موږ به مو تعقیب کوو.`,
  };
}

export default function Hero() {
  const [selected, setSelected] = useState("nowshera");
  const [lang, setLang] = useState("en");
  const [demo, setDemo] = useState({ status: "idle", alert: null });
  const [speaking, setSpeaking] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const autoSpeakRef = useRef(false);
  const timerRef = useRef(null);

  const district = DISTRICTS.find((d) => d.key === selected);
  const risk = RISK_META[district.risk];
  const RiskIcon = risk.icon;

  const fetchFloodStatus = async (key) => {
    try {
      // Use Next.js API route instead of calling backend directly
      // This prevents CORS issues and centralizes API communication
      const response = await fetch('/api/flood-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district: key, coordinates: [] })
      });
      
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      if (response.ok) {
        const d = DISTRICTS.find((x) => x.key === key);
        return { status: "ready", alert: buildAlert({ ...d, ...responseData }) };
      } else {
        console.error('API Error:', responseData);
        throw new Error(responseData.error || 'API request failed');
      }
    } catch (error) {
      console.warn('Real data unavailable, using mock data:', error.message);
      const d = DISTRICTS.find((x) => x.key === key);
      return { status: "ready", alert: buildAlert(d) };
    }
  };

  const checkStatus = (key) => {
    setSelected(key);
    setDemo({ status: "loading", alert: null });
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      const result = await fetchFloodStatus(key);
      setDemo(result);
    }, 550);
  };

  const speak = () => {
    if (!demo.alert || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const text = demo.alert[lang];
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.lang = lang === "ps" ? "ur-PK" : "en-US";
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (demo.status === "ready" && autoSpeakRef.current) {
      autoSpeakRef.current = false;
      speak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo.status]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCtaClick = () => {
    autoSpeakRef.current = true;
    checkStatus(selected);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) return;
    setSubscribed(true);
  };

  return (
    <section className="relative h-dvh w-full overflow-hidden font-sans">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/hero-bg.webp"
          alt="Aerial view of flood-damaged river valley in Khyber Pakhtunkhwa"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b md:bg-linear-to-r from-ink via-ink/85 to-ink/40" />
        <div className="absolute inset-0 bg-linear-to-t from-ink via-transparent to-ink/50" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between px-4 py-2.5 sm:px-8 sm:py-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.webp"
              alt="Ailaan logo"
              width={36}
              height={36}
              className="h-7 w-7 object-contain sm:h-9 sm:w-9"
              priority
            />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight text-mist sm:text-xl">
                Ailaan
              </span>
              <span className="hidden text-[11px] font-medium text-mist/50 sm:block">
                Flood alerts for KPK
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <a
              href="https://github.com/juwwad/ailaan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/6 px-3 py-2 text-xs font-semibold text-mist/90 backdrop-blur-xl transition hover:bg-white/12 sm:text-sm"
            >
              <GithubMark className="h-4 w-4" />
              <span className="hidden sm:inline">Source</span>
            </a>
            <a
              href="https://github.com/juwwad"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/6 px-3 py-2 text-xs font-semibold text-mist/90 backdrop-blur-xl transition hover:bg-white/12 sm:text-sm"
            >
              <span className="hidden text-mist/50 sm:inline">By</span>
              Jawad Ahmad
            </a>
          </nav>
        </header>

        {/* Content */}
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col items-center justify-start gap-3 overflow-y-auto px-4 pb-3 sm:justify-center sm:gap-5 sm:px-8 sm:pb-8 md:flex-row md:gap-10">
          {/* Left: pitch */}
          <div className="flex w-full flex-col gap-2 sm:gap-4 md:w-[52%] lg:w-[55%]">
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-signal-soft sm:block sm:text-xs">
              Khyber Pakhtunkhwa · Early warning
            </span>
            <h1 className="text-[clamp(1.35rem,5.6vw,3.1rem)] font-extrabold leading-[1.08] tracking-tight text-mist">
              &ldquo;450,000 cusecs&rdquo; means nothing.{" "}
              <span className="text-signal-soft">
                &ldquo;Makham pore tar khpo khpo oba&rdquo;
              </span>{" "}
              means everything.
            </h1>
            <p className="hidden max-w-md text-sm text-mist/70 sm:block sm:text-base">
              Ailaan turns satellite flood data into a warning anyone can
              hear — in Pashto, Roman Pashto or English. No reading
              required, no app to install.
            </p>

            <div className="mt-0.5 flex flex-wrap items-center gap-3 sm:mt-1">
              <button
                onClick={handleCtaClick}
                className="rounded-full bg-signal px-5 py-2.5 text-sm font-bold text-ink shadow-[0_0_45px_rgba(63,198,240,0.4)] transition hover:scale-[1.03] active:scale-95 sm:px-6 sm:py-3 sm:text-base"
              >
                Hear a live warning
              </button>
              <span className="hidden text-xs text-mist/50 sm:inline sm:text-sm">
                Try the demo — pick any district on the right →
              </span>
            </div>

            <div className="hidden flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-mist/55 sm:mt-1 sm:flex sm:text-xs">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> 5 districts watched
              </span>
              <span className="flex items-center gap-1.5">
                <Languages size={13} /> 3 languages
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={13} /> Delivered on WhatsApp
              </span>
            </div>
          </div>

          {/* Right: interactive glass demo */}
          <div className="flex w-full max-w-lg shrink-0 flex-col gap-2.5 rounded-3xl border border-white/15 bg-white/[0.07] p-3.5 shadow-2xl backdrop-blur-2xl sm:gap-4 sm:p-6 md:w-[46%] lg:w-[40%]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-mist/50">
                Try it — tap a district
              </span>
            </div>

            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
              {DISTRICTS.map((d) => {
                const isActive = d.key === selected;
                return (
                  <button
                    key={d.key}
                    onClick={() => checkStatus(d.key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
                      isActive
                        ? "border-signal/70 bg-signal/15 text-mist"
                        : "border-white/10 bg-white/4 text-mist/60 hover:bg-white/9"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: RISK_META[d.risk].color }}
                    />
                    {d.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div
                className="risk-pulse relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-20 sm:w-20"
                style={{
                  background: `${risk.color}26`,
                  border: `2px solid ${risk.color}`,
                  "--ring-color": risk.color,
                }}
              >
                <RiskIcon size={20} color={risk.color} />
              </div>
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <span className="text-sm font-bold text-mist sm:text-lg">
                  {district.name}
                </span>
                <span className="font-mono text-[10px] text-mist/50 sm:text-[11px]">
                  {district.river} · {district.discharge.toLocaleString()}{" "}
                  cusecs
                </span>
                <span
                  className="w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: `${risk.color}22`, color: risk.color }}
                >
                  {risk.label}
                </span>
              </div>
            </div>

            <div className="flex gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLang(l.key)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    lang === l.key
                      ? "bg-white/20 text-mist"
                      : "bg-white/4 text-mist/50 hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div
              className="min-h-[3.2rem] rounded-xl border border-white/10 bg-ink/40 p-2.5 text-[12.5px] leading-snug text-mist/85 sm:min-h-[4.2rem] sm:p-3 sm:text-[13px]"
              dir={LANGUAGES.find((l) => l.key === lang)?.dir || "ltr"}
            >
              {demo.status === "loading" && (
                <span className="text-mist/40">Reading the river…</span>
              )}
              {demo.status === "idle" && (
                <span className="text-mist/40">
                  Pick a district above, then press play — you&rsquo;ll hear
                  the warning out loud.
                </span>
              )}
              {demo.status === "ready" && (
                <span className="animate-rise line-clamp-3">
                  {demo.alert[lang]}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={speak}
                disabled={!demo.alert}
                aria-label="Speak the warning aloud"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-30 sm:h-11 sm:w-11 ${
                  speaking
                    ? "risk-pulse bg-signal text-ink"
                    : "bg-white/10 text-mist hover:bg-white/18"
                }`}
                style={{ "--ring-color": "#3fc6f0" }}
              >
                <Volume2 size={18} />
              </button>
              <p className="text-[11px] text-mist/50">
                Works even if you can&rsquo;t read — press play to listen.
              </p>
            </div>

            <div className="border-t border-white/10 pt-2.5 sm:pt-3">
              {!subscribeOpen && !subscribed && (
                <button
                  onClick={() => setSubscribeOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-signal-soft hover:text-mist"
                >
                  <Phone size={13} /> Get this on WhatsApp
                </button>
              )}
              {subscribeOpen && !subscribed && (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-mist placeholder:text-mist/35 outline-none focus:border-signal/60"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal text-ink transition hover:scale-105"
                  >
                    <Send size={14} />
                  </button>
                </form>
              )}
              {subscribed && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-risk-low">
                  <CheckCircle2 size={14} /> You&rsquo;re on the list —
                  alerts head to your WhatsApp.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
