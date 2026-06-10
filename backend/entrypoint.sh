#!/bin/sh
set -e

python manage.py makemigrations --no-input
python manage.py migrate --no-input

python manage.py shell -c "
from apps.accounts.models import User
if not User.objects.filter(email='$DJANGO_SUPERUSER_EMAIL').exists():
    User.objects.create_superuser(
        email='$DJANGO_SUPERUSER_EMAIL',
        username='$DJANGO_SUPERUSER_USERNAME',
        password='$DJANGO_SUPERUSER_PASSWORD',
    )
    print('Superuser created.')
else:
    print('Superuser already exists.')
"

exec "$@"
