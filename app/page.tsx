"use client";

import React, { useState } from "react";
import styles from "./page.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a resume PDF.");
      return;
    }
    if ((jobTitle && !jobDescription) || (!jobTitle && jobDescription)) {
      setError("Please provide both Job Title and Job Description, or neither.");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (jobTitle) formData.append("job_title", jobTitle);
    if (jobDescription) formData.append("job_description", jobDescription);

    try {
      const response = await fetch(`${BACKEND_URL}/api/score-resume`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "An error occurred while scoring the resume.");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>AI Resume Scorer</h1>
        <p className={styles.subtitle}>
          Upload your resume and a target job description to get instant feedback and an ATS match score.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="resume">Resume (PDF)</label>
            <input
              type="file"
              id="resume"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="jobTitle">Job Title (Optional)</label>
            <input
              type="text"
              id="jobTitle"
              placeholder="e.g. Software Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="jobDescription">Job Description (Optional)</label>
            <textarea
              id="jobDescription"
              placeholder="Paste the job description here..."
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Scoring..." : "Score My Resume"}
          </button>
        </form>

        <div className={styles.privacyLink}>
          <button type="button" onClick={fetchPrivacyPolicy} className={styles.linkBtn}>
            View Data Privacy & Usage Policy
          </button>
        </div>

        {showPrivacy && privacyPolicy && (
          <div className={styles.privacyModal}>
            <div className={styles.modalContent}>
              <h2>{privacyPolicy.title}</h2>
              <p><strong>Data Collection:</strong> {privacyPolicy.data_collection}</p>
              <p><strong>Data Usage:</strong> {privacyPolicy.data_usage}</p>
              <p><strong>Data Retention:</strong> {privacyPolicy.data_retention}</p>
              <p><strong>Third Party:</strong> {privacyPolicy.third_party_sharing}</p>
              <p><strong>Security:</strong> {privacyPolicy.security}</p>
              <button onClick={() => setShowPrivacy(false)}>Close</button>
            </div>
          </div>
        )}

        {result && (
          <div className={styles.results}>
            <h2>Results for {result.filename}</h2>
            <div className={styles.gradeBadge}>Grade: {result.grade}</div>

            <div className={styles.scoreGrid}>
              <div className={styles.scoreCard}>
                <h3>Overall Score</h3>
                <div className={styles.scoreValue}>{result.scores?.overall}/100</div>
              </div>
              <div className={styles.scoreCard}>
                <h3>ATS Match</h3>
                <div className={styles.scoreValue}>{result.scores?.ats}/100</div>
              </div>
              <div className={styles.scoreCard}>
                <h3>Skills</h3>
                <div className={styles.scoreValue}>{result.scores?.skills}/100</div>
              </div>
              <div className={styles.scoreCard}>
                <h3>Experience</h3>
                <div className={styles.scoreValue}>{result.scores?.experience}/100</div>
              </div>
            </div>

            {result.job_match && (
              <div className={styles.section}>
                <h3>Job Match Analysis ({result.job_match.match_score}%)</h3>
                <div className={styles.lists}>
                  <div>
                    <h4>Matched Keywords</h4>
                    <ul>
                      {result.job_match.matched_keywords?.map((kw: string, i: number) => (
                        <li key={i}>{kw}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Missing Keywords</h4>
                    <ul>
                      {result.job_match.missing_keywords?.map((kw: string, i: number) => (
                        <li key={i}>{kw}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h3>Strengths</h3>
              <ul>
                {result.strengths?.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            <div className={styles.section}>
              <h3>Weaknesses</h3>
              <ul>
                {result.weaknesses?.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            <div className={styles.section}>
              <h3>Suggestions for Improvement</h3>
              <ul>
                {result.suggestions?.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
