from django.db.models import Q
from rest_framework import serializers

from .models import Timetable


class TimetableSerializer(serializers.ModelSerializer):

    batch_name = serializers.CharField(
        source="batch.batch_name",
        read_only=True
    )

    teacher_name = serializers.CharField(
        source="teacher.user.get_full_name",
        read_only=True
    )

    course_name = serializers.CharField(
        source="batch.course.course_name",
        read_only=True
    )

    class Meta:
        model = Timetable
        fields = [
            "id",
            "batch",
            "batch_name",
            "course_name",
            "teacher",
            "teacher_name",
            "subject",
            "day_of_week",
            "start_time",
            "end_time",
            "classroom",
            "effective_from",
            "effective_to",
            "status",
            "description",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        instance = self.instance

        batch = attrs.get(
            "batch",
            instance.batch if instance else None
        )

        teacher = attrs.get(
            "teacher",
            instance.teacher if instance else None
        )

        day = attrs.get(
            "day_of_week",
            instance.day_of_week if instance else None
        )

        start_time = attrs.get(
            "start_time",
            instance.start_time if instance else None
        )

        end_time = attrs.get(
            "end_time",
            instance.end_time if instance else None
        )

        classroom = attrs.get(
            "classroom",
            instance.classroom if instance else None
        )

        effective_from = attrs.get(
            "effective_from",
            instance.effective_from if instance else None
        )

        effective_to = attrs.get(
            "effective_to",
            instance.effective_to if instance else None
        )

        status = attrs.get(
            "status",
            instance.status if instance else Timetable.Status.ACTIVE
        )

        # Validate lecture timing
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                "end_time": "End time must be after start time."
            })

        # Validate effective dates
        if (
            effective_from
            and effective_to
            and effective_to < effective_from
        ):
            raise serializers.ValidationError({
                "effective_to": "End date cannot be before start date."
            })

        # Validate assigned teacher
        if batch and teacher:
            if batch.teacher_id != teacher.id:
                raise serializers.ValidationError({
                    "teacher": "Teacher must be assigned to the selected batch."
                })

        # Conflict validation for active timetable entries
        if (
            status == Timetable.Status.ACTIVE
            and batch
            and teacher
            and day
            and start_time
            and end_time
            and classroom
            and effective_from
            and effective_to
        ):

            conflicts = Timetable.objects.filter(
                day_of_week=day,
                status=Timetable.Status.ACTIVE,
                effective_from__lte=effective_to,
                effective_to__gte=effective_from,
                start_time__lt=end_time,
                end_time__gt=start_time,
            )

            # Exclude current record during update
            if instance:
                conflicts = conflicts.exclude(pk=instance.pk)

            conflicts = conflicts.filter(
                Q(teacher=teacher)
                | Q(classroom__iexact=classroom)
                | Q(batch=batch)
            )

            if conflicts.exists():
                raise serializers.ValidationError(
                    "Schedule conflict: Teacher, classroom, or batch "
                    "already has another lecture during this time."
                )

        return attrs