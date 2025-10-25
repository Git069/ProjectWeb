from django.shortcuts import render
from django.db import transaction
from rest_framework import viewsets, permissions, generics, status
from rest_framework.views import APIView  # <-- NEUER IMPORT
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, CustomerProfile, CraftsmanProfile, Job, JobApplication
from .serializers import UserSerializer, CustomerProfileSerializer, CraftsmanProfileSerializer, RegisterSerializer, JobSerializer, JobApplicationSerializer
from .permissions import IsOwnerOrReadOnly, IsCustomer, IsCraftsman

# ... (bisherige Views bleiben unverändert) ...
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class CustomerProfileViewSet(viewsets.ModelViewSet):
    queryset = CustomerProfile.objects.all()
    serializer_class = CustomerProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

class CraftsmanProfileViewSet(viewsets.ModelViewSet):
    queryset = CraftsmanProfile.objects.all()
    serializer_class = CraftsmanProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.CUSTOMER: return Job.objects.filter(customer=user)
        elif user.role == User.Role.CRAFTSMAN: return Job.objects.filter(status=Job.JobStatus.OPEN)
        return Job.objects.all()
    def get_permissions(self):
        if self.action == 'create': self.permission_classes = [permissions.IsAuthenticated, IsCustomer]
        elif self.action in ['update', 'partial_update', 'destroy']: self.permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
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

class JobApplicationViewSet(viewsets.ReadOnlyModelViewSet):
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
            job.save()
            job.applications.exclude(pk=application.pk).update(status=JobApplication.ApplicationStatus.REJECTED)
        return Response({'status': 'Application accepted and job is now in progress.'})

# Punkt 4: Die Dashboard-View
# ============================
class DashboardView(APIView):
    """
    Ein dedizierter Endpunkt, der aggregierte Daten für das Benutzer-Dashboard liefert.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = self.request.user
        data = {
            'user_info': UserSerializer(user).data
        }

        if user.role == User.Role.CUSTOMER:
            my_jobs = Job.objects.filter(customer=user)
            data['customer_dashboard'] = {
                'total_jobs': my_jobs.count(),
                'open_jobs': my_jobs.filter(status=Job.JobStatus.OPEN).count(),
                'in_progress_jobs': my_jobs.filter(status=Job.JobStatus.IN_PROGRESS).count(),
                'new_applications': JobApplication.objects.filter(job__in=my_jobs, status=JobApplication.ApplicationStatus.SUBMITTED).count()
            }

        elif user.role == User.Role.CRAFTSMAN:
            my_applications = JobApplication.objects.filter(craftsman=user)
            # Für einen Handwerker sind neue, offene Jobs in seinem Gewerk interessant
            try:
                trade = user.craftsman_profile.trade
                open_market_jobs = Job.objects.filter(status=Job.JobStatus.OPEN, trade__iexact=trade).count()
            except CraftsmanProfile.DoesNotExist:
                open_market_jobs = 0

            data['craftsman_dashboard'] = {
                'total_applications': my_applications.count(),
                'accepted_applications': my_applications.filter(status=JobApplication.ApplicationStatus.ACCEPTED).count(),
                'open_market_jobs': open_market_jobs
            }
        
        return Response(data)
