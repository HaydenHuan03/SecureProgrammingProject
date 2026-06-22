from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("api/users/", include("apps.user.urls")),
    path("api/products/", include("apps.product.urls")),
    path("api/orders/", include("apps.order.urls")),
]
