# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'customer-profiles', views.CustomerProfileViewSet, basename='customerprofile')
router.register(r'craftsman-profiles', views.CraftsmanProfileViewSet, basename='craftsmanprofile')
router.register(r'jobs', views.JobViewSet, basename='job')
router.register(r'applications', views.JobApplicationViewSet, basename='application')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', obtain_auth_token, name='api_login'),
    path('register/', views.RegisterView.as_view(), name='api_register'),
    # HIER HINZUGEFÜGT:
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]