from django.db import models
from django.conf import settings


class Course(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        COMPLETED = "COMPLETED", "Completed"

    course_name = models.CharField(max_length=150)

    course_code = models.CharField(
        max_length=30,
        unique=True
    )

    description = models.TextField(blank=True)

    duration_months = models.PositiveIntegerField(default=1)

    course_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    teacher = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses"
    )

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"