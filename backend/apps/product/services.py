from decimal import Decimal
from .models import Product


def create_product(name: str, description: str, price: Decimal, stock: int) -> Product:
    product = Product(name=name, description=description, price=price, stock=stock)
    product.save()
    return product


def get_product_by_id(product_id) -> Product:
    return Product.objects.get(pk=product_id)


def list_products() -> list[Product]:
    return list(Product.objects.all().order_by("created_at"))


def update_product(
    product_id,
    name: str = None,
    description: str = None,
    price: Decimal = None,
    stock: int = None,
) -> Product:
    product = get_product_by_id(product_id)
    if name is not None:
        product.name = name
    if description is not None:
        product.description = description
    if price is not None:
        product.price = price
    if stock is not None:
        product.stock = stock
    product.save()
    return product


def delete_product(product_id) -> None:
    Product.objects.filter(pk=product_id).delete()
