from functools import wraps
from flask import request, jsonify, current_app
from .supabase_client import get_supabase


def get_current_user():
    """
    Extracts and verifies the Supabase JWT from the Authorization header.
    Returns the user dict if valid, or None.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    supabase = get_supabase()

    try:
        # get_user() validates the JWT and returns the user payload
        response = supabase.auth.get_user(token)
        return response.user
    except Exception:
        return None


def login_required(f):
    """
    Decorator that protects routes. Passes the authenticated user as
    the first positional argument after self (or as keyword `current_user`).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, current_user=user, **kwargs)
    return decorated
