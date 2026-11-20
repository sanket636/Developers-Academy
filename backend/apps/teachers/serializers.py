from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import Teacher

User = get_user_model()


class TeacherSerializer(serializers.ModelSerializer):

    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = Teacher

        fields = [
            "id",
            "user",
            "username",
            "first_name",
            "last_name",
            "email",
            "employee_id",
            "qualification",
            "specialization",
            "experience_years",
            "joining_date",
            "salary",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "first_name",
            "last_name",
            "email",
            "created_at",
            "updated_at",
        ]


class TeacherCreateSerializer(serializers.Serializer):

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )

    employee_id = serializers.CharField(max_length=30)

    qualification = serializers.ChoiceField(
        choices=Teacher.Qualification.choices,
        default=Teacher.Qualification.OTHER
    )

    specialization = serializers.CharField(max_length=150)

    experience_years = serializers.IntegerField(min_value=0, default=0)

    joining_date = serializers.DateField()

    salary = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        default=0
    )

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_employee_id(self, value):
        if Teacher.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("Employee ID already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):

        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=validated_data.pop("username"),
            email=validated_data.pop("email"),
            first_name=validated_data.pop("first_name"),
            last_name=validated_data.pop("last_name"),
            password=password,
            role=User.Role.TEACHER
        )

        teacher = Teacher.objects.create(
            user=user,
            **validated_data
        )

        return teacher

    def to_representation(self, instance):
        return TeacherSerializer(
            instance,
            context=self.context
        ).data