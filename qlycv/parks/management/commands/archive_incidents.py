from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from parks.models import BaoCaoSuCo


class Command(BaseCommand):
    help = 'Auto-archive handled incidents and delete archived incidents older than 30 days'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to keep archived incidents (default: 30)'
        )

    def handle(self, *args, **options):
        days = options['days']
        now = timezone.now()
        
        # Step 1: Archive incidents with status 'da_xu_ly' that are not yet archived
        archived_count = 0
        incidents_to_archive = BaoCaoSuCo.objects.filter(
            trang_thai='da_xu_ly',
            is_archived=False
        )
        
        for incident in incidents_to_archive:
            incident.is_archived = True
            incident.ngay_luu_tru = now
            incident.save()
            archived_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Archived {archived_count} handled incidents')
        )
        
        # Step 2: Delete archived incidents older than X days
        cutoff_date = now - timedelta(days=days)
        deleted_count, _ = BaoCaoSuCo.objects.filter(
            is_archived=True,
            ngay_luu_tru__lt=cutoff_date
        ).delete()
        
        self.stdout.write(
            self.style.SUCCESS(f'🗑️  Deleted {deleted_count} old archived incidents (older than {days} days)')
        )
        
        # Step 3: Show statistics
        current_archived = BaoCaoSuCo.objects.filter(is_archived=True).count()
        current_active = BaoCaoSuCo.objects.filter(is_archived=False).count()
        
        self.stdout.write(
            self.style.SUCCESS(f'\n📊 Current status:\n'
                              f'  📍 Active incidents: {current_active}\n'
                              f'  📦 Archived incidents: {current_archived}')
        )
