from django.urls import path

from .views import (
    FeeInvoiceListView,
    FeeInvoiceCreateView,
    FeeInvoiceDetailView,
    FeePaymentListView,
    FeePaymentCreateView,
    FeePaymentDetailView,
)

urlpatterns = [
    # Fee Invoice APIs
    path("invoices/", FeeInvoiceListView.as_view(), name="fee_invoice_list"),
    path("invoices/create/", FeeInvoiceCreateView.as_view(), name="fee_invoice_create"),
    path("invoices/<int:pk>/", FeeInvoiceDetailView.as_view(), name="fee_invoice_detail"),

    # Fee Payment APIs
    path("payments/", FeePaymentListView.as_view(), name="fee_payment_list"),
    path("payments/create/", FeePaymentCreateView.as_view(), name="fee_payment_create"),
    path("payments/<int:pk>/", FeePaymentDetailView.as_view(), name="fee_payment_detail"),
]