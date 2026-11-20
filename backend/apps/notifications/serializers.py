from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(
        source="recipient.username",
        read_only=True
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "recipient_name",
            "title",
            "message",
            "notification_type",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "is_read"]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Notification title cannot be empty."
            )
        return value.strip()

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Notification message cannot be empty."
            )
        return value.strip()