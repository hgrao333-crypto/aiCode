import type { PlaygroundSpec } from "./types";
import { postgresN1Spec } from "./incidents/postgres-n-plus-1";
import { k8sOomSpec } from "./incidents/k8s-oomkilled";

/**
 * PlaygroundService — single source of truth for every incident's sandbox.
 *
 * In production this would spin a Docker container per user session, mount
 * the editable files, pipe stdout/stderr to the client, and invoke a real
 * checker binary. For this local build it's a deterministic, client-side
 * simulation that obeys the same contract so swapping in a real runtime
 * later is a single replace-this-object refactor.
 */
class PlaygroundService {
  private specs: Record<string, PlaygroundSpec> = {};

  register(spec: PlaygroundSpec) {
    this.specs[spec.slug] = spec;
  }

  get(slug: string): PlaygroundSpec | null {
    return this.specs[slug] ?? null;
  }

  all(): PlaygroundSpec[] {
    return Object.values(this.specs);
  }
}

export const playgroundService = new PlaygroundService();

playgroundService.register(postgresN1Spec);
playgroundService.register(k8sOomSpec);
