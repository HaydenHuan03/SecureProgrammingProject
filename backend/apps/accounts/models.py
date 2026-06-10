import uuid
import hashlib
import secrets
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_email_verified", True)
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [("customer", "Customer"), ("admin", "Admin")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="customer")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    lockout_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def is_locked_out(self):
        if self.lockout_until and timezone.now() < self.lockout_until:
            return True
        return False

    def record_failed_login(self):
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.lockout_until = timezone.now() + timedelta(minutes=15)
        self.save(update_fields=["failed_login_attempts", "lockout_until"])

    def reset_login_attempts(self):
        self.failed_login_attempts = 0
        self.lockout_until = None
        self.save(update_fields=["failed_login_attempts", "lockout_until"])

    def __str__(self):
        return self.email


class OTPToken(models.Model):
    PURPOSE_CHOICES = [("login_mfa", "Login MFA"), ("email_verify", "Email Verify")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otp_tokens")
    code_hash = models.CharField(max_length=64)
    purpose = models.CharField(max_length=15, choices=PURPOSE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    @classmethod
    def create_for_user(cls, user, purpose):
        code = f"{secrets.randbelow(1_000_000):06d}"
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        expires_at = timezone.now() + timedelta(minutes=5)
        cls.objects.filter(user=user, purpose=purpose, is_used=False).update(is_used=True)
        token = cls.objects.create(
            user=user,
            code_hash=code_hash,
            purpose=purpose,
            expires_at=expires_at,
        )
        return token, code

    def verify(self, code):
        if self.is_used or timezone.now() > self.expires_at:
            return False
        return self.code_hash == hashlib.sha256(code.encode()).hexdigest()

    def consume(self):
        self.is_used = True
        self.save(update_fields=["is_used"])

    def __str__(self):
        return f"OTP({self.purpose}) for {self.user.email}"
