
"""
Django settings for Developers Academy project.
"""

import os
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv


# =====================================================
# BASE DIRECTORY
# =====================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# Load Environment Variables
load_dotenv(BASE_DIR / ".env")


# =====================================================
# SECURITY CONFIGURATION
# =====================================================

SECRET_KEY = os.getenv("SECRET_KEY")

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]


# =====================================================
# APPLICATION CONFIGURATION
# =====================================================

INSTALLED_APPS = [

    # Django Built-in Apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-Party Apps
    "rest_framework",
    "corsheaders",

    # Local Apps
    "apps.accounts.apps.AccountsConfig",
    "apps.students.apps.StudentsConfig",
    "apps.teachers.apps.TeachersConfig",
    "apps.courses.apps.CoursesConfig",
    "apps.batches.apps.BatchesConfig",
    "apps.attendance.apps.AttendanceConfig",
    "apps.examinations.apps.ExaminationsConfig",
    "apps.fees.apps.FeesConfig",
    "apps.timetable.apps.TimetableConfig",
    "apps.notifications.apps.NotificationsConfig",
    "apps.dashboard.apps.DashboardConfig",
]


# Custom User Model
AUTH_USER_MODEL = "accounts.User"


# =====================================================
# MIDDLEWARE CONFIGURATION
# =====================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# =====================================================
# URL CONFIGURATION
# =====================================================

ROOT_URLCONF = "config.urls"


# =====================================================
# TEMPLATE CONFIGURATION
# =====================================================

TEMPLATES = [

    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {

            "context_processors": [

                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",

            ],

        },

    },

]


# =====================================================
# WSGI CONFIGURATION
# =====================================================

WSGI_APPLICATION = "config.wsgi.application"


# =====================================================
# DATABASE CONFIGURATION - POSTGRESQL
# =====================================================

DATABASES = {

    "default": {

        "ENGINE": "django.db.backends.postgresql",

        "NAME": os.getenv("DB_NAME"),

        "USER": os.getenv("DB_USER"),

        "PASSWORD": os.getenv("DB_PASSWORD"),

        "HOST": os.getenv("DB_HOST", "localhost"),

        "PORT": os.getenv("DB_PORT", "5432"),

    }

}


# =====================================================
# PASSWORD VALIDATION
# =====================================================

AUTH_PASSWORD_VALIDATORS = [

    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },

    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },

    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },

    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },

]


# =====================================================
# INTERNATIONALIZATION
# =====================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# =====================================================
# STATIC FILE CONFIGURATION
# =====================================================

STATIC_URL = "static/"


# =====================================================
# MEDIA FILE CONFIGURATION
# =====================================================

MEDIA_URL = "media/"

MEDIA_ROOT = BASE_DIR / "media"


# =====================================================
# EMAIL CONFIGURATION
# =====================================================

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


# =====================================================
# DJANGO REST FRAMEWORK CONFIGURATION
# =====================================================

REST_FRAMEWORK = {

    "DEFAULT_AUTHENTICATION_CLASSES": [

        "rest_framework_simplejwt.authentication.JWTAuthentication",

    ],

    "DEFAULT_PERMISSION_CLASSES": [

        "rest_framework.permissions.IsAuthenticated",

    ],

}


# =====================================================
# JWT AUTHENTICATION CONFIGURATION
# =====================================================

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),

    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),

    "ROTATE_REFRESH_TOKENS": True,

    "AUTH_HEADER_TYPES": ("Bearer",),
    "SIGNING_KEY": os.getenv("JWT_SIGNING_KEY"),

}


# =====================================================
# DEFAULT PRIMARY KEY
# =====================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]