import type { ComponentType } from "react";

// ── Assessment question types ─────────────────────────────────────────────────

export type MCQQuestion = {
  type: "mcq";
  q: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type DebugQuestion = {
  type: "debug";
  q: string;
  code: string;
  explanation: string;
};

export type TraceQuestion = {
  type: "trace";
  q: string;
  hint: string;
  answer: string;
  explanation: string;
};

export type AssessQ = MCQQuestion | DebugQuestion | TraceQuestion;

// ── Teaching card (shown before the Socratic opener) ─────────────────────────

export interface TeachingCard {
  text: string;
  dbImageKey?: string;   // key admin pre-generated in DB
  imageUrl?: string;     // static fallback SVG
  imageCaption?: string;
}

// ── Subtopic AI tutor config ──────────────────────────────────────────────────

export interface SubtopicCfg {
  stage: number;
  title: string;
  icon: string;
  concepts: string[];
  teachingCards?: TeachingCard[];
  opener: string;
  assessment: AssessQ[];
}

// ── Coding fill-in-blank exercises ────────────────────────────────────────────

export interface Blank {
  label: string;
  answer: string;
}

export interface CodingProblem {
  title: string;
  description: string;
  code: string;
  blanks: Blank[];
  hint: string;
}

// ── Course config — the contract every course must satisfy ───────────────────
//
// Adding a new course:
//   1. Create src/courses/<slug>/index.ts  exporting a CourseConfig
//   2. Register it in src/courses/index.ts
//   Nothing else in the app needs to change.

export interface CourseConfig {
  subtopics: SubtopicCfg[];
  codingProblems: CodingProblem[];  // one per subtopic, same order
  finalProblem: CodingProblem;
  Visual: ComponentType<{ stage: number }>; // inline reference diagram per stage
}
