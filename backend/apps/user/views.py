import json
import jwt as pyjwt
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from .models import Role
from . import services
from .jwt_utils import generate_token, generate_mfa_token, decode_token
from .decorators import jwt_required, admin_required
from .serializers import UserResponse
from .validators import validate_username, validate_password, validate_email, validate_otp_code

_JWT_COOKIE_MAX_AGE = 60 * 60 * 24  # 24 hours


def _parse_json(request):
    try:
        return json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("request body must be valid JSON")


def _decode_mfa_token(raw_token: str):
    """Decode and validate an MFA-purpose token. Raises ValueError on any problem."""
    try:
        payload = decode_token(raw_token)
    except pyjwt.ExpiredSignatureError:
        raise ValueError("session expired, please log in again")
    except pyjwt.InvalidTokenError:
        raise ValueError("invalid session token")
    if payload.get("purpose") != "mfa":
        raise ValueError("invalid session token")
    return payload


def _set_jwt_cookie(response, token: str) -> None:
    response.set_cookie(
        "jwt",
        token,
        max_age=_JWT_COOKIE_MAX_AGE,
        httponly=True,
        samesite="Lax",
        path="/",
        secure=False,  # set True in production (HTTPS only)
    )


# Step 1 — validate credentials, return mfa_token (no OTP sent yet)
@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(ensure_csrf_cookie, name="dispatch")
class LoginView(View):
    def post(self, request):
        try:
            data = _parse_json(request)
            username = validate_username(data.get("username", ""))
            password = validate_password(data.get("password", ""))
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        try:
            user = services.get_user_by_username(username)
        except Exception:
            return JsonResponse({"error": "invalid credentials"}, status=401)

        if not services.verify_password(user, password):
            return JsonResponse({"error": "invalid credentials"}, status=401)

        mfa_token = generate_mfa_token(user)
        return JsonResponse({"mfa_required": True, "mfa_token": mfa_token}, status=200)


# Step 2 — user submits their email; validate it matches, then send OTP
@method_decorator(csrf_exempt, name="dispatch")
class SendOTPView(View):
    def post(self, request):
        try:
            data = _parse_json(request)
            payload = _decode_mfa_token(data.get("mfa_token", ""))
            email = validate_email(data.get("email", ""))
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        try:
            user = services.get_user_by_id(payload["user_id"])
        except Exception:
            return JsonResponse({"error": "invalid session token"}, status=401)

        if user.email != email:
            return JsonResponse({"error": "email does not match our records"}, status=401)

        _, code = services.create_otp(user, services.OTP_PURPOSE_LOGIN)
        services.send_otp_email(user, code)
        return JsonResponse({"otp_sent": True}, status=200)


# Step 3 — verify OTP, issue auth cookie
@method_decorator(csrf_exempt, name="dispatch")
class MFAVerifyView(View):
    def post(self, request):
        try:
            data = _parse_json(request)
            payload = _decode_mfa_token(data.get("mfa_token", ""))
            otp_code = validate_otp_code(data.get("otp_code", ""))
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        try:
            user = services.get_user_by_id(payload["user_id"])
        except Exception:
            return JsonResponse({"error": "invalid session token"}, status=401)

        if not services.verify_otp(user, otp_code, services.OTP_PURPOSE_LOGIN):
            return JsonResponse({"error": "invalid or expired verification code"}, status=401)

        token = generate_token(user)
        response = JsonResponse(UserResponse.from_model(user).to_dict())
        _set_jwt_cookie(response, token)
        return response


class LogoutView(View):
    @method_decorator(jwt_required)
    def post(self, request):
        response = JsonResponse({})
        response.delete_cookie("jwt", path="/")
        return response


class UserListView(View):
    @method_decorator(admin_required)
    def get(self, request):
        users = services.list_users()
        return JsonResponse([UserResponse.from_model(u).to_dict() for u in users], safe=False)

    @method_decorator(admin_required)
    def post(self, request):
        try:
            data = _parse_json(request)
            username = validate_username(data.get("username", ""))
            email = validate_email(data.get("email", ""))
            password = validate_password(data.get("password", ""))
            role = data.get("role", Role.USER)
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        if role not in Role.values:
            return JsonResponse({"error": f"role must be one of {Role.values}"}, status=400)

        try:
            user = services.create_user(username, email, password, role)
            return JsonResponse(UserResponse.from_model(user).to_dict(), status=201)
        except Exception:
            return JsonResponse({"error": "username or email already exists"}, status=409)


class UserDetailView(View):
    @method_decorator(jwt_required)
    def get(self, request, user_id):
        payload = request.token_payload
        if payload["role"] != Role.ADMIN and payload["user_id"] != str(user_id):
            return JsonResponse({"error": "forbidden"}, status=403)
        try:
            user = services.get_user_by_id(user_id)
            return JsonResponse(UserResponse.from_model(user).to_dict())
        except Exception:
            return JsonResponse({"error": "user not found"}, status=404)

    @method_decorator(admin_required)
    def patch(self, request, user_id):
        try:
            services.get_user_by_id(user_id)
        except Exception:
            return JsonResponse({"error": "user not found"}, status=404)

        try:
            data = _parse_json(request)
            raw_username = data.get("username")
            raw_email = data.get("email")
            raw_password = data.get("password")
            username = validate_username(raw_username) if raw_username is not None else None
            email = validate_email(raw_email) if raw_email is not None else None
            password = validate_password(raw_password) if raw_password is not None else None
            role = data.get("role")
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        if role is not None and role not in Role.values:
            return JsonResponse({"error": f"role must be one of {Role.values}"}, status=400)

        user = services.update_user(user_id, username=username, email=email, password=password, role=role)
        return JsonResponse(UserResponse.from_model(user).to_dict())

    @method_decorator(admin_required)
    def delete(self, request, user_id):
        try:
            services.get_user_by_id(user_id)
        except Exception:
            return JsonResponse({"error": "user not found"}, status=404)

        services.delete_user(user_id)
        return JsonResponse({}, status=204)
