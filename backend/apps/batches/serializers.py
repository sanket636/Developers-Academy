from rest_framework import serializers

from .models import Batch, BatchEnrollment


class BatchSerializer(serializers.ModelSerializer):

    course_name = serializers.CharField(
        source="course.course_name",
        read_only=True
    )

    teacher_name = serializers.CharField(
        source="teacher.user.get_full_name",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Batch

        fields = [
            "id",
            "batch_name",
            "batch_code",
            "course",
            "course_name",
            "teacher",
            "teacher_name",
            "start_date",
            "end_date",
            "max_students",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "course_name",
            "teacher_name",
            "created_at",
            "updated_at",
        ]

    def validate_batch_code(self, value):

        value = value.strip().upper()

        queryset = Batch.objects.filter(
            batch_code__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Batch code already exists."
            )

        return value

    def validate(self, attrs):

        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None)
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None)
        )

        max_students = attrs.get(
            "max_students",
            getattr(self.instance, "max_students", 30)
        )

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError({
                "end_date": "End date must be after start date."
            })

        if max_students <= 0:
            raise serializers.ValidationError({
                "max_students": "Maximum students must be greater than zero."
            })

        return attrs


class BatchEnrollmentSerializer(serializers.ModelSerializer):

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

    class Meta:
        model = BatchEnrollment

        fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "batch",
            "batch_name",
            "enrollment_date",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "enrollment_date",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        student = attrs.get(
            "student",
            getattr(self.instance, "student", None)
        )

        batch = attrs.get(
            "batch",
            getattr(self.instance, "batch", None)
        )

        status = attrs.get(
            "status",
            getattr(
                self.instance,
                "status",
                BatchEnrollment.Status.ACTIVE
            )
        )

        if student and batch:

            if student.status != "ACTIVE":
                raise serializers.ValidationError({
                    "student": "Only active students can be enrolled."
                })

            if batch.status in ["COMPLETED", "CANCELLED"]:
                raise serializers.ValidationError({
                    "batch": (
                        "Cannot enroll students in a completed "
                        "or cancelled batch."
                    )
                })

            existing = BatchEnrollment.objects.filter(
                student=student,
                batch=batch
            )

            if self.instance:
                existing = existing.exclude(
                    pk=self.instance.pk
                )

            if existing.exists():
                raise serializers.ValidationError(
                    "Student is already enrolled in this batch."
                )

            if status == BatchEnrollment.Status.ACTIVE:

                active_count = BatchEnrollment.objects.filter(
                    batch=batch,
                    status=BatchEnrollment.Status.ACTIVE
                ).exclude(
                    pk=self.instance.pk if self.instance else None
                ).count()

                if active_count >= batch.max_students:
                    raise serializers.ValidationError({
                        "batch": (
                            "Batch has reached its maximum "
                            "student capacity."
                        )
                    })

        return attrs