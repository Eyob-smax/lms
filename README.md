# 🎓 Enterprise Internal LMS — Developer Hiring Assessment

<div align="center">
  <img src="https://img.shields.io/badge/Next.js_16-App_Router-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/NestJS-Enterprise_API-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma_ORM-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/AI_Powered-Authoring_Workflow-4D44E3?style=for-the-badge&logo=openai" alt="AI Powered" />
</div>

---

## 🏢 1. Executive Summary & BPO Context

This repository contains a full-stack, enterprise-grade **Learning Management System (LMS)** designed specifically for Business Process Outsourcing (BPO) organizations. In a dynamic BPO environment managing diverse service lines—including **Sales, SDR, BDR, Customer Support, Telemarketing, IT Support, and HR**—rapid onboarding, continuous product training, and rigorous compliance evaluation are critical to client success.

This platform bridges the gap between static content libraries and frontline operational readiness by delivering:
1. **An Admin Panel** for Trainers, Team Leads, and L&D specialists to build structured curricula, execute batch cohort assignments, and analyze performance trends.
2. **An Agent Panel** for frontline trainees to navigate sequential coursework, complete interactive assessments, track personal mastery, and earn audit-ready compliance certificates.
3. **A Human-in-the-Loop AI Authoring Workflow** that assists trainers in drafting rich Markdown courses and scenario-based question banks without sacrificing editorial oversight or pedagogical accuracy.

---

## 🛠️ 2. Tech Stack Justification & Architecture

The application is structured as an **Nx Monorepo**, ensuring unified type safety, code sharing, and streamlined CI/CD pipelines across the frontend and backend.

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 16 (App Router)** + TypeScript + Tailwind CSS | Provides React Server Components (RSC) for optimized initial page loads, dynamic client components for rich interactivity, and file-system routing. Tailwind CSS delivers premium aesthetics with zero runtime styling overhead. |
| **Backend** | **NestJS (Node.js/Express)** + TypeScript | Offers an enterprise-grade modular architecture with dependency injection, strict validation pipes (`class-validator`), and declarative decorators for authentication, logging, and caching. |
| **Database** | **PostgreSQL** with **Prisma ORM** | **Why Relational?** LMS domain data is inherently relational: users belong to departments, courses contain ordered modules and lessons, quizzes contain structured questions, and enrollments track many-to-many user-course interactions. PostgreSQL guarantees ACID compliance, relational integrity, and robust JSON/Array querying for tags and analytics. |
| **Auth & Security** | **JWT (Stateless Bearer Tokens)** + Role-Based Access Control (RBAC) | Implemented via custom NestJS `@UseGuards(JwtAuthGuard, RolesGuard)` and custom decorators (`@Roles(Role.ADMIN)`). Enforces strict session invalidation upon role changes to prevent privilege escalation. |
| **AI Engine** | **Multi-Provider LLM Service** (Anthropic Claude / OpenAI / Gemini) | Integrated via a dedicated `AiService` in NestJS. Uses structured schema prompts and robust fallback JSON normalization to synthesize courses and pedagogical assessments cleanly. |
| **Deployment** | **Docker & Docker Compose** | Fully containerized with multi-stage builds (`node:20-alpine`), reducing image footprint and ensuring parity across staging and production environments. |

---

## 👥 3. System Overview — Two Distinct Panels

### 👑 3.1 Admin Panel (Trainer / Team Lead / L&D Role)
* **Course & Content Management:** Create, update, archive, and publish courses with structured metadata (Title, Description, Category, Difficulty, Estimated Duration, Tags, Mandatory flags). Supports full Markdown editing with live previews and multi-lesson sequencing (Text, Video links/embeds, PDF/Slide attachments).
* **AI-Assisted Course Authoring Workflow:** Designed with product judgment: trainers input a topic, target BPO role, and learning objective to generate a draft curriculum and assessment. **Crucially, this is not a blind "one-click generate" button.** The draft is loaded into an interactive editor where trainers review, refine, regenerate, or discard content prior to publishing.
* **Assessment Management:** Build configurable MCQ quizzes tied to coursework. Features custom passing score thresholds (e.g., 80%), attempt limits (e.g., 3 attempts), question order randomization, and AI question bank generation with detailed answer rationales.
* **Batch Cohort & Assignment Management:** Assign courses individually or in bulk to entire BPO departments (e.g., *"All SDRs"* or *"New Hires — Customer Support Batch 3"*). Supports mandatory flags and hard due dates.
* **Progress Reporting & QA Exports:** Executive analytics dashboard displaying completion velocities, score distributions, and skill gap radar charts. Includes **one-click CSV Export** (`LMS_BPO_QA_Review_Report.csv` and `LMS_Agent_Roster_Export.csv`) formatted specifically for team leads during 1:1 coaching sessions and client QA audits.
* **Tokenized User Management:** Admins invite new frontline agents via email. Instead of transmitting insecure temporary passwords, the system dispatches a cryptographic 32-byte registration link (`/accept-invite`), enabling users to set their own credentials securely.

