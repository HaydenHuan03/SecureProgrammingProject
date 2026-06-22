from decimal import Decimal
from django.db import transaction
from apps.product.models import Product
from apps.user.models import User
from .models import Order, OrderItem, OrderStatus


class InsufficientStockError(Exception):
    """Raised when a product does not have enough stock to fulfil a line item."""
    pass


class ProductNotFoundError(Exception):
    pass


def create_order(user: User, items: list[dict]) -> Order:
    """
    Create an order atomically.

    items: list of {"product_id": UUID, "quantity": int}

    unit_price is always snapshotted from product.price — it is never taken
    from the caller's input, preventing client-side price manipulation.
    """
    with transaction.atomic():
        total = Decimal("0.00")
        line_items = []

        for item in items:
            try:
                # select_for_update locks the row so concurrent orders cannot
                # both read the same stock level and both succeed
                product = Product.objects.select_for_update().get(pk=item["product_id"])
            except Product.DoesNotExist:
                raise ProductNotFoundError(f"product {item['product_id']} not found")

            if product.stock < item["quantity"]:
                raise InsufficientStockError(
                    f'"{product.name}" only has {product.stock} unit(s) in stock'
                )

            # Snapshot the price — never trust the client value
            unit_price = product.price
            line_items.append({
                "product": product,
                "quantity": item["quantity"],
                "unit_price": unit_price,
            })
            total += unit_price * item["quantity"]

        order = Order.objects.create(user=user, total_price=total)

        for li in line_items:
            OrderItem.objects.create(
                order=order,
                product=li["product"],
                quantity=li["quantity"],
                unit_price=li["unit_price"],
            )
            # Decrement stock inside the same atomic block
            li["product"].stock -= li["quantity"]
            li["product"].save(update_fields=["stock"])

    return order


def get_order_by_id(order_id) -> Order:
    return Order.objects.prefetch_related("items__product").get(pk=order_id)


def list_orders_for_user(user: User) -> list[Order]:
    return list(
        Order.objects.filter(user=user)
        .prefetch_related("items__product")
        .order_by("-created_at")
    )


def list_all_orders() -> list[Order]:
    return list(
        Order.objects.all()
        .select_related("user")
        .prefetch_related("items__product")
        .order_by("-created_at")
    )


def update_order_status(order_id, status: str) -> Order:
    order = get_order_by_id(order_id)
    order.status = status
    order.save(update_fields=["status"])
    return order
