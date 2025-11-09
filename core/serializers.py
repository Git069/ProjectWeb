from rest_framework import serializers
from django.db.models import Avg
from django.contrib.auth import authenticate
from .models import User, CustomerProfile, CraftsmanProfile, Offer, Inquiry, Review

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'password', 'email', 'first_name', 'last_name')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Force role to CUSTOMER and create CustomerProfile
        user = User.objects.create_user(
            email=validated_data.get('email'),
            password=validated_data.get('password'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=User.Role.CUSTOMER,
        )
        CustomerProfile.objects.create(user=user)
        return user

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = '__all__'
        read_only_fields = ('user',)

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ('offer',)

class CraftsmanProfileSerializer(serializers.ModelSerializer):
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    class Meta:
        model = CraftsmanProfile
        fields = ['user', 'company_name', 'trade', 'service_area_zip', 'is_verified', 'avg_rating', 'review_count']
        read_only_fields = ('user',)

    def get_avg_rating(self, obj):
        avg = Review.objects.filter(offer__craftsman=obj.user).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 2) if avg else None

    def get_review_count(self, obj):
        return Review.objects.filter(offer__craftsman=obj.user).count()

class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)
    craftsman_profile = CraftsmanProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'customer_profile', 'craftsman_profile']

class OfferSerializer(serializers.ModelSerializer):
    craftsman_email = serializers.CharField(source='craftsman.email', read_only=True)
    review = ReviewSerializer(read_only=True)
    class Meta:
        model = Offer
        fields = '__all__'
        read_only_fields = ('craftsman',)

class InquirySerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    offer_title = serializers.CharField(source='offer.title', read_only=True)
    class Meta:
        model = Inquiry
        fields = '__all__'
        read_only_fields = ('customer', 'status', 'offer')
