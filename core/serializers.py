from rest_framework import serializers
from .models import User, CustomerProfile, CraftsmanProfile, Job, JobApplication

# ... (andere Serializer bleiben unverändert) ...
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name', 'role')
        extra_kwargs = {'password': {'write_only': True}}
    def create(self, validated_data):
        user = User.objects.create_user(username=validated_data['username'], password=validated_data['password'], email=validated_data['email'], first_name=validated_data['first_name'], last_name=validated_data['last_name'], role=validated_data['role'])
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

class CraftsmanProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CraftsmanProfile
        fields = '__all__'
        read_only_fields = ('user',)

class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)
    craftsman_profile = CraftsmanProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'customer_profile', 'craftsman_profile']

class JobSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('customer',)


# KORRIGIERTER JobApplicationSerializer
# ====================================
class JobApplicationSerializer(serializers.ModelSerializer):
    craftsman_username = serializers.CharField(source='craftsman.username', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = JobApplication
        fields = '__all__'
        # HIER DIE KORREKTUR: 'job' wird jetzt auch von der View gesetzt, nicht vom Client.
        read_only_fields = ('craftsman', 'status', 'job')
