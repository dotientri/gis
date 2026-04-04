from django.test import TestCase
from django.conf import settings


class BasicProjectTests(TestCase):
    def test_parks_app_installed(self):
        self.assertIn('parks', settings.INSTALLED_APPS)
