import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from apps.user.decorators import jwt_required, admin_required
from apps.user.models import Role
from apps.user.services import get_user_by_id
from . import services
from .serializers import OrderResponse
from .validators import validate_order_items, validate_order_status


def _parse_json(request):
    try:
        return json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("request body must be valid JSON")


class OrderListView(View):
    @method_decorator(jwt_required)
    def get(self, request):
        payload = request.token_payload
        if payload.get("role") == Role.ADMIN:
            orders = services.list_all_orders()
        else:
            user = get_user_by_id(payload["user_id"])
            orders = services.list_orders_for_user(user)
        return JsonResponse(
            [OrderResponse.from_model(o).to_dict() for o in orders],
            safe=False,
        )

    @method_decorator(jwt_required)
    def post(self, request):
        try:
            data = _parse_json(request)
            items = validate_order_items(data.get("items", []))
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        try:
            user = get_user_by_id(request.token_payload["user_id"])
        except Exception:
            return JsonResponse({"error": "user not found"}, status=404)

        try:
            order = services.create_order(user, items)
        except services.ProductNotFoundError as e:
            return JsonResponse({"error": str(e)}, status=404)
        except services.InsufficientStockError as e:
            return JsonResponse({"error": str(e)}, status=409)

        # Reload with related data for the response
        order = services.get_order_by_id(order.order_id)
        return JsonResponse(OrderResponse.from_model(order).to_dict(), status=201)


class OrderDetailView(View):
    @method_decorator(jwt_required)
    def get(self, request, order_id):
        payload = request.token_payload
        try:
            order = services.get_order_by_id(order_id)
        except Exception:
            return JsonResponse({"error": "order not found"}, status=404)

        # Users can only view their own orders (IDOR prevention)
        if payload.get("role") != Role.ADMIN and str(order.user_id) != payload["user_id"]:
            return JsonResponse({"error": "order not found"}, status=404)

        return JsonResponse(OrderResponse.from_model(order).to_dict())

    @method_decorator(admin_required)
    def patch(self, request, order_id):
        try:
            order = services.get_order_by_id(order_id)
        except Exception:
            return JsonResponse({"error": "order not found"}, status=404)

        try:
            data = _parse_json(request)
            status = validate_order_status(data.get("status", ""))
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        order = services.update_order_status(order_id, status)
        return JsonResponse(OrderResponse.from_model(order).to_dict())
