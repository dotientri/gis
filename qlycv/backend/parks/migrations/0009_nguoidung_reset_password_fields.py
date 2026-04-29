from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parks', '0008_baocaosuco_dia_chi'),
    ]

    operations = [
        migrations.AddField(
            model_name='nguoidung',
            name='reset_password_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='nguoidung',
            name='reset_password_token',
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
    ]
