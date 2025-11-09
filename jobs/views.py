from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Offer, Inquiry, Review
from .serializers import OfferSerializer, InquirySerializer, ReviewSerializer
from users.permissions import IsOwnerOrReadOnly, IsCustomer, IsCraftsman


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


class OfferViewSet(viewsets.ModelViewSet):
    serializer_class = OfferSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Offer.objects.none()
        from users.models import User
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
        if not user.is_authenticated:
            return Inquiry.objects.none()
        from users.models import User
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
            offer.inquiries.exclude(pk=inquiry.pk).update(status=Inquiry.ApplicationStatus.REJECTED)
        return Response({'status': 'Anfrage akzeptiert. Angebot ist nun in Arbeit.'})
