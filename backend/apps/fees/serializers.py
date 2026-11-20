from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from .models import FeeInvoice, FeePayment


class FeeInvoiceSerializer(serializers.ModelSerializer):
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
    final_fee = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    paid_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    balance_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = FeeInvoice
        fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "batch",
            "batch_name",
            "total_fee",
            "discount",
            "final_fee",
            "paid_amount",
            "balance_amount",
            "due_date",
            "status",
            "notes",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        total_fee = attrs.get(
            "total_fee",
            getattr(self.instance, "total_fee", Decimal("0.00"))
        )
        discount = attrs.get(
            "discount",
            getattr(self.instance, "discount", Decimal("0.00"))
        )

        if discount > total_fee:
            raise serializers.ValidationError(
                {"discount": "Discount cannot exceed total fee."}
            )

        student = attrs.get(
            "student",
            getattr(self.instance, "student", None)
        )
        batch = attrs.get(
            "batch",
            getattr(self.instance, "batch", None)
        )

        if student and batch:
            if not student.batch_enrollments.filter(
                batch=batch,
                status="ACTIVE"
            ).exists():
                raise serializers.ValidationError(
                    "Student must have an active enrollment in this batch."
                )

        return attrs


class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="invoice.student.user.get_full_name",
        read_only=True
    )
    admission_number = serializers.CharField(
        source="invoice.student.admission_number",
        read_only=True
    )
    invoice_id = serializers.IntegerField(
        source="invoice.id",
        read_only=True
    )

    class Meta:
        model = FeePayment
        fields = [
            "id",
            "invoice",
            "invoice_id",
            "student_name",
            "admission_number",
            "receipt_number",
            "amount",
            "payment_method",
            "payment_date",
            "transaction_id",
            "remarks",
            "received_by",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "receipt_number",
            "received_by",
            "created_at",
        ]

    def validate(self, attrs):
        invoice = attrs.get(
            "invoice",
            getattr(self.instance, "invoice", None)
        )
        amount = attrs.get(
            "amount",
            getattr(self.instance, "amount", Decimal("0.00"))
        )

        if invoice:
            already_paid = invoice.payments.aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0.00")

            if self.instance:
                already_paid -= self.instance.amount

            if amount > invoice.final_fee - already_paid:
                raise serializers.ValidationError({
                    "amount": "Payment cannot exceed the remaining balance."
                })

        return attrs