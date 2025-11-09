# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import views_chat
from . import views_notification

# Zurück zum einfachen DefaultRouter ohne externe Abhängigkeiten
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'customer-profiles', views.CustomerProfileViewSet, basename='customerprofile')
router.register(r'craftsman-profiles', views.CraftsmanProfileViewSet, basename='craftsmanprofile')
router.register(r'offers', views.OfferViewSet, basename='offer')
router.register(r'inquiries', views.InquiryViewSet, basename='inquiry')
router.register(r'reviews', views.ReviewViewSet, basename='review')
router.register(r'chat-rooms', views_chat.ChatRoomViewSet, basename='chatroom')
router.register(r'messages', views_chat.MessageViewSet, basename='message')
router.register(r'notifications', views_notification.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.LoginView.as_view(), name='api_login'),
    path('logout/', views.LogoutView.as_view(), name='api_logout'),
    path('register/', views.RegisterView.as_view(), name='api_register'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]
