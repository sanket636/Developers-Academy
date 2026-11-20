from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import Student

User = get_user_model()


# ==========================================
# STUDENT OUTPUT SERIALIZER
# ==========================================

class StudentSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True
    )

    class Meta:
        model = Student

        fields = [
            "id",
            "user",
            "username",
            "first_name",
            "last_name",
            "email",
            "admission_number",
            "admission_date",
            "guardian_name",
            "guardian_phone",
            "emergency_contact",
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


# ==========================================
# STUDENT CREATE SERIALIZER
# ==========================================

class StudentCreateSerializer(serializers.Serializer):

    username = serializers.CharField(max_length=150)

    email = serializers.EmailField()

    first_name = serializers.CharField(max_length=150)

    last_name = serializers.CharField(max_length=150)

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )

    admission_number = serializers.CharField(max_length=30)

    admission_date = serializers.DateField()

    guardian_name = serializers.CharField(max_length=150)

    guardian_phone = serializers.CharField(max_length=15)

    emergency_contact = serializers.CharField(
        max_length=15,
        required=False,
        allow_blank=True
    )

    # ======================================
    # USERNAME VALIDATION
    # ======================================

    def validate_username(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Username cannot be empty."
            )

        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

    # ======================================
    # EMAIL VALIDATION
    # ======================================

    def validate_email(self, value):

        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Email already exists."
            )

        return value

    # ======================================
    # ADMISSION NUMBER VALIDATION
    # ======================================

    def validate_admission_number(self, value):

        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Admission number cannot be empty."
            )

        if Student.objects.filter(
            admission_number__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "Admission number already exists."
            )

        return value

    # ======================================
    # PHONE NUMBER VALIDATION
    # ======================================

    def validate_guardian_phone(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Guardian phone number is required."
            )

        if not value.replace("+", "").isdigit():
            raise serializers.ValidationError(
                "Enter a valid guardian phone number."
            )

        return value

    def validate_emergency_contact(self, value):

        value = value.strip()

        if value and not value.replace("+", "").isdigit():
            raise serializers.ValidationError(
                "Enter a valid emergency contact number."
            )

        return value

    # ======================================
    # CREATE USER AND STUDENT
    # ======================================

    @transaction.atomic
    def create(self, validated_data):

        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=validated_data.pop("username"),
            email=validated_data.pop("email"),
            first_name=validated_data.pop("first_name"),
            last_name=validated_data.pop("last_name"),
            password=password,
            role=User.Role.STUDENT
        )

        student = Student.objects.create(
            user=user,
            **validated_data
        )

        return student

    # ======================================
    # RETURN STUDENT RESPONSE
    # ======================================

    def to_representation(self, instance):

        return StudentSerializer(
            instance,
            context=self.context
        ).data