### 🎯 3.2 Agent Panel (Frontline Trainee Role)
* **Seamless Onboarding & Role Selection:** Agents register or accept invitations by selecting their designated BPO service line (Sales, SDR, BDR, Customer Support, Telemarketing, IT, HR). Upon sign-in, they are routed immediately to their personalized learning dashboard.
* **Dynamic Learning Dashboard:** Visualizes active course assignments, upcoming due dates, completion percentages, and mandatory compliance badges.
* **Sequential Course Navigation:** Guided step-by-step progress through lessons with persistent state tracking, allowing trainees to resume exactly where they left off between shifts.
* **Interactive Assessment Engine:** Real-time quiz execution with randomized option rendering, attempt tracking, immediate feedback release, and automatic score calculations.
* **Audit-Ready Compliance Certificates:** Upon passing mandatory training, trainees can generate and download official **PDF Certificates of Completion** powered by `@react-pdf/renderer` for client audit compliance.

---

## 🧠 4. Product Judgment & BPO-Specific Touches

1. **Strict Separation of Duties:** Admins and Trainers are intentionally restricted from enrolling in frontline courses. This prevents test-attempt skewing and maintains clean metrics on learner dashboards.
2. **Tokenized Invitation Onboarding:** Solves the common BPO security vulnerability of sending plaintext passwords over chat or email. Users must verify their token and establish a hashed password before account activation.
3. **CSV Export for 1:1 Coaching Calls:** Recognizing that team leads spend hours in weekly 1:1s reviewing agent performance, we added instant CSV data exports with granular completion dates and score metrics.
4. **Mandatory Compliance Tagging:** Courses can be flagged as `isMandatory`, highlighting them with high-priority UI badges on frontline dashboards to ensure 100% adherence to client regulatory standards.

---

## 📐 5. Data Modeling & RBAC Architecture

The relational database schema is modeled in `schema.prisma` to support scalable BPO hierarchies:

```
[User] 1 <---> * [Enrollment] * <---> 1 [Course]
  |                                        |
  +---> 1 <---> * [Verification]           +---> 1 <---> * [Module] 1 <---> * [Lesson]
  |                                        |
  +---> 1 <---> * [QuizAttempt]            +---> 1 <---> * [Quiz] 1 <---> * [QuizQuestion]
```

* **Role-Based Access Control:** Enforced via NestJS metadata guards. When a user's role is modified by an admin, the system invalidates active sessions, forcing a clean re-authentication that routes the user to their new domain.
* **Enrollment Tracking:** The `Enrollment` model utilizes a composite unique key `@@unique([userId, courseId])`, storing real-time progress (`overallProgressPct`), completion timestamps, and final quiz scores.

---

## 💡 6. Whiteboard Demonstration: Explain-Only Features

As required by Section 5 of the evaluation guidelines, the following features were **not implemented in code** to preserve build scope, but are architected below to demonstrate system-design reasoning, edge-case handling, and scalability.

### 🎙️ Explain-Only Feature 1: Text-to-Speech (TTS) for Module Audio Tracks
* **Problem:** Frontline BPO agents often learn better through auditory reinforcements or need accessibility accommodations while reviewing long-form product documentation.
* **Architectural Workflow:**
  1. **Asynchronous Generation on Publish:** To prevent blocking HTTP request timeouts during course creation, TTS audio generation should **not** occur on-demand when an agent opens a lesson. Instead, when an Admin clicks *Publish*, a NestJS event emits to a background job queue (**BullMQ** backed by **Redis**).
  2. **Text Chunking & Sanitization:** Markdown text is stripped of code blocks and HTML tags, then split by natural paragraph boundaries into chunks under 4,000 characters (matching limits for APIs like **OpenAI Audio (`tts-1-hd`)** or **ElevenLabs**).
  3. **Voice Persona Selection:** During the AI authoring workflow, admins select a voice persona tailored to the BPO service line (e.g., an authoritative, clear tone for *Compliance & IT*, or an empathetic, conversational tone for *Customer Support*).
  4. **Storage & CDN Delivery:** Generated `.mp3` segments are uploaded to an object storage bucket (**AWS S3 / Cloudflare R2**) with immutable content-hash filenames. The lesson database record stores the CDN URL array.
  5. **Frontend Player Integration:** The Next.js UI renders a sticky custom audio player with playback speed controls (1x, 1.25x, 1.5x) and timestamp syncing that highlights Markdown paragraphs as the audio plays.

