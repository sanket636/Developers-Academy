from django.contrib import admin

from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):

    list_display = (
        "admission_number",
        "user",
        "guardian_name",
        "guardian_phone",
        "status",
        "admission_date",
    )

    list_filter = (
        "status",
        "admission_date",
    )

    search_fields = (
        "admission_number",
        "user__username",
        "user__first_name",
        "user__last_name",
        "guardian_name",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )