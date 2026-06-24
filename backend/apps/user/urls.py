from django.urls import path
from .views import RegisterView, LoginView, SendOTPView, MFAVerifyView, LogoutView, UserListView, UserDetailView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("login/send-otp/", SendOTPView.as_view()),
    path("login/verify/", MFAVerifyView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("", UserListView.as_view()),
    path("<uuid:user_id>/", UserDetailView.as_view()),
]
