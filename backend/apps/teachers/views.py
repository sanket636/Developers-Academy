from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Teacher
from .serializers import TeacherSerializer, TeacherCreateSerializer


class IsAdminPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class TeacherListView(generics.ListAPIView):

    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return Teacher.objects.select_related("user").all()

        if user.role == "TEACHER":
            return Teacher.objects.select_related("user").filter(user=user)

        return Teacher.objects.none()


class TeacherDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return Teacher.objects.select_related("user").all()

        if user.role == "TEACHER":
            return Teacher.objects.select_related("user").filter(user=user)

        return Teacher.objects.none()

    def update(self, request, *args, **kwargs):

        if request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can update teacher details."
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):

        if request.user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin can delete teachers."
            )

        return super().destroy(request, *args, **kwargs)


class TeacherCreateView(generics.CreateAPIView):

    queryset = Teacher.objects.all()
    serializer_class = TeacherCreateSerializer
    permission_classes = [IsAdminPermission]