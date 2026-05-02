import type { PlaygroundSpec, CheckerResult } from "../types";

const BROKEN_DEPLOYMENT = `# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: acme/web:1.14.0
          ports:
            - containerPort: 3000
          # BUG: no resources block at all — kubelet will happily let this
          # grow until the node OOM-kills it, and the scheduler has no memory
          # reservation to work with.
`;

const BROKEN_APP = `// app/server.js
const express = require("express");
const app = express();

// BUG: unbounded in-memory accumulator of every request ever seen.
// Memory grows forever — eventually the pod is OOMKilled.
const everyRequest = [];

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/search", (req, res) => {
  const q = String(req.query.q || "");
  everyRequest.push({
    q,
    ua: req.headers["user-agent"],
    at: new Date().toISOString(),
    // "context" is just padding to make the leak obvious under load.
    context: Buffer.alloc(128 * 1024).toString("base64"),
  });
  res.json({ q, hits: [] });
});

app.listen(3000, () => console.log("listening"));
`;

const REFERENCE_DEPLOYMENT = `# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: acme/web:1.14.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "256Mi"
`;

const REFERENCE_APP = `// app/server.js
const express = require("express");
const app = express();

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/search", (req, res) => {
  const q = String(req.query.q || "");
  // FIX: do not accumulate every request forever.
  res.json({ q, hits: [] });
});

app.listen(3000, () => console.log("listening"));
`;

function evaluate(files: Record<string, string>): CheckerResult {
  const yaml = files["k8s/deployment.yaml"] ?? "";
  const js = files["app/server.js"] ?? "";

  const hasLimits = /limits\s*:/.test(yaml) && /memory\s*:\s*['"]?\d+\s*[KMG]i/.test(yaml);
  const hasRequests = /requests\s*:/.test(yaml) && /memory\s*:/.test(yaml);
  const leakGone =
    !/const\s+everyRequest\s*=\s*\[\]/.test(js) ||
    !/everyRequest\.push/.test(js);

  const checks = [
    {
      label: "Deployment sets resources.limits.memory",
      ok: hasLimits,
      detail: hasLimits ? undefined : "add a memory limit so the kernel enforces a ceiling",
    },
    {
      label: "Deployment sets resources.requests (scheduling hint)",
      ok: hasRequests,
    },
    {
      label: "No unbounded in-memory accumulator in app/server.js",
      ok: leakGone,
      detail: leakGone ? undefined : "the `everyRequest` array grows forever",
    },
  ];

  const passed = checks.every((c) => c.ok);
  const score = checks.filter((c) => c.ok).length * 33 + (passed ? 1 : 0);
  return {
    passed,
    checks,
    score: passed ? 100 : score,
    referenceDiff: REFERENCE_DEPLOYMENT + "\n\n---\n\n" + REFERENCE_APP,
  };
}

export const k8sOomSpec: PlaygroundSpec = {
  slug: "k8s-oomkilled",
  title: "K8s Pod OOMKilled on Every Deploy",
  issue:
    "The web pod repeatedly restarts with OOMKilled. Deployment has no memory policy and app code keeps appending request data forever.",
  goal:
    "Stabilize the service by enforcing Kubernetes memory policy and removing the unbounded in-memory growth pattern.",
  successCriteria: [
    "Set resources.limits.memory on the container",
    "Set resources.requests for scheduler stability",
    "Remove the unbounded request accumulator from app code",
  ],
  durationSeconds: 25 * 60,
  files: [
    {
      path: "k8s/deployment.yaml",
      language: "yaml",
      content: BROKEN_DEPLOYMENT,
    },
    {
      path: "app/server.js",
      language: "javascript",
      content: BROKEN_APP,
    },
  ],
  hints: [
    {
      id: "h1",
      title: "Read the pod events",
      body: "`kubectl describe pod web-...` will show `Last State: Terminated, Reason: OOMKilled`. That is the kernel's OOM-killer, not k8s itself.",
      cost: 10,
    },
    {
      id: "h2",
      title: "Set a memory limit",
      body: "Add a `resources` block with both `requests` and `limits` under the container. Start with memory: 128Mi / 256Mi.",
      cost: 10,
    },
    {
      id: "h3",
      title: "Find the leak",
      body: "`/api/search` pushes every request into an in-memory array. That array never shrinks — so the heap never shrinks.",
      cost: 15,
    },
  ],
  runCommand: (cmd, files) => {
    const t = cmd.trim();
    const r = evaluate(files);
    if (t === "help") {
      return {
        stdout: [
          "Available commands:",
          "  help                        show this",
          "  ls                          list files",
          "  kubectl describe pod web    inspect pod events",
          "  kubectl top pod             memory/cpu snapshot",
          "  load-test                   simulate 60s of traffic",
          "  make check                  run the automated checker",
        ].join("\n"),
        exitCode: 0,
      };
    }
    if (t === "ls") return { stdout: Object.keys(files).sort().join("\n"), exitCode: 0 };
    if (t.startsWith("kubectl describe")) {
      if (r.passed) {
        return {
          stdout: [
            "Name:         web-7f9c-abc",
            "Status:       Running",
            "Restarts:     0",
            "Containers:",
            "  web:",
            "    State:       Running",
            "    Limits:      memory: 256Mi, cpu: 500m",
            "    Requests:    memory: 128Mi, cpu: 100m",
            "Events:       <none in last 10m>",
          ].join("\n"),
          exitCode: 0,
        };
      }
      return {
        stdout: [
          "Name:         web-7f9c-abc",
          "Status:       Running",
          "Restarts:     6",
          "Containers:",
          "  web:",
          "    State:       Running",
          "    Last State:  Terminated",
          "      Reason:    OOMKilled",
          "      Exit Code: 137",
          "    Limits:      <none>",
          "    Requests:    <none>",
          "Events:",
          "  Warning  OOMKilled  2m  kubelet  Container web was OOMKilled",
        ].join("\n"),
        exitCode: 0,
      };
    }
    if (t.startsWith("kubectl top")) {
      return {
        stdout: r.passed
          ? "NAME         CPU(cores)  MEMORY(bytes)\nweb-7f9c-abc 42m         112Mi"
          : "NAME         CPU(cores)  MEMORY(bytes)\nweb-7f9c-abc 210m        248Mi  ↑ climbing",
        exitCode: 0,
      };
    }
    if (t === "load-test") {
      return {
        stdout: r.passed
          ? "60s @ 100 rps -> OK, p95=72ms, memory stable at 118Mi"
          : "60s @ 100 rps -> pod OOMKilled at t=41s (heap 251Mi, limit ∞ but node ran out)",
        exitCode: r.passed ? 0 : 1,
      };
    }
    if (t === "make check" || t === "check") {
      const lines = r.checks.map((c) => `${c.ok ? "✔" : "✘"} ${c.label}${c.detail ? `  -- ${c.detail}` : ""}`);
      return {
        stdout: [
          ...lines,
          "",
          r.passed ? "checker passed — pod stable under load." : "checker failed — keep going.",
        ].join("\n"),
        exitCode: r.passed ? 0 : 1,
      };
    }
    if (!t) return { stdout: "", exitCode: 0 };
    return { stdout: `command not found: ${t} (try \`help\`)`, exitCode: 127 };
  },
  check: evaluate,
  referenceFiles: {
    "k8s/deployment.yaml": REFERENCE_DEPLOYMENT,
    "app/server.js": REFERENCE_APP,
  },
};
