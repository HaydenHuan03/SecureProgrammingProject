import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Role
from . import services
from .jwt_utils import generate_token
from .decorators import jwt_required, admin_required
from .serializers import UserResponse


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(View):
    def post(self, request):
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"error": "username and password are required"}, status=400)

        try:
            user = services.get_user_by_username(username)
        except Exception:
            return JsonResponse({"error": "invalid credentials"}, status=401)

        if not services.verify_password(user, password):
            return JsonResponse({"error": "invalid credentials"}, status=401)

        token = generate_token(user)
        return JsonResponse({"token": token, "role": user.role})


@method_decorator(csrf_exempt, name="dispatch")
class UserListView(View):
    @method_decorator(admin_required)
    def get(self, request):
        users = services.list_users()
        return JsonResponse([UserResponse.from_model(u).to_dict() for u in users], safe=False)

    @method_decorator(admin_required)
    def post(self, request):
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        role = data.get("role", Role.USER)

        if not username or not password:
            return JsonResponse({"error": "username and password are required"}, status=400)
        if role not in Role.values:
            return JsonResponse({"error": f"role must be one of {Role.values}"}, status=400)

        try:
            user = services.create_user(username, password, role)
            return JsonResponse(UserResponse.from_model(user).to_dict(), status=201)
        except Exception:
            return JsonResponse({"error": "username already exists"}, status=409)


@method_decorator(csrf_exempt, name="dispatch")
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

        data = json.loads(request.body)
        role = data.get("role")
        if role is not None and role not in Role.values:
            return JsonResponse({"error": f"role must be one of {Role.values}"}, status=400)

        user = services.update_user(
            user_id,
            username=data.get("username"),
            password=data.get("password"),
            role=role,
        )
        return JsonResponse(UserResponse.from_model(user).to_dict())

    @method_decorator(admin_required)
    def delete(self, request, user_id):
        try:
            services.get_user_by_id(user_id)
        except Exception:
            return JsonResponse({"error": "user not found"}, status=404)

        services.delete_user(user_id)
        return JsonResponse({}, status=204)
