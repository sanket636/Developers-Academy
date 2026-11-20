from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class FeeInvoice(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PARTIAL = "PARTIAL", "Partially Paid"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.PROTECT,
        related_name="fee_invoices"
    )

    batch = models.ForeignKey(
        "batches.Batch",
        on_delete=models.PROTECT,
        related_name="fee_invoices"
    )

    total_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))]
    )

    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )

    due_date = models.DateField()

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING
    )

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_fee_invoices"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def final_fee(self):
        return self.total_fee - self.discount

    @property
    def paid_amount(self):
        return self.payments.aggregate(
            total=models.Sum("amount")
        )["total"] or Decimal("0.00")

    @property
    def balance_amount(self):
        return self.final_fee - self.paid_amount

    def __str__(self):
        return f"Invoice #{self.id} - {self.student}"


class FeePayment(models.Model):

    class PaymentMethod(models.TextChoices):
        CASH = "CASH", "Cash"
        UPI = "UPI", "UPI"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
        CARD = "CARD", "Card"
        CHEQUE = "CHEQUE", "Cheque"

    invoice = models.ForeignKey(
        FeeInvoice,
        on_delete=models.PROTECT,
        related_name="payments"
    )

    receipt_number = models.CharField(
        max_length=50,
        unique=True
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))]
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices
    )

    payment_date = models.DateField()

    transaction_id = models.CharField(
        max_length=100,
        blank=True
    )

    remarks = models.TextField(blank=True)

    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="received_fee_payments"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-payment_date", "-created_at"]

    def __str__(self):
        return f"{self.receipt_number} - {self.amount}"