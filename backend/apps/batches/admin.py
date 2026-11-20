from django.contrib import admin
from .models import Batch


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):

    list_display = (
        "batch_code",
        "batch_name",
        "course",
        "teacher",
        "start_date",
        "end_date",
        "max_students",
        "status",
    )

    list_filter = (
        "status",
        "course",
        "start_date",
    )

    search_fields = (
        "batch_code",
        "batch_name",
        "course__course_name",
        "teacher__user__username",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )