from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class AcademyUserAdmin(UserAdmin):

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_staff",
        "is_active",
    )

    list_filter = (
        "role",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
        "phone_number",
    )

    ordering = ("username",)

    fieldsets = UserAdmin.fieldsets + (
        (
            "Academy Information",
            {
                "fields": (
                    "role",
                    "phone_number",
                    "profile_picture",
                    "date_of_birth",
                    "address",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Academy Information",
            {
                "fields": (
                    "role",
                    "phone_number",
                    "profile_picture",
                    "date_of_birth",
                    "address",
                )
            },
        ),
    )