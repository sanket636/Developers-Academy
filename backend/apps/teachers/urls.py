from django.urls import path

from .views import (
    TeacherListView,
    TeacherDetailView,
    TeacherCreateView,
)

urlpatterns = [
    path("", TeacherListView.as_view(), name="teacher_list"),

    path("create/", TeacherCreateView.as_view(), name="teacher_create"),

    path("<int:pk>/", TeacherDetailView.as_view(), name="teacher_detail"),
]