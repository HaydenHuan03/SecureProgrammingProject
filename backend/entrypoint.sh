#!/bin/sh
set -e

python manage.py makemigrations --no-input
python manage.py migrate --no-input

python manage.py shell -c "
from apps.user.services import create_user
from apps.user.models import User, Role
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    create_user('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD', Role.ADMIN)
    print('Superuser created.')
else:
    print('Superuser already exists.')
"

exec "$@"
