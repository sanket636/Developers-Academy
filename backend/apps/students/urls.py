from django.urls import path

from .views import (
    StudentListView,
    StudentDetailView,
    StudentCreateView,
)

urlpatterns = [
    # Get all students
    path("", StudentListView.as_view(), name="student_list"),

    # Create new student
    path("create/", StudentCreateView.as_view(), name="student_create"),

    # Retrieve, update and delete student
    path("<int:pk>/", StudentDetailView.as_view(), name="student_detail"),
]