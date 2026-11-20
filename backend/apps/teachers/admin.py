from django.contrib import admin
from .models import Teacher


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):

    list_display = (
        "employee_id",
        "user",
        "qualification",
        "specialization",
        "experience_years",
        "status",
        "joining_date",
    )

    list_filter = (
        "status",
        "qualification",
        "joining_date",
    )

    search_fields = (
        "employee_id",
        "user__username",
        "user__first_name",
        "user__last_name",
        "specialization",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )