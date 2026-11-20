from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.user.get_full_name",
        read_only=True
    )
    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True
    )
    batch_name = serializers.CharField(
        source="batch.batch_name",
        read_only=True
    )
    marked_by_name = serializers.CharField(
        source="marked_by.username",
        read_only=True
    )

    class Meta:
        model = Attendance
        fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "batch",
            "batch_name",
            "date",
            "status",
            "remarks",
            "marked_by",
            "marked_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "marked_by",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        student = attrs.get("student", getattr(self.instance, "student", None))
        batch = attrs.get("batch", getattr(self.instance, "batch", None))
        date = attrs.get("date", getattr(self.instance, "date", None))

        if student and batch:
            if not batch.course:
                raise serializers.ValidationError(
                    {"batch": "Selected batch has no course assigned."}
                )

        if student and batch and date:
            if Attendance.objects.filter(
                student=student,
                batch=batch,
                date=date
            ).exclude(pk=self.instance.pk if self.instance else None).exists():
                raise serializers.ValidationError(
                    "Attendance already exists for this student, batch and date."
                )

        return attrs