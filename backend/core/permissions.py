from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsOperator(permissions.BasePermission):
    """
    Custom permission to allow operators and admins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'OPERATOR' or request.user.role == 'ADMIN'))

class IsAnalyst(permissions.BasePermission):
    """
    Custom permission to allow analysts and admins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ANALYST' or request.user.role == 'ADMIN'))
