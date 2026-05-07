
from django.core.management.base import BaseCommand
from parks.models import NguoiDung
import hashlib

def hash_password(password):
    """Hash password using SHA256 to match auth_views.py"""
    return hashlib.sha256(password.encode()).hexdigest()

class Command(BaseCommand):
    help = 'Displays usernames and their password hashes from the database.'

    def handle(self, *args, **options):
        self.stdout.write("--- User Hashes from Database ---")
        users = NguoiDung.objects.all()
        if not users:
            self.stdout.write("No users found in the database.")
            return

        for user in users:
            self.stdout.write(f"User: '{user.ten_dang_nhap}' (Email: {user.email})")
            self.stdout.write(f"  DB Hash: {user.mat_khau_hash}")
        
        self.stdout.write("\n--- Locally Generated Hashes for Comparison ---")
        self.stdout.write(f"Hash for 'admin123': {hash_password('admin123')}")
        self.stdout.write(f"Hash for 'user123':  {hash_password('user123')}")
        
        self.stdout.write("\n" + self.style.SUCCESS("Finished."))

