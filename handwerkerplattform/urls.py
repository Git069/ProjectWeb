from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Zurückgesetzt auf eine einfache, stabile Konfiguration
schema_view = get_schema_view(
   openapi.Info(
      title="Handwerkerplattform API",
      default_version='v1',
      description="API-Dokumentation.",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # URLs für die API-Dokumentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # Haupt-API-Pfade
    path("api/", include("core.urls")), 
]
