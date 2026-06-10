from django.urls import path
from . import admin_views

urlpatterns = [
    path("users/", admin_views.UserListView.as_view(), name="admin-user-list"),
    path("users/<uuid:pk>/", admin_views.UserDetailView.as_view(), name="admin-user-detail"),
]
