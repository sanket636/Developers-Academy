from django.core.exceptions import ValidationError
from django.db import models


class Timetable(models.Model):

    class DayOfWeek(models.TextChoices):
        MONDAY = "MONDAY", "Monday"
        TUESDAY = "TUESDAY", "Tuesday"
        WEDNESDAY = "WEDNESDAY", "Wednesday"
        THURSDAY = "THURSDAY", "Thursday"
        FRIDAY = "FRIDAY", "Friday"
        SATURDAY = "SATURDAY", "Saturday"
        SUNDAY = "SUNDAY", "Sunday"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CANCELLED = "CANCELLED", "Cancelled"

    batch = models.ForeignKey(
        "batches.Batch",
        on_delete=models.CASCADE,
        related_name="timetable_entries"
    )

    teacher = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.PROTECT,
        related_name="timetable_entries"
    )

    subject = models.CharField(max_length=150)

    day_of_week = models.CharField(
        max_length=10,
        choices=DayOfWeek.choices
    )

    start_time = models.TimeField()
    end_time = models.TimeField()

    classroom = models.CharField(max_length=100)

    effective_from = models.DateField()
    effective_to = models.DateField()

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["day_of_week", "start_time"]

    def clean(self):
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValidationError({
                    "end_time": "End time must be after start time."
                })

        if self.effective_from and self.effective_to:
            if self.effective_to < self.effective_from:
                raise ValidationError({
                    "effective_to": "End date cannot be before start date."
                })

        if self.batch_id and self.teacher_id:
            if self.batch.teacher_id != self.teacher_id:
                raise ValidationError({
                    "teacher": "Teacher must be assigned to the selected batch."
                })

    def __str__(self):
        return (
            f"{self.batch.batch_name} - "
            f"{self.subject} - {self.day_of_week}"
        )