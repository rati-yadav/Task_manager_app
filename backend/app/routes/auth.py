from flask import Blueprint, request, jsonify, current_app
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from ..supabase_client import get_supabase

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/google", methods=["POST"])
def google_login():
    """
    Receives a Google ID token from the frontend (after Google OAuth popup),
    verifies it with Google, then upserts the user into Supabase Auth and
    our profiles table.

    Flow:
      1. Frontend triggers Google OAuth via Supabase Auth JS (handles the popup).
      2. Supabase returns its own session — the frontend sends that session's
         access_token to protected endpoints directly.
      3. This endpoint is used if you need server-side Google token verification
         (e.g. for a custom flow). Most logic lives in Supabase Auth + frontend.
    """
    data = request.get_json()
    google_token = data.get("id_token")

    if not google_token:
        return jsonify({"error": "id_token is required"}), 400

    try:
        # Verify the Google ID token using Google's public certs
        id_info = id_token.verify_oauth2_token(
            google_token,
            google_requests.Request(),
            current_app.config["GOOGLE_CLIENT_ID"]
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid Google token: {str(e)}"}), 401

    email = id_info.get("email")
    full_name = id_info.get("name")
    avatar_url = id_info.get("picture")

    supabase = get_supabase()

    # Upsert profile — the trigger handles creation on first login,
    # but we sync name/avatar here for updates
    supabase.table("profiles").upsert({
        "email": email,
        "full_name": full_name,
        "avatar_url": avatar_url,
    }, on_conflict="email").execute()

    return jsonify({"message": "Profile synced", "email": email}), 200


@auth_bp.route("/me", methods=["GET"])
def get_me():
    """
    Returns the profile of the currently authenticated user.
    The frontend sends the Supabase JWT in the Authorization header.
    """
    from ..auth_utils import get_current_user
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    supabase = get_supabase()
    result = supabase.table("profiles").select("*").eq("id", user.id).single().execute()

    if not result.data:
        return jsonify({"error": "Profile not found"}), 404

    return jsonify(result.data), 200
