from rest_framework import generics, permissions

from .serializers import (
    StudentRegistrationSerializer,
    StudentProfileSerializer,
    StudentProfileUpdateSerializer,
)


# ==========================================
# STUDENT REGISTRATION API
# ==========================================

class StudentRegistrationView(generics.CreateAPIView):

    serializer_class = StudentRegistrationSerializer
    permission_classes = [permissions.AllowAny]


# ==========================================
# STUDENT PROFILE API
# ==========================================

class StudentProfileView(generics.RetrieveAPIView):

    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ==========================================
# STUDENT PROFILE UPDATE API
# ==========================================

class StudentProfileUpdateView(generics.UpdateAPIView):

    serializer_class = StudentProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user