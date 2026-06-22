from dataclasses import dataclass, field
from .models import Order, OrderItem


@dataclass
class OrderItemResponse:
    product_id: str
    product_name: str
    quantity: int
    unit_price: str
    subtotal: str

    @classmethod
    def from_model(cls, item: OrderItem) -> "OrderItemResponse":
        subtotal = item.unit_price * item.quantity
        return cls(
            product_id=str(item.product.product_id),
            product_name=item.product.name,
            quantity=item.quantity,
            unit_price=str(item.unit_price),
            subtotal=str(subtotal),
        )

    def to_dict(self) -> dict:
        return {
            "product_id": self.product_id,
            "product_name": self.product_name,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "subtotal": self.subtotal,
        }


@dataclass
class OrderResponse:
    order_id: str
    user_id: str
    status: str
    total_price: str
    created_at: str
    items: list = field(default_factory=list)

    @classmethod
    def from_model(cls, order: Order) -> "OrderResponse":
        return cls(
            order_id=str(order.order_id),
            user_id=str(order.user_id),
            status=order.status,
            total_price=str(order.total_price),
            created_at=order.created_at.isoformat(),
            items=[OrderItemResponse.from_model(i).to_dict() for i in order.items.all()],
        )

    def to_dict(self) -> dict:
        return {
            "order_id": self.order_id,
            "user_id": self.user_id,
            "status": self.status,
            "total_price": self.total_price,
            "created_at": self.created_at,
            "items": self.items,
        }
