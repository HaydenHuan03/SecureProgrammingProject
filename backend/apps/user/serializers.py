from dataclasses import dataclass
from .models import User


@dataclass
class UserResponse:
    user_id: str
    username: str
    role: str

    @staticmethod
    def from_model(user: User) -> "UserResponse":
        return UserResponse(
            user_id=str(user.user_id),
            username=user.username,
            role=user.role,
        )

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "username": self.username,
            "role": self.role,
        }
