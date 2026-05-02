export type PlaygroundFile = {
  path: string;
  language: string;
  content: string;
  readOnly?: boolean;
};

export type Hint = {
  id: string;
  title: string;
  body: string;
  cost: number;
};

export type CommandResult = {
  stdout: string;
  exitCode: number;
};

export type CheckerResult = {
  passed: boolean;
  checks: { label: string; ok: boolean; detail?: string }[];
  score: number;
  referenceDiff?: string;
};

export type MetricsSnapshot = {
  t: number;
  cpu: number;
  memoryMB: number;
  p95ms: number;
  errorRate: number;
};

export type PlaygroundSpec = {
  slug: string;
  title: string;
  issue: string;
  goal: string;
  successCriteria: string[];
  durationSeconds: number;
  files: PlaygroundFile[];
  hints: Hint[];
  runCommand: (cmd: string, files: Record<string, string>) => CommandResult;
  check: (files: Record<string, string>) => CheckerResult;
  referenceFiles: Record<string, string>;
};
