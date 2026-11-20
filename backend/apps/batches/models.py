from django.db import models


class Batch(models.Model):

    class Status(models.TextChoices):
        UPCOMING = "UPCOMING", "Upcoming"
        ONGOING = "ONGOING", "Ongoing"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    batch_name = models.CharField(max_length=150)

    batch_code = models.CharField(
        max_length=30,
        unique=True
    )

    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.PROTECT,
        related_name="batches"
    )

    teacher = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="batches"
    )

    start_date = models.DateField()

    end_date = models.DateField()

    max_students = models.PositiveIntegerField(default=30)

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.UPCOMING
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.batch_code} - {self.batch_name}"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.end_date and self.start_date:
            if self.end_date <= self.start_date:
                raise ValidationError(
                    {"end_date": "End date must be after start date."}
                )

        if self.max_students <= 0:
            raise ValidationError(
                {"max_students": "Maximum students must be greater than zero."}
            )


class BatchEnrollment(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        DROPPED = "DROPPED", "Dropped"

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="batch_enrollments"
    )

    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    enrollment_date = models.DateField(auto_now_add=True)

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-enrollment_date"]

        constraints = [
            models.UniqueConstraint(
                fields=["student", "batch"],
                name="unique_student_batch_enrollment"
            )
        ]

    def __str__(self):
        return f"{self.student} - {self.batch}"