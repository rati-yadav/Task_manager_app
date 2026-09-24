from flask import Blueprint, request, jsonify
from ..auth_utils import login_required
from ..supabase_client import get_supabase
from ..email_service import send_task_created_email, send_task_completed_email

tasks_bp = Blueprint("tasks", __name__)


def _get_profile(supabase, user_id: str) -> dict | None:
    """Helper to fetch a profile row by user ID."""
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return result.data


@tasks_bp.route("/", methods=["GET"])
@login_required
def get_tasks(current_user):
    """
    Returns all tasks visible to the authenticated user:
    - tasks they created
    - tasks assigned to them
    Uses an OR filter via Supabase's PostgREST query syntax.
    """
    supabase = get_supabase()

    # Fetch tasks with joined profile info for creator and assignee
    result = (
        supabase.table("tasks")
        .select(
            "*, "
            "creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url), "
            "assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url)"
        )
        .or_(f"created_by.eq.{current_user.id},assigned_to.eq.{current_user.id}")
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(result.data), 200


@tasks_bp.route("/all", methods=["GET"])
@login_required
def get_all_tasks(current_user):
    """Returns every task — useful for admin/team overview."""
    supabase = get_supabase()
    result = (
        supabase.table("tasks")
        .select(
            "*, "
            "creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url), "
            "assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url)"
        )
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(result.data), 200


@tasks_bp.route("/", methods=["POST"])
@login_required
def create_task(current_user):
    """
    Creates a new task. If an assignee is specified, sends them
    an email notification via Gmail SMTP.
    """
    data = request.get_json()

    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    supabase = get_supabase()

    new_task = {
        "title": title,
        "description": data.get("description", ""),
        "priority": data.get("priority", "medium"),
        "status": "pending",
        "created_by": current_user.id,
        "assigned_to": data.get("assigned_to") or None,
        "due_date": data.get("due_date") or None,
    }

    result = supabase.table("tasks").insert(new_task).execute()
    task = result.data[0]

    # Log the creation activity
    supabase.table("task_activities").insert({
        "task_id": task["id"],
        "actor_id": current_user.id,
        "action": "created",
        "metadata": {"title": title}
    }).execute()

    # Send email to assignee if one was set
    if task.get("assigned_to"):
        creator_profile = _get_profile(supabase, current_user.id)
        assignee_profile = _get_profile(supabase, task["assigned_to"])
        if assignee_profile and creator_profile:
            send_task_created_email(
                assignee_email=assignee_profile["email"],
                assignee_name=assignee_profile.get("full_name") or assignee_profile["email"],
                task_title=task["title"],
                task_description=task.get("description", ""),
                creator_name=creator_profile.get("full_name") or creator_profile["email"],
                due_date=task.get("due_date"),
            )

    return jsonify(task), 201


@tasks_bp.route("/<task_id>", methods=["GET"])
@login_required
def get_task(current_user, task_id):
    """Returns a single task by ID with creator and assignee profiles."""
    supabase = get_supabase()
    result = (
        supabase.table("tasks")
        .select(
            "*, "
            "creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url), "
            "assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url)"
        )
        .eq("id", task_id)
        .single()
        .execute()
    )

    if not result.data:
        return jsonify({"error": "Task not found"}), 404

    return jsonify(result.data), 200


@tasks_bp.route("/<task_id>", methods=["PUT"])
@login_required
def update_task(current_user, task_id):
    """
    Updates a task. Only the creator or the assignee can update it.
    If status changes to 'completed', the task creator gets an email.
    If the assignee changes, the new assignee gets a notification email.
    """
    supabase = get_supabase()

    # Fetch existing task to validate ownership
    existing = supabase.table("tasks").select("*").eq("id", task_id).single().execute()
    if not existing.data:
        return jsonify({"error": "Task not found"}), 404

    task = existing.data
    user_id = current_user.id

    # Authorization check
    if task["created_by"] != user_id and task.get("assigned_to") != user_id:
        return jsonify({"error": "You do not have permission to update this task"}), 403

    data = request.get_json()

    # Build the update payload — only include fields that were sent
    allowed_fields = ["title", "description", "priority", "status", "assigned_to", "due_date"]
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    result = supabase.table("tasks").update(updates).eq("id", task_id).execute()
    updated_task = result.data[0]

    # Log the update activity
    supabase.table("task_activities").insert({
        "task_id": task_id,
        "actor_id": user_id,
        "action": "updated",
        "metadata": updates
    }).execute()

    # Email: task completed → notify creator
    old_status = task.get("status")
    new_status = updates.get("status")

    if new_status == "completed" and old_status != "completed":
        creator_profile = _get_profile(supabase, task["created_by"])
        actor_profile = _get_profile(supabase, user_id)
        if creator_profile and actor_profile:
            send_task_completed_email(
                creator_email=creator_profile["email"],
                creator_name=creator_profile.get("full_name") or creator_profile["email"],
                task_title=task["title"],
                assignee_name=actor_profile.get("full_name") or actor_profile["email"],
            )

    # Email: new assignee set → notify them
    new_assignee_id = updates.get("assigned_to")
    if new_assignee_id and new_assignee_id != task.get("assigned_to"):
        creator_profile = _get_profile(supabase, user_id)
        assignee_profile = _get_profile(supabase, new_assignee_id)
        if assignee_profile and creator_profile:
            send_task_created_email(
                assignee_email=assignee_profile["email"],
                assignee_name=assignee_profile.get("full_name") or assignee_profile["email"],
                task_title=updated_task["title"],
                task_description=updated_task.get("description", ""),
                creator_name=creator_profile.get("full_name") or creator_profile["email"],
                due_date=updated_task.get("due_date"),
            )

    return jsonify(updated_task), 200


@tasks_bp.route("/<task_id>", methods=["DELETE"])
@login_required
def delete_task(current_user, task_id):
    """Only the task creator can delete a task."""
    supabase = get_supabase()

    existing = supabase.table("tasks").select("created_by").eq("id", task_id).single().execute()
    if not existing.data:
        return jsonify({"error": "Task not found"}), 404

    if existing.data["created_by"] != current_user.id:
        return jsonify({"error": "Only the task creator can delete it"}), 403

    supabase.table("tasks").delete().eq("id", task_id).execute()
    return jsonify({"message": "Task deleted"}), 200


@tasks_bp.route("/<task_id>/activities", methods=["GET"])
@login_required
def get_task_activities(current_user, task_id):
    """Returns the activity log for a task."""
    supabase = get_supabase()
    result = (
        supabase.table("task_activities")
        .select("*, actor:profiles(id, full_name, avatar_url)")
        .eq("task_id", task_id)
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(result.data), 200
