from django.conf import settings
from django.db import models


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        GENERAL = "GENERAL", "General"
        ANNOUNCEMENT = "ANNOUNCEMENT", "Announcement"
        ATTENDANCE = "ATTENDANCE", "Attendance"
        EXAMINATION = "EXAMINATION", "Examination"
        FEES = "FEES", "Fees"
        TIMETABLE = "TIMETABLE", "Timetable"
        SYSTEM = "SYSTEM", "System"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    title = models.CharField(max_length=200)
    message = models.TextField()

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.recipient.username}"