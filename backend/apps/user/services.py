from django.contrib.auth.hashers import make_password, check_password
from .models import User, Role


def create_user(username: str, password: str, role: str = Role.USER) -> User:
    user = User(
        username=username,
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


def update_user(user_id, username: str = None, password: str = None, role: str = None) -> User:
    user = get_user_by_id(user_id)
    if username is not None:
        user.username = username
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
