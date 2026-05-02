import type { PlaygroundSpec, CheckerResult } from "../types";

const BROKEN_POSTS = `// src/routes/posts.ts
import { Router } from "express";
import { prisma } from "../db";

export const postsRouter = Router();

postsRouter.get("/api/posts", async (_req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // BUG: one query per post to fetch comments  -->  classic N+1.
  const enriched = [];
  for (const post of posts) {
    const comments = await prisma.comment.findMany({
      where: { postId: post.id },
    });
    enriched.push({ ...post, comments });
  }

  res.json(enriched);
});
`;

const PRISMA_SCHEMA = `// prisma/schema.prisma (read-only)
model Post {
  id        String    @id @default(cuid())
  title     String
  body      String
  createdAt DateTime  @default(now())
  comments  Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  author    String
  body      String
  post      Post     @relation(fields: [postId], references: [id])
}
`;

const DB_TS = `// src/db.ts (read-only)
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
`;

const REFERENCE_FIX = `// src/routes/posts.ts
import { Router } from "express";
import { prisma } from "../db";

export const postsRouter = Router();

postsRouter.get("/api/posts", async (_req, res) => {
  // FIX: eager-load comments in the same round trip via \`include\`.
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { comments: true },
  });

  res.json(posts);
});
`;

/** Heuristics: has the user killed the N+1? */
function evaluate(files: Record<string, string>): CheckerResult {
  const src = files["src/routes/posts.ts"] ?? "";

  const loopPattern = /for\s*\(\s*const\s+\w+\s+of\s+posts\s*\)/;
  const awaitInLoop = /for\s*\([^)]*\)\s*\{[\s\S]*await\s+prisma\.comment/;
  const usesInclude = /include\s*:\s*\{\s*comments\s*:\s*true\s*\}/;
  const usesJoinIn = /prisma\.comment\.findMany\s*\(\s*\{\s*where\s*:\s*\{\s*postId\s*:\s*\{\s*in\s*:/;

  const checks = [
    {
      label: "No await inside a posts loop",
      ok: !awaitInLoop.test(src) && !loopPattern.test(src),
    },
    {
      label: "Comments fetched in a single batch (include or IN)",
      ok: usesInclude.test(src) || usesJoinIn.test(src),
    },
    {
      label: "Response still returns posts with their comments",
      ok: /res\.json\s*\(/.test(src) && /posts/.test(src),
    },
  ];

  const passed = checks.every((c) => c.ok);
  const score = passed ? 100 : checks.filter((c) => c.ok).length * 33;
  return { passed, checks, score, referenceDiff: REFERENCE_FIX };
}

export const postgresN1Spec: PlaygroundSpec = {
  slug: "postgres-n-plus-1",
  title: "Postgres N+1 Query Killing the API",
  issue:
    "The /api/posts handler returns data correctly but executes one comments query per post. Under load, query count and p95 latency spike hard.",
  goal:
    "Refactor the endpoint to fetch related comments in one batched operation and keep the same response shape.",
  successCriteria: [
    "No await query inside a loop over posts",
    "Comments loaded in one round trip (include or IN batch)",
    "Response still returns posts with nested comments",
  ],
  durationSeconds: 20 * 60,
  files: [
    {
      path: "src/routes/posts.ts",
      language: "typescript",
      content: BROKEN_POSTS,
    },
    {
      path: "prisma/schema.prisma",
      language: "prisma",
      content: PRISMA_SCHEMA,
      readOnly: true,
    },
    {
      path: "src/db.ts",
      language: "typescript",
      content: DB_TS,
      readOnly: true,
    },
  ],
  hints: [
    {
      id: "h1",
      title: "Count your queries",
      body: "For each post in the response, the handler issues a separate `prisma.comment.findMany`. With 50 posts that's 51 queries on one request.",
      cost: 10,
    },
    {
      id: "h2",
      title: "Prisma can eager-load",
      body: "`include: { comments: true }` tells Prisma to fetch the relation alongside the posts in a single round trip.",
      cost: 10,
    },
    {
      id: "h3",
      title: "The full fix",
      body: "Remove the for-loop entirely. Replace it with `findMany({ include: { comments: true } })` and `res.json(posts)`.",
      cost: 15,
    },
  ],
  runCommand: (cmd, files) => {
    const trimmed = cmd.trim();
    const result = evaluate(files);
    if (trimmed === "help") {
      return {
        stdout: [
          "Available commands:",
          "  help                      show this",
          "  ls                        list files",
          "  curl /api/posts           hit the broken endpoint",
          "  explain                   EXPLAIN ANALYZE the implicated query",
          "  make check                run the automated checker",
        ].join("\n"),
        exitCode: 0,
      };
    }
    if (trimmed === "ls") {
      return {
        stdout: Object.keys(files).sort().join("\n"),
        exitCode: 0,
      };
    }
    if (trimmed.startsWith("curl") && trimmed.includes("/api/posts")) {
      if (result.passed) {
        return {
          stdout: [
            "HTTP/1.1 200 OK",
            "x-query-count: 1",
            "x-response-time: 142ms",
            "",
            "[ ...50 posts, each with .comments inline... ]",
          ].join("\n"),
          exitCode: 0,
        };
      }
      return {
        stdout: [
          "HTTP/1.1 200 OK",
          "x-query-count: 51",
          "x-response-time: 9824ms  ⚠ over SLO",
          "",
          "[ ...50 posts, comments fetched per-post... ]",
        ].join("\n"),
        exitCode: 0,
      };
    }
    if (trimmed.startsWith("explain")) {
      return {
        stdout: [
          "EXPLAIN ANALYZE SELECT * FROM \"Comment\" WHERE \"postId\" = $1;",
          " Index Scan using Comment_postId_idx on Comment",
          "   (actual time=0.02..0.04 rows=3 loops=1)",
          " Planning Time: 0.10 ms",
          " Execution Time: 0.05 ms",
          "",
          "Each individual query is fast — but you run 50 of them.",
        ].join("\n"),
        exitCode: 0,
      };
    }
    if (trimmed === "make check" || trimmed === "check") {
      const lines = result.checks.map(
        (c) => `${c.ok ? "✔" : "✘"} ${c.label}`
      );
      return {
        stdout: [
          ...lines,
          "",
          result.passed
            ? "checker passed — incident resolved."
            : "checker failed — keep going.",
        ].join("\n"),
        exitCode: result.passed ? 0 : 1,
      };
    }
    if (!trimmed) return { stdout: "", exitCode: 0 };
    return {
      stdout: `command not found: ${trimmed} (try \`help\`)`,
      exitCode: 127,
    };
  },
  check: evaluate,
  referenceFiles: {
    "src/routes/posts.ts": REFERENCE_FIX,
  },
};
