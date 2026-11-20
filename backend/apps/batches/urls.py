from django.urls import path

from .views import (
    BatchListView,
    BatchCreateView,
    BatchDetailView,
    EnrollmentListView,
    EnrollmentCreateView,
    EnrollmentDetailView,
)

urlpatterns = [
    # Batch APIs
    path("", BatchListView.as_view(), name="batch_list"),
    path("create/", BatchCreateView.as_view(), name="batch_create"),
    path("<int:pk>/", BatchDetailView.as_view(), name="batch_detail"),

    # Batch Enrollment APIs
    path("enrollments/", EnrollmentListView.as_view(), name="enrollment_list"),
    path("enrollments/create/", EnrollmentCreateView.as_view(), name="enrollment_create"),
    path("enrollments/<int:pk>/", EnrollmentDetailView.as_view(), name="enrollment_detail"),
]