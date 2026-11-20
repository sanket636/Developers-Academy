from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Attendance
from .serializers import AttendanceSerializer


class AttendanceListView(generics.ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Attendance.objects.select_related(
            "student__user",
            "batch",
            "marked_by"
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
        date = self.request.query_params.get("date")
        student_id = self.request.query_params.get("student")

        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)

        if date:
            queryset = queryset.filter(date=date)

        if student_id and user.role in ["ADMIN", "TEACHER"]:
            queryset = queryset.filter(student_id=student_id)

        return queryset


class AttendanceCreateView(generics.CreateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == "ADMIN":
            serializer.save(marked_by=user)
            return

        if user.role == "TEACHER":
            if not hasattr(user, "teacher_profile"):
                raise PermissionDenied("Teacher profile not found.")

            batch = serializer.validated_data["batch"]

            if batch.teacher_id != user.teacher_profile.id:
                raise PermissionDenied(
                    "You can mark attendance only for your assigned batches."
                )

            serializer.save(marked_by=user)
            return

        raise PermissionDenied(
            "Only Admin and assigned Teachers can mark attendance."
        )


class AttendanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Attendance.objects.select_related(
            "student__user",
            "batch",
            "marked_by"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "TEACHER" and hasattr(user, "teacher_profile"):
            return queryset.filter(batch__teacher=user.teacher_profile)

        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            return queryset.filter(student=user.student_profile)

        return queryset.none()

    def update(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "TEACHER"]:
            raise PermissionDenied("Only Admin or Teacher can update attendance.")

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "TEACHER"]:
            raise PermissionDenied("Only Admin or Teacher can delete attendance.")

        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):
        user = self.request.user

        if user.role == "TEACHER":
            batch = serializer.validated_data.get(
                "batch",
                self.get_object().batch
            )

            if batch.teacher_id != user.teacher_profile.id:
                raise PermissionDenied(
                    "You can update attendance only for your assigned batches."
                )

        serializer.save()