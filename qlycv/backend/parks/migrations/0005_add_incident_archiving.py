from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('parks', '0004_alter_baocaosuco_url_hinh_anh_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='baocaosuco',
            name='is_archived',
            field=models.BooleanField(default=False, help_text='Sự cố đã được xử lý và chuyển sang lịch sử'),
        ),
        migrations.AddField(
            model_name='baocaosuco',
            name='ngay_luu_tru',
            field=models.DateTimeField(blank=True, help_text='Ngày chuyển sang lịch sử', null=True),
        ),
        migrations.AlterField(
            model_name='baocaosuco',
            name='url_hinh_anh',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddIndex(
            model_name='baocaosuco',
            index=models.Index(fields=['is_archived', 'ngay_luu_tru'], name='bao_cao_su__is_arch_b72d8f_idx'),
        ),
    ]
