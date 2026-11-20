import uuid

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import FeeInvoice, FeePayment
from .serializers import FeeInvoiceSerializer, FeePaymentSerializer


class FeeInvoiceListView(generics.ListAPIView):
    serializer_class = FeeInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = FeeInvoice.objects.select_related(
            "student__user", "batch", "created_by"
        ).prefetch_related("payments")

        if user.role == "ADMIN":
            pass
        elif user.role == "TEACHER":
            queryset = queryset.filter(batch__teacher__user=user)
        elif user.role == "STUDENT":
            queryset = queryset.filter(student__user=user)
        else:
            return FeeInvoice.objects.none()

        student_id = self.request.query_params.get("student")
        batch_id = self.request.query_params.get("batch")

        if student_id and user.role in ["ADMIN", "TEACHER"]:
            queryset = queryset.filter(student_id=student_id)

        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)

        return queryset.distinct()


class FeeInvoiceCreateView(generics.CreateAPIView):
    queryset = FeeInvoice.objects.all()
    serializer_class = FeeInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "ADMIN":
            raise PermissionDenied("Only Admin can create fee invoices.")

        serializer.save(created_by=user)


class FeeInvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeeInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = FeeInvoice.objects.select_related(
            "student__user", "batch", "created_by"
        ).prefetch_related("payments")

        if user.role == "ADMIN":
            return queryset

        if user.role == "TEACHER":
            return queryset.filter(batch__teacher__user=user)

        if user.role == "STUDENT":
            return queryset.filter(student__user=user)

        return FeeInvoice.objects.none()

    def update(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            raise PermissionDenied("Only Admin can update fee invoices.")

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            raise PermissionDenied("Only Admin can delete fee invoices.")

        invoice = self.get_object()

        if invoice.payments.exists():
            raise ValidationError(
                "Cannot delete an invoice with payment records."
            )

        return super().destroy(request, *args, **kwargs)


class FeePaymentListView(generics.ListAPIView):
    serializer_class = FeePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = FeePayment.objects.select_related(
            "invoice", "invoice__student__user", "received_by"
        )

        if user.role == "ADMIN":
            pass
        elif user.role == "TEACHER":
            queryset = queryset.filter(
                invoice__batch__teacher__user=user
            )
        elif user.role == "STUDENT":
            queryset = queryset.filter(
                invoice__student__user=user
            )
        else:
            return FeePayment.objects.none()

        invoice_id = self.request.query_params.get("invoice")

        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)

        return queryset


class FeePaymentCreateView(generics.CreateAPIView):
    queryset = FeePayment.objects.all()
    serializer_class = FeePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user

        if user.role not in ["ADMIN", "TEACHER"]:
            raise PermissionDenied(
                "Students cannot record fee payments."
            )

        invoice = serializer.validated_data["invoice"]

        if user.role == "TEACHER":
            if invoice.batch.teacher is None or invoice.batch.teacher.user_id != user.id:
                raise PermissionDenied(
                    "You can record payments only for your assigned batches."
                )

        receipt_number = f"DA-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"

        serializer.save(
            received_by=user,
            receipt_number=receipt_number
        )

        invoice.refresh_from_db()

        paid_amount = invoice.payments.aggregate(
            total=Sum("amount")
        )["total"] or 0

        if paid_amount >= invoice.final_fee:
            invoice.status = FeeInvoice.Status.PAID
        elif paid_amount > 0:
            invoice.status = FeeInvoice.Status.PARTIAL
        else:
            invoice.status = FeeInvoice.Status.PENDING

        invoice.save(update_fields=["status", "updated_at"])


class FeePaymentDetailView(generics.RetrieveAPIView):
    serializer_class = FeePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = FeePayment.objects.select_related(
            "invoice", "invoice__student__user", "received_by"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "TEACHER":
            return queryset.filter(invoice__batch__teacher__user=user)

        if user.role == "STUDENT":
            return queryset.filter(invoice__student__user=user)

        return FeePayment.objects.none()