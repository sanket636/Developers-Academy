from django.conf import settings
from django.db import models


class Student(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        GRADUATED = "GRADUATED", "Graduated"
        SUSPENDED = "SUSPENDED", "Suspended"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )

    admission_number = models.CharField(
        max_length=30,
        unique=True
    )

    admission_date = models.DateField()

    guardian_name = models.CharField(
        max_length=150
    )

    guardian_phone = models.CharField(
        max_length=15
    )

    emergency_contact = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.admission_number} - {self.user.username}"