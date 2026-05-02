"use client";

import { useEffect, useRef } from "react";
import type { Terminal as XTerm } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

type RunFn = (cmd: string) => { stdout: string; exitCode: number };

export function Terminal({
  run,
  prompt = "lab $",
  banner,
}: {
  run: RunFn;
  prompt?: string;
  banner?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<XTerm | null>(null);
  const bufferRef = useRef<string>("");
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef<number>(-1);

  useEffect(() => {
    let mounted = true;
    let cleanup = () => {};

    (async () => {
      const { Terminal: XTermClass } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      if (!mounted || !hostRef.current) return;

      const term = new XTermClass({
        convertEol: true,
        cursorBlink: true,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: 13,
        theme: {
          background: "#09090b",
          foreground: "#e4e4e7",
          cursor: "#34d399",
          black: "#09090b",
          green: "#34d399",
          red: "#f87171",
          yellow: "#fbbf24",
        },
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(hostRef.current);

      const doFit = () => {
        try {
          fit.fit();
        } catch {}
      };
      doFit();
      const ro = new ResizeObserver(doFit);
      ro.observe(hostRef.current);

      if (banner) {
        banner.split("\n").forEach((l) => term.writeln(`\x1b[2m${l}\x1b[0m`));
      }
      term.write(`\r\n\x1b[32m${prompt}\x1b[0m `);

      term.onData((data) => {
        for (const ch of data) {
          const code = ch.charCodeAt(0);
          if (ch === "\r") {
            const cmd = bufferRef.current;
            term.write("\r\n");
            if (cmd.trim()) {
              historyRef.current.push(cmd);
              historyIdxRef.current = historyRef.current.length;
              const { stdout } = run(cmd);
              if (stdout) {
                for (const line of stdout.split("\n")) {
                  term.writeln(line);
                }
              }
            }
            bufferRef.current = "";
            term.write(`\x1b[32m${prompt}\x1b[0m `);
          } else if (code === 127) {
            if (bufferRef.current.length > 0) {
              bufferRef.current = bufferRef.current.slice(0, -1);
              term.write("\b \b");
            }
          } else if (ch === "\x1b[A") {
            // up arrow
            if (historyIdxRef.current > 0) {
              historyIdxRef.current--;
              const prev = historyRef.current[historyIdxRef.current] ?? "";
              clearLine(term, prompt, bufferRef.current);
              bufferRef.current = prev;
              term.write(prev);
            }
          } else if (ch === "\x1b[B") {
            // down arrow
            if (historyIdxRef.current < historyRef.current.length - 1) {
              historyIdxRef.current++;
              const next = historyRef.current[historyIdxRef.current] ?? "";
              clearLine(term, prompt, bufferRef.current);
              bufferRef.current = next;
              term.write(next);
            } else {
              clearLine(term, prompt, bufferRef.current);
              bufferRef.current = "";
            }
          } else if (code >= 32) {
            bufferRef.current += ch;
            term.write(ch);
          }
        }
      });

      termRef.current = term;
      cleanup = () => {
        ro.disconnect();
        term.dispose();
      };
    })();

    return () => {
      mounted = false;
      cleanup();
    };
    // Intentionally only run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full w-full overflow-hidden bg-zinc-950">
      <div ref={hostRef} className="h-full w-full" />
    </div>
  );
}

function clearLine(term: XTerm, prompt: string, buf: string) {
  term.write("\r");
  term.write(" ".repeat(prompt.length + 1 + buf.length));
  term.write("\r");
  term.write(`\x1b[32m${prompt}\x1b[0m `);
}
