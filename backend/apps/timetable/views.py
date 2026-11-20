from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Timetable
from .serializers import TimetableSerializer


class TimetableListView(generics.ListAPIView):
    serializer_class = TimetableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Timetable.objects.select_related(
            "batch",
            "batch__course",
            "teacher",
            "teacher__user"
        )

        if user.role == "ADMIN":
            pass

        elif user.role == "TEACHER":
            queryset = queryset.filter(teacher__user=user)

        elif user.role == "STUDENT":
            queryset = queryset.filter(
                batch__enrollments__student__user=user,
                batch__enrollments__status="ACTIVE"
            )

        else:
            return Timetable.objects.none()

        batch_id = self.request.query_params.get("batch")
        day = self.request.query_params.get("day")
        teacher_id = self.request.query_params.get("teacher")

        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)

        if day:
            queryset = queryset.filter(day_of_week=day.upper())

        if teacher_id and user.role in ["ADMIN", "TEACHER"]:
            queryset = queryset.filter(teacher_id=teacher_id)

        return queryset.distinct()


class TimetableCreateView(generics.CreateAPIView):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can create timetable entries."
            )

        serializer.save()


class TimetableDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TimetableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Timetable.objects.select_related(
            "batch",
            "batch__course",
            "teacher",
            "teacher__user"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "TEACHER":
            return queryset.filter(teacher__user=user)

        if user.role == "STUDENT":
            return queryset.filter(
                batch__enrollments__student__user=user,
                batch__enrollments__status="ACTIVE"
            ).distinct()

        return Timetable.objects.none()

    def update(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can update timetable entries."
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can delete timetable entries."
            )

        return super().destroy(request, *args, **kwargs)