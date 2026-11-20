from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Batch, BatchEnrollment
from .serializers import BatchSerializer, BatchEnrollmentSerializer


# Admin Permission
class IsAdminPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


# =========================
# BATCH MANAGEMENT
# =========================

class BatchListView(generics.ListAPIView):

    serializer_class = BatchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return Batch.objects.select_related(
                "course",
                "teacher__user"
            ).all()

        if user.role == "TEACHER":
            return Batch.objects.select_related(
                "course",
                "teacher__user"
            ).filter(teacher__user=user)

        return Batch.objects.select_related(
            "course",
            "teacher__user"
        ).filter(status__in=["UPCOMING", "ONGOING"])


class BatchDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = BatchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return Batch.objects.select_related(
                "course",
                "teacher__user"
            ).all()

        if user.role == "TEACHER":
            return Batch.objects.select_related(
                "course",
                "teacher__user"
            ).filter(teacher__user=user)

        return Batch.objects.select_related(
            "course",
            "teacher__user"
        ).filter(status__in=["UPCOMING", "ONGOING"])

    def update(self, request, *args, **kwargs):

        if request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can update batches."
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):

        if request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can delete batches."
            )

        return super().destroy(request, *args, **kwargs)


class BatchCreateView(generics.CreateAPIView):

    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAdminPermission]


# =========================
# BATCH ENROLLMENT MANAGEMENT
# =========================

class EnrollmentListView(generics.ListAPIView):

    serializer_class = BatchEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        queryset = BatchEnrollment.objects.select_related(
            "student__user",
            "batch"
        )

        if user.role == "ADMIN":
            pass

        elif user.role == "TEACHER":

            if not hasattr(user, "teacher_profile"):
                return queryset.none()

            queryset = queryset.filter(
                batch__teacher=user.teacher_profile
            )

        elif user.role == "STUDENT":

            if not hasattr(user, "student_profile"):
                return queryset.none()

            queryset = queryset.filter(
                student=user.student_profile
            )

        else:
            return queryset.none()

        batch_id = self.request.query_params.get("batch")
        student_id = self.request.query_params.get("student")

        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)

        if student_id and user.role in ["ADMIN", "TEACHER"]:
            queryset = queryset.filter(student_id=student_id)

        return queryset


class EnrollmentCreateView(generics.CreateAPIView):

    serializer_class = BatchEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):

        user = self.request.user

        if user.role == "ADMIN":
            serializer.save()
            return

        if user.role == "TEACHER":

            if not hasattr(user, "teacher_profile"):
                raise PermissionDenied(
                    "Teacher profile not found."
                )

            batch = serializer.validated_data["batch"]

            if batch.teacher_id != user.teacher_profile.id:
                raise PermissionDenied(
                    "You can enroll students only in your assigned batches."
                )

            serializer.save()
            return

        raise PermissionDenied(
            "Only Admin and assigned Teachers can enroll students."
        )


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = BatchEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        queryset = BatchEnrollment.objects.select_related(
            "student__user",
            "batch"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "TEACHER" and hasattr(user, "teacher_profile"):
            return queryset.filter(
                batch__teacher=user.teacher_profile
            )

        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            return queryset.filter(
                student=user.student_profile
            )

        return queryset.none()

    def update(self, request, *args, **kwargs):

        if request.user.role not in ["ADMIN", "TEACHER"]:
            raise PermissionDenied(
                "Only Admin or Teacher can update enrollment."
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):

        if request.user.role not in ["ADMIN", "TEACHER"]:
            raise PermissionDenied(
                "Only Admin or Teacher can delete enrollment."
            )

        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):

        user = self.request.user

        if user.role == "TEACHER":

            if not hasattr(user, "teacher_profile"):
                raise PermissionDenied(
                    "Teacher profile not found."
                )

            batch = serializer.validated_data.get(
                "batch",
                self.get_object().batch
            )

            if batch.teacher_id != user.teacher_profile.id:
                raise PermissionDenied(
                    "You can update only your assigned batch enrollments."
                )

        serializer.save()