import uuid
from django.db import models


class Role(models.TextChoices):
    USER = "user", "User"
    ADMIN = "admin", "Admin"

class User(models.Model):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)

    class Meta:
        db_table = "user"
