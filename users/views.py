from django.db import transaction
from rest_framework import viewsets, permissions, generics, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

from .models import User, CustomerProfile, CraftsmanProfile
from .serializers import (
    UserSerializer,
    CustomerProfileSerializer,
    CraftsmanProfileSerializer,
    RegisterSerializer,
)
from .permissions import IsOwnerOrReadOnly, IsCustomer, IsCraftsman


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(email=request.data.get('email'))
        token, created = Token.objects.get_or_create(user=user)
        response.data['token'] = token.key
        return response


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'error': 'Email und Passwort sind erforderlich.'}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'error': 'Ungültige Anmeldedaten.'}, status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class CustomerProfileViewSet(viewsets.ModelViewSet):
    queryset = CustomerProfile.objects.all()
    serializer_class = CustomerProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class CraftsmanProfileViewSet(viewsets.ModelViewSet):
    queryset = CraftsmanProfile.objects.all()
    serializer_class = CraftsmanProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upgrade_to_craftsman(self, request):
        user = request.user
        if user.role == User.Role.CRAFTSMAN:
            return Response({'detail': 'Benutzer ist bereits Handwerker.'}, status=status.HTTP_400_BAD_REQUEST)
        data = {
            'company_name': request.data.get('company_name', ''),
            'trade': request.data.get('trade', ''),
            'service_area_zip': request.data.get('service_area_zip', ''),
        }
        profile, created = CraftsmanProfile.objects.get_or_create(user=user, defaults=data)
        if not created:
            for k, v in data.items():
                setattr(profile, k, v)
            profile.save()
        user.role = User.Role.CRAFTSMAN
        user.save()
        return Response(CraftsmanProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Dynamische Importe, um zirkuläre Abhängigkeiten zu vermeiden
        from jobs.models import Offer, Inquiry
        user = request.user
        data = {'user_info': UserSerializer(user).data}
        if user.role == User.Role.CUSTOMER:
            my_inquiries = Inquiry.objects.filter(customer=user)
            data['customer_dashboard'] = {
                'total_inquiries': my_inquiries.count(),
                'submitted_inquiries': my_inquiries.filter(status=Inquiry.ApplicationStatus.SUBMITTED).count(),
                'accepted_inquiries': my_inquiries.filter(status=Inquiry.ApplicationStatus.ACCEPTED).count(),
                'rejected_inquiries': my_inquiries.filter(status=Inquiry.ApplicationStatus.REJECTED).count(),
            }
        elif user.role == User.Role.CRAFTSMAN:
            my_offers = Offer.objects.filter(craftsman=user)
            new_inquiries = Inquiry.objects.filter(offer__in=my_offers, status=Inquiry.ApplicationStatus.SUBMITTED).count()
            data['craftsman_dashboard'] = {
                'total_offers': my_offers.count(),
                'open_offers': my_offers.filter(status=Offer.JobStatus.OPEN).count(),
                'in_progress_offers': my_offers.filter(status=Offer.JobStatus.IN_PROGRESS).count(),
                'completed_offers': my_offers.filter(status=Offer.JobStatus.COMPLETED).count(),
                'new_inquiries': new_inquiries,
            }
        return Response(data)
