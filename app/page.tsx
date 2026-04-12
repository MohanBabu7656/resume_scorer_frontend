"use client";

import { useState, useRef, useCallback } from "react";

interface ScoreResult {
  filename: string;
  grade: string;
  overall_score: number;
  ats_score: number;
  skills_score: number;
  experience_score: number;
  formatting_score: number;
  grammar_score: number;
  job_match_score?: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: any[];
  missing_keywords: string[];
  matched_keywords: string[];
  summary: string;
  stats?: {
    pages: number;
    word_count: number;
    word_count_optimal: boolean;
  };
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://resume-scorer-backend-mohanbabu7656s-projects.vercel.app";

function getColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function getLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
}

function RingScore({
  score,
  label,
  size = 140,
  strokeWidth = 10,
}: {
  score: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = size / 2 - strokeWidth;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.3s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black leading-none" style={{ fontSize: size > 100 ? "2.2rem" : "1.4rem", color }}>
            {score}
          </span>
          <span className="text-slate-400 text-xs mt-0.5">{label}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: string }) {
  const color = getColor(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-300">
          <span>{icon}</span>{label}
        </span>
        <span className="font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#334155" }}>
        <div className="h-full rounded-full score-bar" style={{ width: `${score}%`, background: color, transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState<"upload" | "result">("upload");
  const [mode, setMode] = useState<"resume" | "job">("resume");
  const fileRef = useRef<HTMLInputElement>(null);
  const [privacyPolicy, setPrivacyPolicy] = useState<any>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const fetchPrivacyPolicy = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/privacy-policy`);
      if (res.ok) {
        const data = await res.json();
        setPrivacyPolicy(data);
        setShowPrivacy(true);
      }
    } catch (err) {
      console.error("Failed to fetch privacy policy:", err);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
  }, []);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      
      // 1. Backend expects the file key to be "file", not "resume"
      body.append("file", file); 
      
      if (mode === "job") {
        body.append("job_description", jobDesc);
        body.append("job_title", jobTitle); 
      }
      
      // 3. Use the correct endpoints from your old backend code
      const endpoint = mode === "job" ? "/api/score-job-match" : "/api/score-resume";
      
      const res = await fetch(`${BACKEND_URL}${endpoint}`, { method: "POST", body });
      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        let errMsg = "An error occurred while processing the request.";
        if (data.detail) {
          if (typeof data.detail === "string") {
            errMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            // Directly map the exact error messages from the backend array
            errMsg = data.detail.map((err: any) => err.msg || JSON.stringify(err)).join(", ");
          } else if (typeof data.detail === "object") {
            errMsg = data.detail.message || JSON.stringify(data.detail);
            if (data.detail.reasons && Array.isArray(data.detail.reasons)) {
              errMsg += " - " + data.detail.reasons.join(", ");
            }
            if (data.detail.error) {
              errMsg += ` (${data.detail.error})`;
            }
          }
        } else if (data.error) {
          errMsg = data.error;
        } else {
          errMsg = `Error ${res.status}: ${res.statusText}`;
        }
        throw new Error(errMsg);
      }

      // 4. Map the old backend's nested JSON to the new UI's ScoreResult interface
      const mappedData: ScoreResult = {
        filename: data.filename || file.name,
        grade: data.grade || "N/A",
        overall_score: data.scores?.overall || 0,
        ats_score: data.scores?.ats || 0,
        skills_score: data.scores?.skills || 0,
        experience_score: data.scores?.experience || 0,
        formatting_score: data.scores?.formatting || 0,
        grammar_score: data.scores?.grammar || 0,
        job_match_score: data.job_match?.match_score,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        suggestions: data.suggestions || [],
        missing_keywords: data.job_match?.missing_keywords || [],
        matched_keywords: data.job_match?.matched_keywords || [],
        summary: data.feedback?.summary || `Analyzed ${data.stats?.word_count || 0} words across ${data.stats?.pages || 0} pages.`,
        stats: data.stats
      };

      setResult(mappedData);
      setTab("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scoring failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null); setFile(null); setJobDesc(""); setError(null);
    setTab("upload"); setMode("resume");
  };

  return (
    <main className="min-h-screen" style={{ background: "#0f172a" }}>

      {/* HEADER */}
      <header className="relative border-b" style={{ borderColor: "#334155" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-96" style={{ background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.7),transparent)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 0%,rgba(124,58,237,0.12) 0%,transparent 70%)" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>RS</div>
            <span className="text-lg font-semibold tracking-tight">ResumeScore<span style={{ color: "#7c3aed" }}>.ai</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm">
            {["How It Works", "Examples", "Pricing"].map(item => (
              <button key={item} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">{item}</button>
            ))}
          </div>
        </div>

        {/* HERO */}
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs mb-6 border" style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)", color: "#a78bfa" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#7c3aed" }} />
            Powered by AI · Instant Analysis · ATS-Optimized
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4" style={{ background: "linear-gradient(170deg,#ffffff 40%,#64748b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Score Your Resume<br />
            <span style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Before Recruiters Do
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Get instant ATS compatibility scores, keyword analysis, and personalized feedback to land your next role faster.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-10">
            {[{ v: "124K+", l: "Resumes Scored" }, { v: "96.2%", l: "ATS Accuracy" }, { v: "+38%", l: "Avg Score Boost" }, { v: "< 5s", l: "Analysis Time" }].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-2xl font-black text-white">{s.v}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl p-1 w-fit mb-8 border" style={{ background: "#1e293b", borderColor: "#334155" }}>
          {([["upload", "📄 Upload Resume"], ["result", "📊 View Results"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => (key === "upload" || result) && setTab(key as "upload" | "result")} disabled={key === "result" && !result}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={tab === key ? { background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }
                : { color: key === "result" && !result ? "#374151" : "#94a3b8", cursor: key === "result" && !result ? "not-allowed" : "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        {/* UPLOAD TAB */}
        {tab === "upload" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">

              {/* Mode toggle */}
              <div className="flex rounded-xl p-1 gap-1 border" style={{ background: "#1e293b", borderColor: "#334155" }}>
                {(["resume", "job"] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={mode === m ? { background: "#334155", color: "white" } : { color: "#64748b" }}>
                    {m === "resume" ? "📄 Score Resume Only" : "🎯 Match to Job"}
                  </button>
                ))}
              </div>

              {/* Drop zone */}
              <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                onDrop={handleDrop} onClick={() => fileRef.current?.click()}
                className="relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300"
                style={{ minHeight: 220, borderColor: dragging ? "#7c3aed" : file ? "#10b981" : "#334155", background: dragging ? "rgba(124,58,237,0.07)" : file ? "rgba(16,185,129,0.04)" : "#1e293b" }}>
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                  {file ? (
                    <>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border" style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)" }}>✅</div>
                      <div>
                        <p className="font-semibold truncate max-w-xs" style={{ color: "#10b981" }}>{file.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border" style={{ background: "#334155", borderColor: "#475569" }}>📄</div>
                      <div>
                        <p className="font-semibold text-white">Drop your resume here</p>
                        <p className="text-sm text-slate-500 mt-1">PDF only · Max 10 MB</p>
                      </div>
                      <div className="px-5 py-2 rounded-xl text-sm border" style={{ background: "#334155", borderColor: "#475569", color: "#94a3b8" }}>Browse files</div>
                    </>
                  )}
                </div>
              </div>

              {/* Job desc */}
              {mode === "job" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Job Title
                    </label>
                    <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full rounded-2xl p-4 text-sm outline-none"
                      style={{ background: "#1e293b", border: "1.5px solid #334155", color: "#e2e8f0" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Job Description <span className="text-slate-500 font-normal">(paste full JD for best results)</span>
                    </label>
                    <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)}
                      placeholder="Paste the job description here..." rows={6}
                      className="w-full rounded-2xl p-4 text-sm resize-none outline-none"
                      style={{ background: "#1e293b", border: "1.5px solid #334155", color: "#e2e8f0" }} />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-2xl p-4 text-sm border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#f87171" }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={!file || loading} className="w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300"
                style={!file || loading
                  ? { background: "#334155", color: "#94a3b8", cursor: "not-allowed" }
                  : { background: "linear-gradient(135deg,#7c3aed 0%,#06b6d4 100%)", color: "white", boxShadow: "0 4px 24px rgba(124,58,237,0.4)" }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                    Analyzing your resume...
                  </span>
                ) : `⚡ ${mode === "job" ? "Score Against Job Description" : "Score My Resume"}`}
              </button>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">What you&apos;ll get</p>
              {[
                { icon: "🎯", title: "ATS Compatibility Score", desc: "See exactly how well your resume passes Applicant Tracking Systems used by 98% of Fortune 500 companies.", color: "#7c3aed" },
                { icon: "📊", title: "Multi-Dimensional Breakdown", desc: "Separate scores for ATS compatibility, content quality, formatting, and keyword density.", color: "#06b6d4" },
                { icon: "🔍", title: "Missing Keyword Detection", desc: "Identify critical keywords missing from your resume that recruiters and ATS systems look for.", color: "#10b981" },
                { icon: "💡", title: "Actionable Improvements", desc: "Get specific, prioritized suggestions to boost your score and increase interview callback rates.", color: "#f59e0b" },
              ].map(f => (
                <div key={f.title} className="flex gap-4 rounded-2xl p-4 border" style={{ background: "#1e293b", borderColor: "#334155" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: `${f.color}18`, border: `1px solid ${f.color}33` }}>{f.icon}</div>
                  <div>
                    <p className="font-semibold text-sm text-white">{f.title}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {tab === "result" && result && (
          <div className="space-y-6">

            {/* Hero result card */}
            <div className="relative overflow-hidden rounded-3xl p-8 border" style={{ background: "#1e293b", borderColor: "#334155" }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 50% 80% at 15% 50%,${getColor(result.overall_score)}18 0%,transparent 60%)` }} />
              <div className="relative flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <RingScore score={result.overall_score} label="Overall" size={160} strokeWidth={12} />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col gap-2 mb-4">
                    <h2 className="text-2xl font-black text-white truncate" title={result.filename}>
                      Results for {result.filename}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xl font-black px-3 py-1 rounded-xl" style={{ background: `${getColor(result.overall_score)}22`, color: getColor(result.overall_score) }}>
                        Grade: {result.grade}
                      </span>
                      {result.stats && (
                        <div className="flex items-center gap-3 text-xs font-medium px-3 py-1.5 rounded-xl border" style={{ background: "#334155", borderColor: "#475569", color: "#f8fafc" }}>
                          <span>📄 {result.stats.pages} {result.stats.pages === 1 ? 'page' : 'pages'}</span>
                          <span>📝 {result.stats.word_count} words</span>
                          <span style={{ color: result.stats.word_count_optimal ? "#10b981" : "#ef4444" }}>
                            {result.stats.word_count_optimal ? '✅ Optimal length' : '❌ Suboptimal length'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{result.summary}</p>
                  <div className="space-y-3">
                    <ScoreBar label="ATS Compatibility" score={result.ats_score} icon="🤖" />
                    <ScoreBar label="Skills Match" score={result.skills_score} icon="🛠️" />
                    <ScoreBar label="Experience" score={result.experience_score} icon="💼" />
                    <ScoreBar label="Formatting" score={result.formatting_score} icon="🗂️" />
                    <ScoreBar label="Grammar" score={result.grammar_score} icon="✍️" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3-col details */}
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { title: "Strengths", icon: "✅", color: "#10b981", items: result.strengths, emptyMsg: "Strong overall structure", bullet: "text-emerald-500" },
                { title: "Weaknesses", icon: "⚠️", color: "#ef4444", items: result.weaknesses, emptyMsg: "No major weaknesses found", bullet: "text-red-500" },
              ].map(col => (
                <div key={col.title} className="rounded-3xl p-6 border space-y-4" style={{ background: "#1e293b", borderColor: "#334155" }}>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: `${col.color}18`, border: `1px solid ${col.color}25` }}>{col.icon}</span>
                    <span style={{ color: col.color }}>{col.title}</span>
                  </h3>
                  <ul className="space-y-3">
                    {(col.items?.length ? col.items : [col.emptyMsg]).map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className={`${col.bullet} mt-0.5 flex-shrink-0 text-xs`}>▸</span>
                        <span className="text-slate-300 leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Keywords (Only show if job matching was performed) */}
              {result.job_match_score !== undefined && (
                <div className="rounded-3xl p-6 border space-y-4" style={{ background: "#1e293b", borderColor: "#334155" }}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: "rgba(6,182,212,0.18)", border: "1px solid rgba(6,182,212,0.25)" }}>🎯</span>
                      <span style={{ color: "#06b6d4" }}>Job Match Analysis</span>
                    </h3>
                    <span className="text-sm font-bold" style={{ color: getColor(result.job_match_score) }}>
                      {result.job_match_score}% Match
                    </span>
                  </div>
                  {result.missing_keywords?.length > 0 && (
                    <>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Missing Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {result.missing_keywords.map((kw, i) => (
                          <span key={i} className="text-xs rounded-xl px-3 py-1 border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171" }}>{kw}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {result.matched_keywords?.length > 0 && (
                    <>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-2">Matched Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {result.matched_keywords.slice(0, 8).map((kw, i) => (
                          <span key={i} className="text-xs rounded-xl px-3 py-1 border" style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)", color: "#34d399" }}>{kw}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {!result.missing_keywords?.length && !result.matched_keywords?.length && (
                    <p className="text-sm text-slate-500">🎉 No critical keywords missing!</p>
                  )}
                </div>
              )}
            </div>

            {/* Suggestions for Improvement */}
            {result.suggestions?.length > 0 && (
              <div className="rounded-3xl p-6 border space-y-4" style={{ background: "#1e293b", borderColor: "#334155" }}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.25)" }}>💡</span>
                  <span style={{ color: "#f59e0b" }}>Actionable Suggestions</span>
                </h3>
                <ul className="grid md:grid-cols-2 gap-4">
                  {result.suggestions.map((item, i) => (
                    typeof item === "string" ? (
                      <li key={i} className="flex gap-2.5 text-sm col-span-full">
                        <span className="text-amber-500 mt-0.5 text-xs flex-shrink-0">▸</span>
                        <span className="text-slate-300 leading-relaxed">{item}</span>
                      </li>
                    ) : (
                      <li key={i} className="rounded-2xl p-4 border space-y-3" style={{ background: "#0f172a", borderColor: "#334155" }}>
                        {item.section && (
                          <div className="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(139,92,246,0.1)", color: "#c4b5fd" }}>
                            {item.section}
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Current</span>
                          <p className="text-sm text-slate-400 italic mt-1">&quot;{item.current}&quot;</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Suggested</span>
                          <p className="text-sm text-slate-200 mt-1">{item.suggested}</p>
                        </div>
                        {item.reason && (
                          <div className="pt-3 mt-3 border-t" style={{ borderColor: "rgba(51,65,85,0.5)" }}>
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Reason</span>
                            <p className="text-sm text-slate-300 mt-1">{item.reason}</p>
                          </div>
                        )}
                      </li>
                    )
                  ))}
                </ul>
              </div>
            )}

            {/* Score rings row */}
            <div className="rounded-3xl p-6 border" style={{ background: "#1e293b", borderColor: "#334155" }}>
              <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold mb-6">Score Breakdown</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
                <RingScore score={result.ats_score} label="ATS" size={110} strokeWidth={9} />
                <RingScore score={result.skills_score} label="Skills" size={110} strokeWidth={9} />
                <RingScore score={result.experience_score} label="Experience" size={110} strokeWidth={9} />
            {result.job_match_score !== undefined ? (
              <RingScore score={result.job_match_score} label="Job Match" size={110} strokeWidth={9} />
            ) : (
              <RingScore score={result.formatting_score} label="Formatting" size={110} strokeWidth={9} />
            )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button onClick={reset} className="px-6 py-3 rounded-2xl text-sm border transition-all" style={{ background: "#1e293b", borderColor: "#334155", color: "#94a3b8" }}>
                ← Score Another Resume
              </button>
              <button onClick={() => window.print()} className="px-6 py-3 rounded-2xl text-sm border" style={{ background: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.3)", color: "#a78bfa" }}>
                🖨️ Export Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t mt-20 py-8" style={{ borderColor: "#334155" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>RS</div>
            <span>© 2025 ResumeScore.ai</span>
          </div>
          <div className="flex gap-6">
            <button onClick={fetchPrivacyPolicy} className="hover:text-slate-300 transition-colors text-left">Privacy Policy</button>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* PRIVACY MODAL */}
      {showPrivacy && privacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{privacyPolicy.title}</h2>
              <button onClick={() => setShowPrivacy(false)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-4 text-slate-300 text-sm">
              <p><strong className="text-white">Data Collection:</strong> {privacyPolicy.data_collection}</p>
              <p><strong className="text-white">Data Usage:</strong> {privacyPolicy.data_usage}</p>
              <p><strong className="text-white">Data Retention:</strong> {privacyPolicy.data_retention}</p>
              <p><strong className="text-white">Third Party:</strong> {privacyPolicy.third_party_sharing}</p>
              <p><strong className="text-white">Security:</strong> {privacyPolicy.security}</p>
            </div>
            <button onClick={() => setShowPrivacy(false)} className="mt-8 w-full py-3 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors">
              Got it, close
            </button>
          </div>
        </div>
      )}

    </main>
  );
}