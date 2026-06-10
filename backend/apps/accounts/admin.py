from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "username", "role", "is_email_verified", "is_active", "failed_login_attempts", "lockout_until", "created_at")
    list_filter = ("role", "is_active", "is_email_verified")
    search_fields = ("email", "username")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "last_login", "failed_login_attempts", "lockout_until")

    fieldsets = (
        (None, {"fields": ("id", "email", "username", "password")}),
        ("Role & Status", {"fields": ("role", "is_active", "is_staff", "is_superuser", "is_email_verified")}),
        ("Brute-force Protection", {"fields": ("failed_login_attempts", "lockout_until")}),
        ("Timestamps", {"fields": ("created_at", "last_login")}),
        ("Permissions", {"fields": ("groups", "user_permissions")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2", "role"),
        }),
    )

    actions = ["unlock_accounts", "verify_emails"]

    @admin.action(description="Unlock selected accounts")
    def unlock_accounts(self, request, queryset):
        for user in queryset:
            user.reset_login_attempts()

    @admin.action(description="Mark emails as verified")
    def verify_emails(self, request, queryset):
        queryset.update(is_email_verified=True)


@admin.register(OTPToken)
class OTPTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "purpose", "created_at", "expires_at", "is_used")
    list_filter = ("purpose", "is_used")
    search_fields = ("user__email",)
    ordering = ("-created_at",)
    readonly_fields = ("id", "user", "code_hash", "purpose", "created_at", "expires_at", "is_used")
    