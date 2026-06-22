import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from apps.user.decorators import jwt_required, admin_required
from . import services
from .serializers import ProductResponse
from .validators import validate_product_name, validate_description, validate_price, validate_stock


def _parse_json(request):
    try:
        return json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("request body must be valid JSON")


class ProductListView(View):
    # Any authenticated user can browse products
    @method_decorator(jwt_required)
    def get(self, request):
        products = services.list_products()
        return JsonResponse(
            [ProductResponse.from_model(p).to_dict() for p in products],
            safe=False,
        )

    # Only admins can create products
    @method_decorator(admin_required)
    def post(self, request):
        try:
            data = _parse_json(request)
            name = validate_product_name(data.get("name", ""))
            description = validate_description(data.get("description", ""))
            price = validate_price(data.get("price"))
            stock = validate_stock(data.get("stock", 0))
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        product = services.create_product(name, description, price, stock)
        return JsonResponse(ProductResponse.from_model(product).to_dict(), status=201)


class ProductDetailView(View):
    @method_decorator(jwt_required)
    def get(self, request, product_id):
        try:
            product = services.get_product_by_id(product_id)
            return JsonResponse(ProductResponse.from_model(product).to_dict())
        except Exception:
            return JsonResponse({"error": "product not found"}, status=404)

    @method_decorator(admin_required)
    def patch(self, request, product_id):
        try:
            services.get_product_by_id(product_id)
        except Exception:
            return JsonResponse({"error": "product not found"}, status=404)

        try:
            data = _parse_json(request)
            raw_name = data.get("name")
            raw_description = data.get("description")
            raw_price = data.get("price")
            raw_stock = data.get("stock")
            name = validate_product_name(raw_name) if raw_name is not None else None
            description = validate_description(raw_description) if raw_description is not None else None
            price = validate_price(raw_price) if raw_price is not None else None
            stock = validate_stock(raw_stock) if raw_stock is not None else None
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        product = services.update_product(product_id, name=name, description=description, price=price, stock=stock)
        return JsonResponse(ProductResponse.from_model(product).to_dict())

    @method_decorator(admin_required)
    def delete(self, request, product_id):
        try:
            services.get_product_by_id(product_id)
        except Exception:
            return JsonResponse({"error": "product not found"}, status=404)

        services.delete_product(product_id)
        return JsonResponse({}, status=204)
