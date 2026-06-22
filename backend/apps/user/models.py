import uuid
from django.db import models


class Role(models.TextChoices):
    USER = "user", "User"
    ADMIN = "admin", "Admin"


class User(models.Model):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(max_length=254, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)

    class Meta:
        db_table = "user"


class OTPToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otp_tokens")
    code_hash = models.CharField(max_length=64)  # SHA-256 hex digest
    purpose = models.CharField(max_length=50)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = "otp_token"
