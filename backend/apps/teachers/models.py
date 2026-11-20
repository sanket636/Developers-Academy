from django.conf import settings
from django.db import models


class Teacher(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        ON_LEAVE = "ON_LEAVE", "On Leave"

    class Qualification(models.TextChoices):
        BACHELORS = "BACHELORS", "Bachelors"
        MASTERS = "MASTERS", "Masters"
        PHD = "PHD", "PhD"
        OTHER = "OTHER", "Other"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_profile"
    )

    employee_id = models.CharField(
        max_length=30,
        unique=True
    )

    qualification = models.CharField(
        max_length=20,
        choices=Qualification.choices,
        default=Qualification.OTHER
    )

    specialization = models.CharField(
        max_length=150
    )

    experience_years = models.PositiveIntegerField(
        default=0
    )

    joining_date = models.DateField()

    salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_id} - {self.user.username}"