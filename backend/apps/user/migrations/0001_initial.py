import uuid
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("user_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("username", models.CharField(max_length=150, unique=True)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("password", models.CharField(max_length=255)),
                ("role", models.CharField(
                    choices=[("user", "User"), ("admin", "Admin")],
                    default="user",
                    max_length=10,
                )),
            ],
            options={"db_table": "user"},
        ),
        migrations.CreateModel(
            name="OTPToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code_hash", models.CharField(max_length=64)),
                ("purpose", models.CharField(max_length=50)),
                ("expires_at", models.DateTimeField()),
                ("used", models.BooleanField(default=False)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="otp_tokens",
                    to="user.user",
                )),
            ],
            options={"db_table": "otp_token"},
        ),
    ]
