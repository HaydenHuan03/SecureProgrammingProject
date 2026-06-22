from dataclasses import dataclass
from .models import Product


@dataclass
class ProductResponse:
    product_id: str
    name: str
    description: str
    price: str
    stock: int
    created_at: str

    @classmethod
    def from_model(cls, product: Product) -> "ProductResponse":
        return cls(
            product_id=str(product.product_id),
            name=product.name,
            description=product.description,
            price=str(product.price),
            stock=product.stock,
            created_at=product.created_at.isoformat(),
        )

    def to_dict(self) -> dict:
        return {
            "product_id": self.product_id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "stock": self.stock,
            "created_at": self.created_at,
        }
