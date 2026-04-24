import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ROLE_ORDER = { member: 0, admin: 1, owner: 2 };

/** Returns the member row { role } or null if not a member. */
export async function getWorkspaceMember(workspaceId, userId) {
  const { data } = await admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

/** Throws if userId is not a member (or below minRole). */
export async function requireWorkspaceMember(workspaceId, userId, minRole = "member") {
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member) throw new Error("Not a workspace member");
  if (ROLE_ORDER[member.role] < ROLE_ORDER[minRole]) {
    throw new Error(`Required role: ${minRole} — you have: ${member.role}`);
  }
  return member;
}

/** Returns true if userId has at least minRole in workspaceId. */
export async function hasWorkspaceRole(workspaceId, userId, minRole = "member") {
  try {
    await requireWorkspaceMember(workspaceId, userId, minRole);
    return true;
  } catch {
    return false;
  }
}

/** Adds a user to a workspace, returning the new member row. */
export async function addWorkspaceMember(workspaceId, userId, role = "member") {
  const { data, error } = await admin
    .from("workspace_members")
    .upsert({ workspace_id: workspaceId, user_id: userId, role }, { onConflict: "workspace_id,user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
