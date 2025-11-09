from django.shortcuts import render
from django.db import transaction
from rest_framework import viewsets, permissions, generics, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, CustomerProfile, CraftsmanProfile, Job, JobApplication, Review
from .serializers import UserSerializer, CustomerProfileSerializer, CraftsmanProfileSerializer, RegisterSerializer, JobSerializer, JobApplicationSerializer, ReviewSerializer
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
        # Get the created user
        user = User.objects.get(username=request.data.get('username'))
        # Generate or get token
        from rest_framework.authtoken.models import Token
        token, created = Token.objects.get_or_create(user=user)
        # Add token to response
        response.data['token'] = token.key
        return response

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

    # Punkt 7.2: Neue Aktion zum Anzeigen von Bewertungen
    # ===============================================
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def reviews(self, request, pk=None):
        """
        Öffentliche Aktion, um alle Bewertungen für einen Handwerker aufzulisten.
        Erreichbar unter GET /api/craftsman-profiles/{id}/reviews/
        """
        profile = self.get_object()
        # Finde alle Bewertungen, die zu Jobs gehören, die diesem Handwerker zugewiesen waren.
        reviews = Review.objects.filter(job__assigned_craftsman=profile.user)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)


class JobViewSet(viewsets.ModelViewSet):
    # ... (JobViewSet bleibt unverändert) ...
    serializer_class = JobSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.CUSTOMER: return Job.objects.filter(customer=user)
        elif user.role == User.Role.CRAFTSMAN: return Job.objects.filter(status=Job.JobStatus.OPEN)
        return Job.objects.all()
    def get_permissions(self):
        if self.action == 'create': self.permission_classes = [permissions.IsAuthenticated, IsCustomer]
        elif self.action in ['update', 'partial_update', 'destroy', 'complete', 'review']:
            self.permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        elif self.action in ['matches', 'list_applications']: self.permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        elif self.action == 'apply_for_job': self.permission_classes = [permissions.IsAuthenticated, IsCraftsman]
        else: self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)
    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        job = self.get_object()
        matching_craftsmen_profiles = CraftsmanProfile.objects.filter(trade__iexact=job.trade, service_area_zip__icontains=job.zip_code)
        matching_users = [profile.user for profile in matching_craftsmen_profiles]
        serializer = UserSerializer(matching_users, many=True)
        return Response(serializer.data)
    @action(detail=True, methods=['post'], url_path='apply')
    def apply_for_job(self, request, pk=None):
        job = self.get_object()
        if job.status != Job.JobStatus.OPEN: return Response({'error': 'This job is not open for applications.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = JobApplicationSerializer(data=request.data)
        if serializer.is_valid():
            if JobApplication.objects.filter(job=job, craftsman=request.user).exists(): return Response({'error': 'You have already applied for this job.'}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save(craftsman=request.user, job=job)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=True, methods=['get'], url_path='applications')
    def list_applications(self, request, pk=None):
        job = self.get_object()
        applications = job.applications.all()
        serializer = JobApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        job = self.get_object()
        if job.status != Job.JobStatus.IN_PROGRESS: return Response({'error': 'Only jobs that are in progress can be completed.'}, status=status.HTTP_400_BAD_REQUEST)
        job.status = Job.JobStatus.COMPLETED
        job.save()
        return Response(JobSerializer(job).data)
    @action(detail=True, methods=['post'], url_path='review')
    def create_review(self, request, pk=None):
        job = self.get_object()
        if job.status != Job.JobStatus.COMPLETED: return Response({'error': 'Only completed jobs can be reviewed.'}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(job, 'review'): return Response({'error': 'This job has already been reviewed.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(job=job)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class JobApplicationViewSet(viewsets.ReadOnlyModelViewSet):
    # ... (JobApplicationViewSet bleibt unverändert) ...
    serializer_class = JobApplicationSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.CUSTOMER: return JobApplication.objects.filter(job__customer=user)
        elif user.role == User.Role.CRAFTSMAN: return JobApplication.objects.filter(craftsman=user)
        return JobApplication.objects.none()
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        application = self.get_object()
        job = application.job
        if job.customer != request.user: return Response({'error': 'Not authorized to accept applications for this job.'}, status=status.HTTP_403_FORBIDDEN)
        if job.status != Job.JobStatus.OPEN: return Response({'error': 'This job is not open anymore.'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            application.status = JobApplication.ApplicationStatus.ACCEPTED
            application.save()
            job.status = Job.JobStatus.IN_PROGRESS
            job.assigned_craftsman = application.craftsman
            job.save()
            job.applications.exclude(pk=application.pk).update(status=JobApplication.ApplicationStatus.REJECTED)
        return Response({'status': 'Application accepted and job is now in progress.'})

class DashboardView(APIView):
    # ... (DashboardView bleibt unverändert) ...
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, *args, **kwargs):
        user = self.request.user
        data = {'user_info': UserSerializer(user).data}
        if user.role == User.Role.CUSTOMER:
            my_jobs = Job.objects.filter(customer=user)
            data['customer_dashboard'] = {'total_jobs': my_jobs.count(), 'open_jobs': my_jobs.filter(status=Job.JobStatus.OPEN).count(), 'in_progress_jobs': my_jobs.filter(status=Job.JobStatus.IN_PROGRESS).count(), 'new_applications': JobApplication.objects.filter(job__in=my_jobs, status=JobApplication.ApplicationStatus.SUBMITTED).count()}
        elif user.role == User.Role.CRAFTSMAN:
            my_applications = JobApplication.objects.filter(craftsman=user)
            try:
                trade = user.craftsman_profile.trade
                open_market_jobs = Job.objects.filter(status=Job.JobStatus.OPEN, trade__iexact=trade).count()
            except CraftsmanProfile.DoesNotExist:
                open_market_jobs = 0
            data['craftsman_dashboard'] = {'total_applications': my_applications.count(), 'accepted_applications': my_applications.filter(status=JobApplication.ApplicationStatus.ACCEPTED).count(), 'open_market_jobs': open_market_jobs}
        return Response(data)
