from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Examination, ExamResult
from .serializers import ExaminationSerializer, ExamResultSerializer


class IsAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class ExaminationListView(generics.ListAPIView):
    serializer_class = ExaminationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Examination.objects.select_related(
            "batch", "batch__course", "created_by"
        )

        if user.role == "ADMIN":
            pass

        elif user.role == "TEACHER":
            queryset = queryset.filter(batch__teacher__user=user)

        elif user.role == "STUDENT":
            queryset = queryset.filter(
                batch__enrollments__student__user=user,
                batch__enrollments__status="ACTIVE"
            )

        else:
            return Examination.objects.none()

        batch_id = self.request.query_params.get("batch")
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)

        return queryset.distinct()


class ExaminationCreateView(generics.CreateAPIView):
    queryset = Examination.objects.all()
    serializer_class = ExaminationSerializer
    permission_classes = [IsAdminPermission]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ExaminationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExaminationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Examination.objects.select_related(
            "batch", "batch__course", "created_by"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "TEACHER":
            return queryset.filter(batch__teacher__user=user)

        if user.role == "STUDENT":
            return queryset.filter(
                batch__enrollments__student__user=user,
                batch__enrollments__status="ACTIVE"
            ).distinct()

        return Examination.objects.none()

    def update(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            raise PermissionDenied("Only Admin can update examinations.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            raise PermissionDenied("Only Admin can delete examinations.")
        return super().destroy(request, *args, **kwargs)


class ExamResultListView(generics.ListAPIView):
    serializer_class = ExamResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = ExamResult.objects.select_related(
            "examination", "examination__batch", "student", "student__user",
            "entered_by"
        )

        if user.role == "ADMIN":
            pass

        elif user.role == "TEACHER":
            queryset = queryset.filter(
                examination__batch__teacher__user=user
            )

        elif user.role == "STUDENT":
            queryset = queryset.filter(student__user=user)

        else:
            return ExamResult.objects.none()

        exam_id = self.request.query_params.get("examination")
        if exam_id:
            queryset = queryset.filter(examination_id=exam_id)

        return queryset


class ExamResultCreateView(generics.CreateAPIView):
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == "ADMIN":
            serializer.save(entered_by=user)
            return

        if user.role == "TEACHER":
            examination = serializer.validated_data["examination"]

            if examination.batch.teacher.user_id != user.id:
                raise PermissionDenied(
                    "You can enter results only for your assigned batches."
                )

            serializer.save(entered_by=user)
            return

        raise PermissionDenied("Students cannot enter examination results.")


class ExamResultDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExamResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = ExamResult.objects.select_related(
            "examination", "examination__batch", "student", "student__user",
            "entered_by"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "TEACHER":
            return queryset.filter(
                examination__batch__teacher__user=user
            )

        if user.role == "STUDENT":
            return queryset.filter(student__user=user)

        return ExamResult.objects.none()

    def update(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "TEACHER"]:
            raise PermissionDenied(
                "Students cannot update examination results."
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can delete examination results."
            )
        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):
        user = self.request.user

        if user.role == "TEACHER":
            examination = serializer.validated_data.get(
                "examination",
                self.get_object().examination
            )

            if examination.batch.teacher.user_id != user.id:
                raise PermissionDenied(
                    "You can update results only for your assigned batches."
                )

        serializer.save(entered_by=user)