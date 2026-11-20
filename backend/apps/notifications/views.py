from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Notification
from .serializers import NotificationSerializer
from rest_framework.response import Response

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            queryset = Notification.objects.all()
        else:
            queryset = Notification.objects.filter(recipient=user)

        notification_type = self.request.query_params.get(
            "type"
        )
        read_status = self.request.query_params.get("is_read")

        if notification_type:
            queryset = queryset.filter(
                notification_type=notification_type.upper()
            )

        if read_status in ["true", "false"]:
            queryset = queryset.filter(
                is_read=(read_status == "true")
            )

        return queryset.select_related("recipient")


class NotificationCreateView(generics.CreateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can create notifications."
            )

        serializer.save()


class NotificationDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Notification.objects.all()

        return Notification.objects.filter(recipient=user)


class MarkNotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["patch", "options", "head"]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Notification.objects.all()

        return Notification.objects.filter(recipient=user)

    def update(self, request, *args, **kwargs):
        notification = self.get_object()

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        serializer = self.get_serializer(notification)

        return Response(serializer.data)