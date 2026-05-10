// ── Course registry ───────────────────────────────────────────────────────────
//
// To add a new course:
//   1. Create src/courses/<slug>/index.ts  exporting a CourseConfig
//   2. Import it below and add it to REGISTRY
//   The rest of the app (page.tsx) needs no changes.

import type { CourseConfig } from "./types";
import { KnapsackCourse } from "./knapsack";
import { ArraysHashingCourse } from "./arrays-hashing";

const REGISTRY: Record<string, CourseConfig> = {
  "knapsack":            KnapsackCourse,
  "dynamic-programming": KnapsackCourse,
  "arrays-hashing":      ArraysHashingCourse,
};

export function getCourseConfig(slug: string): CourseConfig | null {
  return REGISTRY[slug] ?? null;
}

export type { CourseConfig };
export type { SubtopicCfg, CodingProblem, AssessQ, TeachingCard } from "./types";
