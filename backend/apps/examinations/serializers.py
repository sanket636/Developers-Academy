from rest_framework import serializers

from .models import Examination, ExamResult


class ExaminationSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(
        source="batch.batch_name",
        read_only=True
    )

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Examination
        fields = [
            "id",
            "exam_name",
            "exam_code",
            "batch",
            "batch_name",
            "exam_date",
            "total_marks",
            "passing_marks",
            "description",
            "status",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def validate_exam_code(self, value):
        value = value.strip().upper()

        queryset = Examination.objects.filter(
            exam_code__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Examination code already exists."
            )

        return value

    def validate(self, attrs):
        total_marks = attrs.get(
            "total_marks",
            getattr(self.instance, "total_marks", None)
        )

        passing_marks = attrs.get(
            "passing_marks",
            getattr(self.instance, "passing_marks", None)
        )

        if total_marks is not None and total_marks <= 0:
            raise serializers.ValidationError({
                "total_marks": "Total marks must be greater than zero."
            })

        if (
            total_marks is not None
            and passing_marks is not None
            and (passing_marks <= 0 or passing_marks > total_marks)
        ):
            raise serializers.ValidationError({
                "passing_marks": "Passing marks must be greater than zero and cannot exceed total marks."
            })

        return attrs


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.user.get_full_name",
        read_only=True
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True
    )

    exam_name = serializers.CharField(
        source="examination.exam_name",
        read_only=True
    )

    total_marks = serializers.IntegerField(
        source="examination.total_marks",
        read_only=True
    )

    percentage = serializers.SerializerMethodField()
    grade = serializers.SerializerMethodField()
    result_status = serializers.SerializerMethodField()

    entered_by_name = serializers.CharField(
        source="entered_by.username",
        read_only=True
    )

    class Meta:
        model = ExamResult
        fields = [
            "id",
            "examination",
            "exam_name",
            "student",
            "student_name",
            "admission_number",
            "marks_obtained",
            "total_marks",
            "percentage",
            "grade",
            "result_status",
            "remarks",
            "entered_by",
            "entered_by_name",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "entered_by",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        examination = attrs.get(
            "examination",
            getattr(self.instance, "examination", None)
        )

        student = attrs.get(
            "student",
            getattr(self.instance, "student", None)
        )

        marks = attrs.get(
            "marks_obtained",
            getattr(self.instance, "marks_obtained", None)
        )

        if examination and student:
            if not examination.batch_id:
                raise serializers.ValidationError(
                    "Examination batch is not configured."
                )

            if not student.batch_enrollments.filter(
                batch=examination.batch
            ).exists():
                raise serializers.ValidationError({
                    "student": "Student is not enrolled in this examination's batch."
                })

        if examination and marks is not None:
            if marks < 0 or marks > examination.total_marks:
                raise serializers.ValidationError({
                    "marks_obtained": (
                        f"Marks must be between 0 and "
                        f"{examination.total_marks}."
                    )
                })

        if examination and student:
            queryset = ExamResult.objects.filter(
                examination=examination,
                student=student
            )

            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)

            if queryset.exists():
                raise serializers.ValidationError(
                    "Result already exists for this student and examination."
                )

        return attrs

    def get_percentage(self, obj):
        if obj.examination.total_marks <= 0:
            return 0

        return round(
            float(obj.marks_obtained) / obj.examination.total_marks * 100,
            2
        )

    def get_grade(self, obj):
        percentage = self.get_percentage(obj)

        if percentage >= 90:
            return "A+"
        elif percentage >= 80:
            return "A"
        elif percentage >= 70:
            return "B"
        elif percentage >= 60:
            return "C"
        elif percentage >= 50:
            return "D"
        elif percentage >= 40:
            return "E"

        return "F"

    def get_result_status(self, obj):
        if obj.marks_obtained >= obj.examination.passing_marks:
            return "PASS"

        return "FAIL"