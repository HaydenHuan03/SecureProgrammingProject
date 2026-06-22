import uuid
from .models import OrderStatus

_VALID_STATUSES = OrderStatus.values


def validate_order_items(value) -> list[dict]:
    if not isinstance(value, list):
        raise ValueError("items must be a list")
    if not value:
        raise ValueError("items must not be empty")
    if len(value) > 100:
        raise ValueError("order cannot contain more than 100 line items")

    seen_ids = set()
    cleaned = []
    for i, item in enumerate(value):
        if not isinstance(item, dict):
            raise ValueError(f"item at index {i} must be an object")

        raw_id = item.get("product_id")
        if not raw_id:
            raise ValueError(f"item at index {i} is missing product_id")
        try:
            product_id = uuid.UUID(str(raw_id))
        except ValueError:
            raise ValueError(f"item at index {i} has an invalid product_id")
        if product_id in seen_ids:
            raise ValueError(f"duplicate product_id at index {i}")
        seen_ids.add(product_id)

        raw_qty = item.get("quantity")
        try:
            quantity = int(raw_qty)
        except (TypeError, ValueError):
            raise ValueError(f"item at index {i} quantity must be an integer")
        if quantity < 1:
            raise ValueError(f"item at index {i} quantity must be at least 1")
        if quantity > 9999:
            raise ValueError(f"item at index {i} quantity must be at most 9999")

        cleaned.append({"product_id": product_id, "quantity": quantity})

    return cleaned


def validate_order_status(value) -> str:
    if not isinstance(value, str):
        raise ValueError("status must be a string")
    if value not in _VALID_STATUSES:
        raise ValueError(f"status must be one of {_VALID_STATUSES}")
    return value
