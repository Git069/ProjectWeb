from django.shortcuts import render
from django.db import transaction
from rest_framework import viewsets, permissions, generics, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .models import User, CustomerProfile, CraftsmanProfile, Offer, Inquiry, Review
from .serializers import UserSerializer, CustomerProfileSerializer, CraftsmanProfileSerializer, RegisterSerializer, OfferSerializer, InquirySerializer, ReviewSerializer
from .permissions import IsOwnerOrReadOnly, IsCustomer, IsCraftsman

from django.shortcuts import render
from django.template.loader import render_to_string
from django.http import JsonResponse, HttpRequest

# Die Haupt-View, die die Basis-Seite lädt
def main_view(request: HttpRequest):
    # Lade das Grundgerüst mit Header, Navigationsleiste etc.
    return render(request, 'main_base.html', {})

# Die View, die nur den Inhalt für die "Homepage" liefert
def homepage_content_view(request: HttpRequest):
    # Prüfen, ob es ein AJAX-Request ist
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # AJAX-Anfrage: Rendere nur das kleine Inhalts-Snippet
        context = {'data_for_homepage': 'Hier sind die neuen Inhalte'}
        
        # render_to_string rendert das Template als String, nicht als HttpResponse
        html_snippet = render_to_string('snippets/homepage_content.html', context, request=request)
        
        # Sende den HTML-Inhalt als JSON-Antwort zurück
        return JsonResponse({'html': html_snippet, 'title': 'Homepage'})
    
    # Optional: Wenn die View doch direkt aufgerufen wird, leite zur Hauptseite weiter oder behandle es als vollen Request
    return render(request, 'homepage.html', {}) # Oder redirect('main_view')

# ... (RegisterView, UserViewSet, CustomerProfileViewSet bleiben unverändert) ...
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        # Get the created user via email (USERNAME_FIELD)
        user = User.objects.get(email=request.data.get('email'))
        # Generate or get token
        token, created = Token.objects.get_or_create(user=user)
        # Add token to response
        response.data['token'] = token.key
        return response

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'error': 'Email und Passwort sind erforderlich.'}, status=status.HTTP_400_BAD_REQUEST)
        # Django auth expects 'username' kwarg matching USERNAME_FIELD
        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'error': 'Ungültige Anmeldedaten.'}, status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Logout by deleting the user's auth token.
        Accessible at POST /api/logout/
        """
        try:
            request.user.auth_token.delete()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Review.objects.all()
        craftsman_id = self.request.query_params.get('craftsman_id')
        if craftsman_id:
            queryset = queryset.filter(offer__craftsman_id=craftsman_id)
        return queryset

    def create(self, request, *args, **kwargs):
        offer_id = request.data.get('offer') or request.data.get('offer_id')
        if not offer_id:
            return Response({'error': 'offer (offer_id) ist erforderlich.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            offer = Offer.objects.get(pk=offer_id)
        except Offer.DoesNotExist:
            return Response({'error': 'Angebot nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)
        if offer.status != Offer.JobStatus.COMPLETED:
            return Response({'error': 'Nur abgeschlossene Angebote können bewertet werden.'}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(offer, 'review'):
            return Response({'error': 'Für dieses Angebot existiert bereits eine Bewertung.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(offer=offer)
        return Response(self.get_serializer(review).data, status=status.HTTP_201_CREATED)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """
        Returns the current authenticated user.
        Accessible at GET /api/users/me/
        """
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
        """
        Erstellt ein CraftsmanProfile für den angemeldeten Benutzer und setzt die Rolle auf CRAFTSMAN.
        Erwartet Felder wie company_name, trade, service_area_zip in request.data.
        """
        user = request.user
        if user.role == User.Role.CRAFTSMAN:
            return Response({'detail': 'Benutzer ist bereits Handwerker.'}, status=status.HTTP_400_BAD_REQUEST)
        data = {
            'company_name': request.data.get('company_name', ''),
            'trade': request.data.get('trade', ''),
            'service_area_zip': request.data.get('service_area_zip', ''),
        }
        # Falls bereits Profil existiert (sollte nicht), aktualisieren
        profile, created = CraftsmanProfile.objects.get_or_create(user=user, defaults=data)
        if not created:
            for k, v in data.items():
                setattr(profile, k, v)
            profile.save()
        user.role = User.Role.CRAFTSMAN
        user.save()
        return Response(CraftsmanProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class OfferViewSet(viewsets.ModelViewSet):
    serializer_class = OfferSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.CUSTOMER:
            return Offer.objects.filter(status=Offer.JobStatus.OPEN)
        elif user.role == User.Role.CRAFTSMAN:
            return Offer.objects.filter(craftsman=user)
        return Offer.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.IsAuthenticated, IsCraftsman]
        elif self.action in ['update', 'partial_update', 'destroy', 'complete']:
            self.permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(craftsman=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        offer = self.get_object()
        if offer.craftsman != request.user:
            return Response({'error': 'Nur der Besitzer kann das Angebot abschließen.'}, status=status.HTTP_403_FORBIDDEN)
        if offer.status != Offer.JobStatus.IN_PROGRESS:
            return Response({'error': 'Nur Angebote, die in Arbeit sind, können abgeschlossen werden.'}, status=status.HTTP_400_BAD_REQUEST)
        offer.status = Offer.JobStatus.COMPLETED
        offer.save()
        return Response(OfferSerializer(offer).data)

class InquiryViewSet(viewsets.ModelViewSet):
    serializer_class = InquirySerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.CUSTOMER:
            return Inquiry.objects.filter(customer=user)
        elif user.role == User.Role.CRAFTSMAN:
            return Inquiry.objects.filter(offer__craftsman=user)
        return Inquiry.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.IsAuthenticated, IsCustomer]
        elif self.action in ['update', 'partial_update', 'destroy', 'accept']:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        offer_id = request.data.get('offer') or request.data.get('offer_id')
        cover_letter = request.data.get('cover_letter', '')
        if not offer_id:
            return Response({'error': 'offer (offer_id) ist erforderlich.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            offer = Offer.objects.get(pk=offer_id)
        except Offer.DoesNotExist:
            return Response({'error': 'Angebot nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)
        if offer.status != Offer.JobStatus.OPEN:
            return Response({'error': 'Für dieses Angebot können keine Anfragen mehr gestellt werden.'}, status=status.HTTP_400_BAD_REQUEST)
        if Inquiry.objects.filter(offer=offer, customer=request.user).exists():
            return Response({'error': 'Du hast bereits eine Anfrage für dieses Angebot gestellt.'}, status=status.HTTP_400_BAD_REQUEST)
        inquiry = Inquiry.objects.create(offer=offer, customer=request.user, cover_letter=cover_letter)
        return Response(self.get_serializer(inquiry).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        inquiry = self.get_object()
        offer = inquiry.offer
        if offer.craftsman != request.user:
            return Response({'error': 'Nur der Handwerker des Angebots darf Anfragen annehmen.'}, status=status.HTTP_403_FORBIDDEN)
        if offer.status != Offer.JobStatus.OPEN:
            return Response({'error': 'Dieses Angebot ist nicht mehr offen.'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            inquiry.status = Inquiry.ApplicationStatus.ACCEPTED
            inquiry.save()
            offer.status = Offer.JobStatus.IN_PROGRESS
            offer.save()
            # übrige Anfragen ablehnen
            offer.inquiries.exclude(pk=inquiry.pk).update(status=Inquiry.ApplicationStatus.REJECTED)
        return Response({'status': 'Anfrage akzeptiert. Angebot ist nun in Arbeit.'})

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = self.request.user
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
