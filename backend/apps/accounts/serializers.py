from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


User = get_user_model()


# ==========================================
# STUDENT REGISTRATION SERIALIZER
# ==========================================

class StudentRegistrationSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"}
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"}
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "password",
            "confirm_password",
        ]

        read_only_fields = ["id"]

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")

        password = validated_data.pop("password")

        user = User.objects.create_user(
            **validated_data,
            password=password,
            role=User.Role.STUDENT
        )

        return user


# ==========================================
# STUDENT PROFILE SERIALIZER
# ==========================================

class StudentProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "profile_picture",
            "date_of_birth",
            "address",
            "created_at",
        ]

        read_only_fields = fields


# ==========================================
# STUDENT PROFILE UPDATE SERIALIZER
# ==========================================

class StudentProfileUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "profile_picture",
            "date_of_birth",
            "address",
        ]

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value
        ).exclude(
            pk=self.instance.pk
        ).exists():

            raise serializers.ValidationError(
                "This email address is already registered."
            )

        return value