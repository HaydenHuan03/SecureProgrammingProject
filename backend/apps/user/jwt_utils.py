import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings

_ALGORITHM = "HS256"
_EXPIRY_HOURS = 24


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


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[_ALGORITHM])
