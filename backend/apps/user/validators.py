import re
from django.core.validators import validate_email as _django_validate_email
from django.core.exceptions import ValidationError

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_\-]{3,150}$")
_PASSWORD_MIN = 8
_PASSWORD_MAX = 128


def validate_username(value) -> str:
    if not isinstance(value, str):
        raise ValueError("username must be a string")
    value = value.strip()
    if not _USERNAME_RE.match(value):
        raise ValueError(
            "username must be 3–150 characters and contain only letters, numbers, underscores, or hyphens"
        )
    return value


def validate_password(value) -> str:
    if not isinstance(value, str):
        raise ValueError("password must be a string")
    if len(value) < _PASSWORD_MIN:
        raise ValueError(f"password must be at least {_PASSWORD_MIN} characters")
    if len(value) > _PASSWORD_MAX:
        raise ValueError(f"password must be at most {_PASSWORD_MAX} characters")
    return value


def validate_email(value) -> str:
    if not isinstance(value, str):
        raise ValueError("email must be a string")
    value = value.strip().lower()
    try:
        _django_validate_email(value)
    except ValidationError:
        raise ValueError("enter a valid email address")
    return value


def validate_otp_code(value) -> str:
    if not isinstance(value, str):
        raise ValueError("otp_code must be a string")
    if not re.fullmatch(r"\d{6}", value):
        raise ValueError("otp_code must be a 6-digit number")
    return value
