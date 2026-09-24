from flask import Blueprint, jsonify
from ..auth_utils import login_required
from ..supabase_client import get_supabase

users_bp = Blueprint("users", __name__)


@users_bp.route("/", methods=["GET"])
@login_required
def list_users(current_user):
    """
    Returns all user profiles. Used in the frontend to populate
    the 'Assign To' dropdown when creating or editing a task.
    """
    supabase = get_supabase()
    result = supabase.table("profiles").select("id, email, full_name, avatar_url").execute()
    return jsonify(result.data), 200
