from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User, Offer, CraftsmanProfile

class MatchingAlgorithmTest(APITestCase):
    """
    Test-Suite für den Matching-Algorithmus in der `matches`-Aktion des OfferViewSet.
    """

    def setUp(self):
        """
        Diese Methode wird vor jedem einzelnen Test ausgeführt.
        Sie erstellt eine saubere Test-Datenbank mit allen notwendigen Objekten.
        """
        self.customer = User.objects.create_user(username='testcustomer', password='testpass123', role=User.Role.CUSTOMER)
        self.job = Offer.objects.create(
            customer=self.customer, 
            title='Heizung reparieren', 
            trade='Sanitär', 
            zip_code='10115'
        )
        self.matching_craftsman_user = User.objects.create_user(username='perfectmatch', password='testpass123', role=User.Role.CRAFTSMAN)
        CraftsmanProfile.objects.create(
            user=self.matching_craftsman_user, 
            trade='Sanitär', 
            service_area_zip='10115, 10117, 10178'
        )
        self.wrong_trade_craftsman_user = User.objects.create_user(username='wrongtrade', password='testpass123', role=User.Role.CRAFTSMAN)
        CraftsmanProfile.objects.create(
            user=self.wrong_trade_craftsman_user, 
            trade='Elektriker', 
            service_area_zip='10115'
        )
        self.wrong_zip_craftsman_user = User.objects.create_user(username='wrongzip', password='testpass123', role=User.Role.CRAFTSMAN)
        CraftsmanProfile.objects.create(
            user=self.wrong_zip_craftsman_user, 
            trade='Sanitär', 
            service_area_zip='80331, 80333'
        )

    def test_matching_algorithm_finds_correct_craftsman(self):
        """
        Der eigentliche Testfall.
        """
        # HIER DIE ANPASSUNG: Wir bauen die URL manuell zusammen.
        url = f'/api/jobs/{self.job.pk}/matches/'

        self.client.force_authenticate(user=self.customer)
        response = self.client.get(url)

        # --- Überprüfungen (Assertions) ---
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
        
        found_craftsman = response.data[0]
        self.assertEqual(found_craftsman['username'], self.matching_craftsman_user.username)

        print("\nTest für Matching-Algorithmus erfolgreich abgeschlossen.")
