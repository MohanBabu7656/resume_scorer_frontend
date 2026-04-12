import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeScore.ai — AI-Powered ATS Resume Scorer",
  description:
    "Get your resume scored instantly against ATS systems. Upload your PDF and receive a detailed breakdown of ATS compatibility, keyword match, content quality, and actionable improvements.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}