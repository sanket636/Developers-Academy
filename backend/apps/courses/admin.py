from django.contrib import admin
from .models import Course


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):

    list_display = (
        "course_code",
        "course_name",
        "duration_months",
        "course_fee",
        "teacher",
        "status",
    )

    list_filter = (
        "status",
        "duration_months",
    )

    search_fields = (
        "course_code",
        "course_name",
        "teacher__user__username",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )