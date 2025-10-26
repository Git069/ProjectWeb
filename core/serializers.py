from rest_framework import serializers
from django.db.models import Avg
from .models import User, CustomerProfile, CraftsmanProfile, Job, JobApplication, Review

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name', 'role')
        extra_kwargs = {'password': {'write_only': True}}

    def validate_role(self, value):
        if value not in User.Role.values:
            raise serializers.ValidationError(f"'{value}' is not a valid role. Valid options are: {User.Role.values}")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        if user.role == User.Role.CUSTOMER:
            CustomerProfile.objects.create(user=user)
        elif user.role == User.Role.CRAFTSMAN:
            CraftsmanProfile.objects.create(user=user)
        return user

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = '__all__'
        read_only_fields = ('user',)

class ReviewSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='job.customer.username', read_only=True)
    craftsman_username = serializers.CharField(source='job.assigned_craftsman.username', read_only=True)
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ('job',)

class CraftsmanProfileSerializer(serializers.ModelSerializer):
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    class Meta:
        model = CraftsmanProfile
        fields = ['user', 'company_name', 'trade', 'service_area_zip', 'is_verified', 'avg_rating', 'review_count']
        read_only_fields = ('user',)

    def get_avg_rating(self, obj):
        # HIER DIE OPTIMIERUNG: Wir verwenden prefetch_related, um die Abfragen zu reduzieren.
        # In diesem speziellen Fall ist die Auswirkung gering, aber es ist eine gute Praxis.
        avg = Review.objects.filter(job__assigned_craftsman=obj.user).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 2) if avg else None

    def get_review_count(self, obj):
        return Review.objects.filter(job__assigned_craftsman=obj.user).count()

class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)
    craftsman_profile = CraftsmanProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'customer_profile', 'craftsman_profile']

class JobSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    assigned_craftsman_username = serializers.CharField(source='assigned_craftsman.username', read_only=True, allow_null=True)
    review = ReviewSerializer(read_only=True)
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('customer', 'assigned_craftsman')

class JobApplicationSerializer(serializers.ModelSerializer):
    craftsman_username = serializers.CharField(source='craftsman.username', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ('craftsman', 'status', 'job')