### 📑 Explain-Only Feature 2: Draft vs Published Course States with Autosave & Concurrency
* **Problem:** Admins need to edit existing courses without corrupting active agent attempts, while multiple team leads might collaboratively edit a course simultaneously.
* **State Modeling & Immutable Snapshots:**
  1. **Separation of Draft & Published Tables:** Instead of mutating live course rows, the schema is divided into `CourseDraft` (work-in-progress) and `CoursePublished` (immutable read-only snapshots).
  2. **Version-Safe Attempt Pinning:** When an agent enrolls or starts a quiz attempt, their record is permanently pinned to the current snapshot ID (`enrollment.courseVersionId`). If an admin publishes a new version (`v2`), in-progress learners finish `v1` undisturbed. New enrollments automatically receive `v2`.
* **Autosave & Concurrency Control (Conflict Handling):**
  1. **Debounced Client Autosaving:** The frontend editor implements a `useDebounce` hook (1,500ms inactivity threshold). On trigger, it sends a silent `PATCH /courses/:id/draft` request, updating a UI status badge (*"Saving..."* ➔ *"Saved at 2:14 PM"*).
  2. **Optimistic Concurrency Control (OCC):** Every draft record contains a `versionTimestamp` (or monotonic integer `revisionId`). When an admin opens a tab, their client stores `revisionId = 10`.
  3. **Conflict Resolution:** If Tab A saves and increments the database to `revisionId = 11`, and Tab B subsequently attempts to save using `revisionId = 10`, the NestJS API catches the mismatch and rejects the request with HTTP `409 Conflict`.
  4. **Diff Review UI:** Upon receiving a `409 Conflict`, the frontend displays a side-by-side modal showing the server's latest version versus the local unsaved changes, allowing the trainer to merge edits cleanly without accidental data overwrites.

---

## 🚀 7. Setup & Run Instructions

### 📦 Prerequisites
* **Node.js** (v18 or v20+)
* **Docker & Docker Compose** (optional, recommended for containerized run)
* **PostgreSQL** (if running locally without Docker)

### 🐳 Option A: One-Click Docker Deployment (Recommended)
You can launch the entire full-stack application and database in containerized isolation:

```bash
# 1. Clone the repository
git clone https://github.com/Eyob-smax/lms.git
cd lms

# 2. Launch with Docker Compose
docker-compose up --build -d
```
* **Frontend Application:** `http://localhost:3000`
* **Backend API & Swagger Docs:** `http://localhost:3333/api`

### 💻 Option B: Local Development (Nx Workspace)

```bash
# 1. Install dependencies
npm install

# 2. Configure Environment Variables
cp apps/backend/.env.example apps/backend/.env
# (Ensure DATABASE_URL points to your local PostgreSQL instance)

# 3. Run Database Migrations & Seed Production Demo Data
npx nx run backend:prisma-migrate
npx nx run backend:prisma-seed

# 4. Start Both Frontend and Backend in Parallel
npx nx run-many -t serve
```

---

## 🔑 8. Demo Login Credentials

The seeding script (`prisma-seed`) automatically populates the database with realistic BPO service line courses, quizzes, and accounts:

### 👑 Trainer / Admin Account
* **Email:** `admin@wearecerta.app` *(or `ops.admin@wearecerta.app`)*
* **Password:** `password123`
* **Capabilities:** Access Admin Analytics, AI Course Builder, User Roster, CSV Exports, and Cohort Assignments.

### 🎯 Frontline Agent Account (SDR Service Line)
* **Email:** `sdr.agent@wearecerta.app` *(or `bdr.agent@wearecerta.app`)*
* **Password:** `password123`
* **Capabilities:** Browse assigned SDR training, complete interactive quizzes, track progress, and download PDF certificates.

---

## 🧪 9. Verification & Testing

To execute automated build verification and test suites across the workspace:

```bash
# Run production build verification across all modules
npx nx run-many -t build

# Execute backend unit and integration test suites
npx nx test backend
```

---

## 📝 10. Assumptions & Known Limitations
* **Email Delivery:** In local development without an SMTP server configured, email dispatches (invitations and password resets) are logged cleanly to the backend terminal output, and live demo registration links are surfaced in UI toast confirmations for immediate verification.
* **LLM API Keys:** If no live Anthropic/OpenAI API key is provided in `.env`, the `AiService` gracefully falls back to a deterministic, structured mock generator that simulates the exact JSON schema and pedagogy required for testing the authoring workflow.
