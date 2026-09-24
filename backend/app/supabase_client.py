from supabase import create_client, Client
from flask import current_app


def get_supabase() -> Client:
    """
    Returns a Supabase client using the service role key.
    The service role key bypasses RLS — only use this on the server side.
    User-level RLS checks are handled by validating the JWT before any operation.
    """
    url = current_app.config["SUPABASE_URL"]
    key = current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)
