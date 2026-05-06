import { getAdminClient } from "@/lib/admin-client";

export async function createJob(userId, { name, type, steps = [], payload = {}, scheduledFor, maxRetries = 3, priority = 5 }) {
  const { data, error } = await getAdminClient()
    .from("platform_jobs")
    .insert({ user_id: userId, name, type, steps, payload, scheduled_for: scheduledFor ?? new Date().toISOString(), max_retries: maxRetries, priority })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateJob(jobId, patch) {
  const { error } = await getAdminClient().from("platform_jobs").update(patch).eq("id", jobId);
  if (error) throw error;
}

export async function getJob(jobId) {
  const { data } = await getAdminClient().from("platform_jobs").select("*").eq("id", jobId).maybeSingle();
  return data;
}

export async function listJobs(userId, { status, limit = 30 } = {}) {
  let q = getAdminClient()
    .from("platform_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data ?? [];
}

export async function getJobWithLogs(jobId) {
  const db = getAdminClient();
  const [{ data: job }, { data: logs }] = await Promise.all([
    db.from("platform_jobs").select("*").eq("id", jobId).maybeSingle(),
    db.from("job_logs").select("*").eq("job_id", jobId).order("created_at"),
  ]);
  return { ...(job ?? {}), logs: logs ?? [] };
}

export async function addLog(jobId, level, message, data = null, step = 0) {
  await getAdminClient().from("job_logs").insert({ job_id: jobId, level, message, data, step });
}

export async function getPendingJobs(limit = 10) {
  const { data } = await getAdminClient()
    .from("platform_jobs")
    .select("*")
    .in("status", ["pending", "confirmed"])
    .lte("scheduled_for", new Date().toISOString())
    .order("priority")
    .order("scheduled_for")
    .limit(limit * 2);
  return (data ?? []).filter((j) => j.retries < j.max_retries).slice(0, limit);
}

export async function scheduleRetry(job, errorMessage) {
  const retries = (job.retries ?? 0) + 1;
  if (retries >= job.max_retries) {
    await updateJob(job.id, { status: "failed", error: errorMessage, completed_at: new Date().toISOString() });
    await addLog(job.id, "error", `Failed after ${retries} attempts: ${errorMessage}`);
    return false;
  }
  const backoffMs = Math.pow(2, retries) * 30_000;
  await updateJob(job.id, {
    status: "pending",
    retries,
    error: errorMessage,
    scheduled_for: new Date(Date.now() + backoffMs).toISOString(),
  });
  await addLog(job.id, "warn", `Retry ${retries}/${job.max_retries} in ${backoffMs / 1000}s: ${errorMessage}`);
  return true;
}
