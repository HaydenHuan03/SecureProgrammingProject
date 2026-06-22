import functools
import jwt
from django.http import JsonResponse
from .models import Role
from .jwt_utils import decode_token


def _get_token(request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[len("Bearer "):]
    return None


def jwt_required(view_func):
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        token = _get_token(request)
        if not token:
            return JsonResponse({"error": "authentication required"}, status=401)
        try:
            request.token_payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return JsonResponse({"error": "token expired"}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({"error": "invalid token"}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_required(view_func):
    @functools.wraps(view_func)
    @jwt_required
    def wrapper(request, *args, **kwargs):
        if request.token_payload.get("role") != Role.ADMIN:
            return JsonResponse({"error": "admin access required"}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper
