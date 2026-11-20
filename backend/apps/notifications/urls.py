from django.urls import path

from .views import (
    NotificationListView,
    NotificationCreateView,
    NotificationDetailView,
    MarkNotificationReadView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification_list"),
    path("create/", NotificationCreateView.as_view(), name="notification_create"),
    path("<int:pk>/", NotificationDetailView.as_view(), name="notification_detail"),
    path("<int:pk>/read/", MarkNotificationReadView.as_view(), name="notification_mark_read"),
]