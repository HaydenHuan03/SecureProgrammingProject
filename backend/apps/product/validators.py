import re
from decimal import Decimal, InvalidOperation

_NAME_MAX = 255
_DESCRIPTION_MAX = 2000
_PRICE_MAX = Decimal("999999.99")


def validate_product_name(value) -> str:
    if not isinstance(value, str):
        raise ValueError("name must be a string")
    value = value.strip()
    if not value:
        raise ValueError("name must not be empty")
    if len(value) > _NAME_MAX:
        raise ValueError(f"name must be at most {_NAME_MAX} characters")
    return value


def validate_description(value) -> str:
    if not isinstance(value, str):
        raise ValueError("description must be a string")
    if len(value) > _DESCRIPTION_MAX:
        raise ValueError(f"description must be at most {_DESCRIPTION_MAX} characters")
    return value


def validate_price(value) -> Decimal:
    try:
        price = Decimal(str(value))
    except (InvalidOperation, TypeError):
        raise ValueError("price must be a valid number")
    if price <= 0:
        raise ValueError("price must be greater than zero")
    if price > _PRICE_MAX:
        raise ValueError(f"price must be at most {_PRICE_MAX}")
    if price != price.quantize(Decimal("0.01")):
        raise ValueError("price must have at most 2 decimal places")
    return price


def validate_stock(value) -> int:
    try:
        stock = int(value)
    except (TypeError, ValueError):
        raise ValueError("stock must be an integer")
    if stock < 0:
        raise ValueError("stock must be zero or greater")
    return stock
