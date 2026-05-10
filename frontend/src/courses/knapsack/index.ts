import type { CourseConfig } from "../types";
import { SUBTOPICS } from "./subtopics";
import { CODING_PROBLEMS, FINAL_PROBLEM } from "./coding";
import { KnapsackVisual } from "./visual";

export const KnapsackCourse: CourseConfig = {
  subtopics: SUBTOPICS,
  codingProblems: CODING_PROBLEMS,
  finalProblem: FINAL_PROBLEM,
  Visual: KnapsackVisual,
};
