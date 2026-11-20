from django.urls import path

from .views import (
    ExaminationListView,
    ExaminationCreateView,
    ExaminationDetailView,
    ExamResultListView,
    ExamResultCreateView,
    ExamResultDetailView,
)

urlpatterns = [
    # Examination APIs
    path("", ExaminationListView.as_view(), name="examination_list"),
    path("create/", ExaminationCreateView.as_view(), name="examination_create"),
    path("<int:pk>/", ExaminationDetailView.as_view(), name="examination_detail"),

    # Examination Result APIs
    path("results/", ExamResultListView.as_view(), name="exam_result_list"),
    path("results/create/", ExamResultCreateView.as_view(), name="exam_result_create"),
    path("results/<int:pk>/", ExamResultDetailView.as_view(), name="exam_result_detail"),
]