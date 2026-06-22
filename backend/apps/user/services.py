import hashlib
import secrets
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import User, Role, OTPToken

OTP_PURPOSE_LOGIN = "login"
_OTP_EXPIRY_MINUTES = 5


def create_user(username: str, email: str, password: str, role: str = Role.USER) -> User:
    user = User(
        username=username,
        email=email,
        password=make_password(password),
        role=role,
    )
    user.save()
    return user


def get_user_by_id(user_id) -> User:
    return User.objects.get(pk=user_id)


def get_user_by_username(username: str) -> User:
    return User.objects.get(username=username)


def list_users() -> list[User]:
    return list(User.objects.all())


def update_user(user_id, username: str = None, email: str = None, password: str = None, role: str = None) -> User:
    user = get_user_by_id(user_id)
    if username is not None:
        user.username = username
    if email is not None:
        user.email = email
    if password is not None:
        user.password = make_password(password)
    if role is not None:
        user.role = role
    user.save()
    return user


def delete_user(user_id) -> None:
    User.objects.filter(pk=user_id).delete()


def verify_password(user: User, raw_password: str) -> bool:
    return check_password(raw_password, user.password)


def create_otp(user: User, purpose: str) -> tuple[OTPToken, str]:
    # Invalidate any existing unused OTPs for this user+purpose
    OTPToken.objects.filter(user=user, purpose=purpose, used=False).delete()

    code = f"{secrets.randbelow(1_000_000):06d}"
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    token = OTPToken.objects.create(
        user=user,
        code_hash=code_hash,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=_OTP_EXPIRY_MINUTES),
    )
    return token, code


def send_otp_email(user: User, code: str) -> None:
    send_mail(
        subject="Your verification code",
        message=(
            f"Your verification code is: {code}\n\n"
            f"This code expires in {_OTP_EXPIRY_MINUTES} minutes. "
            "Do not share it with anyone."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def verify_otp(user: User, code: str, purpose: str) -> bool:
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    token = (
        OTPToken.objects
        .filter(user=user, purpose=purpose, used=False, code_hash=code_hash)
        .filter(expires_at__gt=timezone.now())
        .first()
    )
    if token is None:
        return False
    token.used = True
    token.save(update_fields=["used"])
    return True
