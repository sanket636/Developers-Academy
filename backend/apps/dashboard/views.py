from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.utils import timezone

from rest_framework import generics, permissions
from rest_framework.response import Response

from apps.students.models import Student
from apps.teachers.models import Teacher
from apps.courses.models import Course
from apps.batches.models import Batch, BatchEnrollment
from apps.attendance.models import Attendance
from apps.examinations.models import Examination, ExamResult
from apps.fees.models import FeeInvoice, FeePayment
from apps.timetable.models import Timetable
from apps.notifications.models import Notification


User = get_user_model()


class DashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == "ADMIN":
            data = self.admin_dashboard()

        elif user.role == "TEACHER":
            data = self.teacher_dashboard(user)

        elif user.role == "STUDENT":
            data = self.student_dashboard(user)

        else:
            return Response(
                {"detail": "Invalid user role."},
                status=403
            )

        return Response({
            "role": user.role,
            "dashboard": data
        })

    def admin_dashboard(self):
        today = timezone.localdate()

        total_students = Student.objects.count()
        total_teachers = Teacher.objects.count()
        total_courses = Course.objects.count()
        total_batches = Batch.objects.count()

        total_fees_collected = (
            FeePayment.objects.aggregate(total=Sum("amount"))["total"] or 0
        )

        return {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_courses": total_courses,
            "total_batches": total_batches,
            "total_attendance_records": Attendance.objects.count(),
            "total_examinations": Examination.objects.count(),
            "total_fee_invoices": FeeInvoice.objects.count(),
            "total_fees_collected": total_fees_collected,
            "pending_fee_invoices": FeeInvoice.objects.filter(
                status__in=["PENDING", "PARTIAL", "OVERDUE"]
            ).count(),
            "today_attendance": Attendance.objects.filter(
                date=today
            ).count(),
            "unread_notifications": Notification.objects.filter(
                is_read=False
            ).count(),
        }

    def teacher_dashboard(self, user):
        teacher = Teacher.objects.filter(user=user).first()

        if not teacher:
            return {
                "message": "Teacher profile not found.",
                "assigned_batches": 0,
                "total_students": 0,
            }

        batches = Batch.objects.filter(teacher=teacher)

        return {
            "assigned_batches": batches.count(),
            "total_students": BatchEnrollment.objects.filter(
                batch__in=batches,
                status="ACTIVE"
            ).values("student").distinct().count(),
            "total_attendance_records": Attendance.objects.filter(
                batch__in=batches
            ).count(),
            "upcoming_examinations": Examination.objects.filter(
                batch__in=batches,
                status="UPCOMING"
            ).count(),
            "timetable_entries": Timetable.objects.filter(
                teacher=teacher,
                status="ACTIVE"
            ).count(),
            "unread_notifications": Notification.objects.filter(
                recipient=user,
                is_read=False
            ).count(),
        }

    def student_dashboard(self, user):
        student = Student.objects.filter(user=user).first()

        if not student:
            return {
                "message": "Student profile not found.",
                "enrolled_batches": 0,
            }

        active_enrollments = BatchEnrollment.objects.filter(
            student=student,
            status="ACTIVE"
        )

        batches = Batch.objects.filter(
            enrollments__student=student,
            enrollments__status="ACTIVE"
        ).distinct()

        attendance_records = Attendance.objects.filter(
            student=student
        )

        return {
            "enrolled_batches": active_enrollments.count(),
            "total_attendance": attendance_records.count(),
            "present_attendance": attendance_records.filter(
                status="PRESENT"
            ).count(),
            "absent_attendance": attendance_records.filter(
                status="ABSENT"
            ).count(),
            "total_exam_results": ExamResult.objects.filter(
                student=student
            ).count(),
            "total_fee_invoices": FeeInvoice.objects.filter(
                student=student
            ).count(),
            "pending_fee_invoices": FeeInvoice.objects.filter(
                student=student,
                status__in=["PENDING", "PARTIAL", "OVERDUE"]
            ).count(),
            "timetable_entries": Timetable.objects.filter(
                batch__in=batches,
                status="ACTIVE"
            ).count(),
            "unread_notifications": Notification.objects.filter(
                recipient=user,
                is_read=False
            ).count(),
        }