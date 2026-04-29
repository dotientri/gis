from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('parks', '0009_nguoidung_reset_password_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='YeuCauLienHe',
            fields=[
                ('ma_yeu_cau', models.AutoField(primary_key=True, serialize=False)),
                ('ho_ten', models.CharField(max_length=150)),
                ('email', models.EmailField(max_length=254)),
                ('so_dien_thoai', models.CharField(blank=True, max_length=20, null=True)),
                ('tieu_de', models.CharField(max_length=200)),
                ('noi_dung', models.TextField()),
                ('nguon_truy_cap', models.CharField(blank=True, max_length=100, null=True)),
                ('email_nhan', models.EmailField(max_length=254)),
                ('da_xu_ly', models.BooleanField(default=False)),
                ('ngay_tao', models.DateTimeField(auto_now_add=True)),
                ('ma_nguoi_dung', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='yeu_cau_lien_he', to='parks.nguoidung')),
            ],
            options={
                'db_table': 'yeu_cau_lien_he',
                'ordering': ['-ngay_tao'],
            },
        ),
        migrations.AddIndex(
            model_name='yeucaulienhe',
            index=models.Index(fields=['da_xu_ly', 'ngay_tao'], name='yeu_cau_li_da_xu__cf73d3_idx'),
        ),
        migrations.AddIndex(
            model_name='yeucaulienhe',
            index=models.Index(fields=['email'], name='yeu_cau_li_email_bf6574_idx'),
        ),
    ]
