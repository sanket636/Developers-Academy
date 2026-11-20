from django.contrib import admin
from django.urls import include, path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    # Accounts APIs
    path("api/auth/", include("apps.accounts.urls")),

    # JWT Authentication
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Students APIs
    path("api/students/", include("apps.students.urls")),
    path("api/teachers/", include("apps.teachers.urls")),
    path("api/courses/", include("apps.courses.urls")),
    path("api/batches/", include("apps.batches.urls")),
    path("api/attendance/", include("apps.attendance.urls")),
    path("api/examinations/", include("apps.examinations.urls")),
    path("api/fees/", include("apps.fees.urls")),
    path("api/timetable/", include("apps.timetable.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
]