from django.urls import path

from .views import (
    StudentRegistrationView,
    StudentProfileView,
    StudentProfileUpdateView,
)


urlpatterns = [

    # Student Registration
    path(
        "register/",
        StudentRegistrationView.as_view(),
        name="student_register"
    ),

    # Student Profile
    path(
        "profile/",
        StudentProfileView.as_view(),
        name="student_profile"
    ),

    # Student Profile Update
    path(
        "profile/update/",
        StudentProfileUpdateView.as_view(),
        name="student_profile_update"
    ),

]