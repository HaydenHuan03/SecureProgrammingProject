import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings

_ALGORITHM = "HS256"
_EXPIRY_HOURS = 24
_MFA_EXPIRY_MINUTES = 5


def generate_token(user) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": str(user.user_id),
        "username": user.username,
        "role": user.role,
        "exp": now + timedelta(hours=_EXPIRY_HOURS),
        "iat": now,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=_ALGORITHM)


def generate_mfa_token(user) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": str(user.user_id),
        "purpose": "mfa",
        "exp": now + timedelta(minutes=_MFA_EXPIRY_MINUTES),
        "iat": now,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[_ALGORITHM])
