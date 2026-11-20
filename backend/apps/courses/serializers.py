from rest_framework import serializers
from .models import Course


class CourseSerializer(serializers.ModelSerializer):

    teacher_name = serializers.CharField(
        source="teacher.user.get_full_name",
        read_only=True
    )

    class Meta:
        model = Course

        fields = [
            "id",
            "course_name",
            "course_code",
            "description",
            "duration_months",
            "course_fee",
            "teacher",
            "teacher_name",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "teacher_name",
            "created_at",
            "updated_at",
        ]

    def validate_course_code(self, value):

        value = value.strip().upper()

        queryset = Course.objects.filter(
            course_code__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Course code already exists."
            )

        return value

    def validate_course_fee(self, value):

        if value < 0:
            raise serializers.ValidationError(
                "Course fee cannot be negative."
            )

        return value

    def validate_duration_months(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "Course duration must be greater than zero."
            )

        return value