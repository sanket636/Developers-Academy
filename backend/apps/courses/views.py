from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Course
from .serializers import CourseSerializer


class IsAdminPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class CourseListView(generics.ListAPIView):

    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return Course.objects.select_related(
                "teacher__user"
            ).all()

        if user.role == "TEACHER":
            return Course.objects.select_related(
                "teacher__user"
            ).filter(teacher__user=user)

        return Course.objects.select_related(
            "teacher__user"
        ).filter(status="ACTIVE")


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return Course.objects.select_related(
                "teacher__user"
            ).all()

        if user.role == "TEACHER":
            return Course.objects.select_related(
                "teacher__user"
            ).filter(teacher__user=user)

        return Course.objects.select_related(
            "teacher__user"
        ).filter(status="ACTIVE")

    def update(self, request, *args, **kwargs):

        if request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can update courses."
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):

        if request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can delete courses."
            )

        return super().destroy(request, *args, **kwargs)


class CourseCreateView(generics.CreateAPIView):

    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminPermission]