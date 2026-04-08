# Resume Scorer UI

A Next.js frontend application for the Resume Scorer system. This application allows users to upload their resumes, provide a job description, and receive a detailed analysis and score of their resume against the job description. It interfaces with the Resume Scorer backend.

## Features

- **Resume Upload**: Upload PDF/Text resumes.
- **Job Description**: Provide a target job description.
- **Real-time Chat**: Chat with the AI assistant about your resume, get improvement tips, and receive a score (e.g., A+, B, etc.).
- **Privacy Policy & Usage Info**: Dedicated endpoint for privacy and usage information.
- **Vercel Deployment**: Easy to deploy directly to Vercel.

## Quickstart Setup

### 1. Clone repo

```shell
git clone <your-repo-url>
cd resume_scorer_frontend
```

### 2. Set your Environment Variables

Create a `.env` file from the example:
```shell
cp .env.example .env
```

Ensure you set the appropriate API keys for your backend/OpenAI configuration in your `.env` file.

### 3. Install dependencies

```shell
npm install
```

### 4. Run Locally

```shell
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000).

## Deployment

You can seamlessly deploy this application using Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Make sure to configure the necessary Environment Variables in your Vercel project settings to match your local `.env` setup.

## Project Structure

- `app/page.tsx`: Main chat interface and resume uploading.
- `app/api/assistants/`: API routes handling communication with the OpenAI Assistant / custom backend.
- `app/components/`: Reusable UI components including the chat and file upload sections.
