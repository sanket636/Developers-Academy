from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Student
from .serializers import (
    StudentSerializer,
    StudentCreateSerializer,
)


# ==========================================
# ADMIN OR TEACHER PERMISSION
# ==========================================

class IsAdminOrTeacher(permissions.BasePermission):

    def has_permission(self, request, view):

        return (
            request.user.is_authenticated
            and request.user.role in ["ADMIN", "TEACHER"]
        )


# ==========================================
# STUDENT LIST API
# GET /api/students/
# ==========================================

class StudentListView(generics.ListAPIView):

    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role in ["ADMIN", "TEACHER"]:

            return Student.objects.select_related(
                "user"
            ).all().order_by("-created_at")

        return Student.objects.select_related(
            "user"
        ).filter(user=user)


# ==========================================
# STUDENT DETAIL API
# GET /api/students/<id>/
# PUT /api/students/<id>/
# PATCH /api/students/<id>/
# DELETE /api/students/<id>/
# ==========================================

class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role in ["ADMIN", "TEACHER"]:

            return Student.objects.select_related("user").all()

        return Student.objects.select_related(
            "user"
        ).filter(user=user)

    def update(self, request, *args, **kwargs):

        if request.user.role not in ["ADMIN", "TEACHER"]:

            raise PermissionDenied(
                "Only Admin or Teacher can update student details."
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):

        if request.user.role not in ["ADMIN", "TEACHER"]:

            raise PermissionDenied(
                "Only Admin or Teacher can delete students."
            )

        return super().destroy(request, *args, **kwargs)


# ==========================================
# STUDENT CREATE API
# POST /api/students/create/
# ==========================================

class StudentCreateView(generics.CreateAPIView):

    queryset = Student.objects.select_related("user").all()

    serializer_class = StudentCreateSerializer

    permission_classes = [IsAdminOrTeacher]