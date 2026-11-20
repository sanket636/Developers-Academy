from django.conf import settings
from django.db import models


class Examination(models.Model):

    class Status(models.TextChoices):
        UPCOMING = "UPCOMING", "Upcoming"
        ONGOING = "ONGOING", "Ongoing"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    exam_name = models.CharField(max_length=150)
    exam_code = models.CharField(max_length=30, unique=True)

    batch = models.ForeignKey(
        "batches.Batch",
        on_delete=models.PROTECT,
        related_name="examinations"
    )

    exam_date = models.DateField()
    total_marks = models.PositiveIntegerField()
    passing_marks = models.PositiveIntegerField()

    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.UPCOMING
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_examinations"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-exam_date"]

    def __str__(self):
        return f"{self.exam_code} - {self.exam_name}"


class ExamResult(models.Model):

    examination = models.ForeignKey(
        Examination,
        on_delete=models.CASCADE,
        related_name="results"
    )

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="exam_results"
    )

    marks_obtained = models.DecimalField(
        max_digits=7,
        decimal_places=2
    )

    remarks = models.TextField(blank=True)

    entered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="entered_exam_results"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["examination", "student"],
                name="unique_student_exam_result"
            )
        ]

    def __str__(self):
        return f"{self.student} - {self.examination.exam_name}"