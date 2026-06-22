from django.urls import path
from .views import LoginView, UserListView, UserDetailView

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("", UserListView.as_view()),
    path("<uuid:user_id>/", UserDetailView.as_view()),
]
