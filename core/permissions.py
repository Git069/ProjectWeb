from rest_framework import permissions
from .models import User

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Erlaubt Lesezugriff für jeden, aber Schreibzugriff nur für den Eigentümer.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Bei Profilen ist der Eigentümer `obj.user`
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # Bei Jobs ist der Eigentümer `obj.customer`
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        return False

class IsCustomer(permissions.BasePermission):
    """
    Prüft, ob der anfragende Benutzer die Rolle 'CUSTOMER' hat.
    """
    def has_permission(self, request, view):
        return request.user and request.user.role == User.Role.CUSTOMER

class IsCraftsman(permissions.BasePermission):
    """
    Prüft, ob der anfragende Benutzer die Rolle 'CRAFTSMAN' hat.
    """
    def has_permission(self, request, view):
        return request.user and request.user.role == User.Role.CRAFTSMAN
