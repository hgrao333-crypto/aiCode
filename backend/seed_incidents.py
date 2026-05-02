"""Seed IncidentLab incidents into the main Logos DB. Run once: python seed_incidents.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models

def seed():
    db = SessionLocal()
    try:
        if db.query(models.Incident).first():
            print("Incidents already seeded.")
            return

        # Incident 1: Postgres N+1
        i1 = models.Incident(
            slug="postgres-n-plus-1",
            title="Postgres N+1 Query Killing the API",
            description=(
                "Launch day traffic is 10 minutes away. Your /api/posts endpoint has regressed "
                "from 180ms to 9s p95. Tracing shows one posts query followed by dozens of comment "
                "lookups. Triage quickly, eliminate the N+1 pattern, and restore SLO before customers notice."
            ),
            difficulty="MEDIUM",
            domain="Backend · Database",
            order_index=1,
        )
        db.add(i1)
        db.flush()

        for title, pid, dur, idx in [
            ("Observability: The Evidence-Driven Diagnostic Workflow", "/static/videos/observability-diagnostic-workflow.mp4", 0, 0),
            ("Incident briefing: why p95 exploded", "mock-n1-intro", 15, 1),
            ("Tracing + EXPLAIN ANALYZE workflow", "mock-explain-analyze", 20, 2),
            ("Fix strategy: eager loading and batching", "mock-eager-loading", 25, 3),
        ]:
            db.add(models.IncidentVideo(incident_id=i1.id, title=title, mux_playback_id=pid, duration_seconds=dur, order_index=idx))

        q1 = models.IncidentQuiz(incident_id=i1.id)
        db.add(q1)
        db.flush()
        for question, options, correct, explanation, idx in [
            (
                "You fetch 50 posts, then perform one comments query per post. What is the total query count?",
                ["1", "50", "51", "Depends on the ORM"], 2,
                "1 initial query + 50 follow-up queries = 51. That's the classic N+1.", 1,
            ),
            (
                "Which change actually removes the N+1 root cause?",
                ["Increase the Postgres connection pool to 100",
                 "Batch-load related rows in one round trip (JOIN/IN or include)",
                 "Add response caching but keep one query per post",
                 "Shard by user ID"], 1,
                "Pooling and sharding can help capacity, but batching removes the actual N+1 query pattern.", 2,
            ),
            (
                "What does `EXPLAIN ANALYZE` add over plain `EXPLAIN`?",
                ["Nothing — they are aliases",
                 "ANALYZE executes the query and reports real timings",
                 "ANALYZE rewrites the query for you",
                 "ANALYZE only works on indexes"], 1,
                "EXPLAIN shows the planner's prediction; ANALYZE runs the query and shows actual rows/time.", 3,
            ),
            (
                "In Prisma, which option eager-loads relation data with the parent query?",
                ["select", "include", "where", "orderBy"], 1,
                "`include` tells Prisma to fetch related records in the same query.", 4,
            ),
        ]:
            db.add(models.IncidentQuizQuestion(
                quiz_id=q1.id, question=question, options=options,
                correct_index=correct, explanation=explanation, order_index=idx,
            ))

        db.add(models.IncidentBadge(
            incident_id=i1.id,
            label="Query Whisperer",
            tagline="Slayed an N+1 in the wild",
            icon_url="/badges/query-whisperer.svg",
        ))

        # Incident 2: K8s OOMKilled
        i2 = models.Incident(
            slug="k8s-oomkilled",
            title="K8s Pod OOMKilled on Every Deploy",
            description=(
                "A critical API deploys successfully, then restarts every minute with OOMKilled. "
                "There are no memory limits and the service keeps accumulating request data in memory. "
                "Add safe Kubernetes resource policy and remove the leak pattern before the rollback window closes."
            ),
            difficulty="HARD",
            domain="DevOps · Kubernetes",
            order_index=2,
        )
        db.add(i2)
        db.flush()

        for title, pid, dur, idx in [
            ("Incident briefing: decode OOMKilled quickly", "mock-k8s-limits", 15, 1),
            ("Observability: The Evidence-Driven Diagnostic Workflow", "/static/videos/observability-diagnostic-workflow.mp4", 0, 0),
            ("Pod forensics with `kubectl describe` and events", "mock-kubectl-describe", 20, 2),
            ("Stabilization plan: limits + leak remediation", "mock-node-leaks", 25, 3),
        ]:
            db.add(models.IncidentVideo(incident_id=i2.id, title=title, mux_playback_id=pid, duration_seconds=dur, order_index=idx))

        q2 = models.IncidentQuiz(incident_id=i2.id)
        db.add(q2)
        db.flush()
        for question, options, correct, explanation, idx in [
            (
                "What does `OOMKilled` specifically indicate in Kubernetes?",
                ["The pod was killed due to liveness probe failure",
                 "The kernel killed the container because it exceeded its memory cgroup limit",
                 "The image failed to pull",
                 "The node ran out of disk"], 1,
                "OOMKilled = Out-Of-Memory killer terminated the process because it exceeded its memory cgroup.", 1,
            ),
            (
                "Which field enforces a hard memory cap for a container?",
                ["resources.requests.memory", "resources.limits.memory",
                 "securityContext.memory", "env.MEMORY_MAX"], 1,
                "requests = scheduling hint, limits = enforced ceiling.", 2,
            ),
            (
                "A Node service appends every request to a never-cleared array. This is an example of what?",
                ["Closure over unfreed buffers",
                 "Unbounded in-memory cache / accumulator",
                 "Event emitter without removeListener",
                 "All of the above are common leaks"], 3,
                "All of these cause classic Node leaks.", 3,
            ),
            (
                "Beyond setting limits, which tool best helps root-cause a Node heap leak?",
                ["kubectl top", "clinic.js / heap snapshots", "ping", "tcpdump"], 1,
                "Heap snapshots (Chrome DevTools, clinic.js) reveal retained objects.", 4,
            ),
        ]:
            db.add(models.IncidentQuizQuestion(
                quiz_id=q2.id, question=question, options=options,
                correct_index=correct, explanation=explanation, order_index=idx,
            ))

        db.add(models.IncidentBadge(
            incident_id=i2.id,
            label="OOM Tamer",
            tagline="Kept the pod alive under load",
            icon_url="/badges/oom-tamer.svg",
        ))

        db.commit()
        print("Seeded 2 incidents successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
