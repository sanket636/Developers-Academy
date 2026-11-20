from django.urls import path

from .views import (
    AttendanceListView,
    AttendanceCreateView,
    AttendanceDetailView,
)

urlpatterns = [
    path("", AttendanceListView.as_view(), name="attendance_list"),
    path("create/", AttendanceCreateView.as_view(), name="attendance_create"),
    path("<int:pk>/", AttendanceDetailView.as_view(), name="attendance_detail"),
]