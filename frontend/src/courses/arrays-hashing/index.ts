import type { CourseConfig } from "../types";
import { SUBTOPICS } from "./subtopics";
import { CODING_PROBLEMS, FINAL_PROBLEM } from "./coding";
import { ArraysHashingVisual } from "./visual";

export const ArraysHashingCourse: CourseConfig = {
  subtopics: SUBTOPICS,
  codingProblems: CODING_PROBLEMS,
  finalProblem: FINAL_PROBLEM,
  Visual: ArraysHashingVisual,
};
