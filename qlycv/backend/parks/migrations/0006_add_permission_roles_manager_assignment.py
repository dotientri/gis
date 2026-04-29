from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('parks', '0005_add_incident_archiving'),
    ]

    operations = [
        # Update NhomQuyen choices to add KHACH and QUAN_LY
        migrations.AlterField(
            model_name='nhomquyen',
            name='ten_nhom',
            field=models.CharField(
                choices=[
                    ('KHACH', 'Khách'),
                    ('CONG_DONG', 'Người dùng cộng đồng'),
                    ('QUAN_LY', 'Quản lý công viên'),
                    ('QUAN_TRI', 'Quản trị viên'),
                ],
                max_length=100,
                unique=True
            ),
        ),
        
        # Add ma_cong_vien to NguoiDung
        migrations.AddField(
            model_name='nguoidung',
            name='ma_cong_vien',
            field=models.ForeignKey(
                blank=True,
                help_text='Công viên được quản lý (chỉ dùng cho Manager)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='quan_ly_cong_vien',
                to='parks.congvien'
            ),
        ),
    ]
