from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from core.permissions import IsAdmin
from .models import User


class UserListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by("-created_at")
        data = [_serialize_user(u) for u in users]
        return Response(data)


class UserDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        return Response(_serialize_user(user))

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        allowed_fields = {"role", "is_active", "is_email_verified"}
        update_fields = []

        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
                update_fields.append(field)

        if "unlock" in request.data and request.data["unlock"]:
            user.reset_login_attempts()
            return Response(_serialize_user(user))

        if update_fields:
            user.save(update_fields=update_fields)

        return Response(_serialize_user(user))

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _serialize_user(user):
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
        "is_email_verified": user.is_email_verified,
        "failed_login_attempts": user.failed_login_attempts,
        "lockout_until": user.lockout_until,
        "created_at": user.created_at,
        "last_login": user.last_login,
    }
