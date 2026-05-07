import os
import subprocess
from datetime import datetime
from pathlib import Path

def backup_postgres():
    # Cấu hình từ file .env hoặc hardcode dựa trên context của bạn
    DB_NAME = "gis_database"
    DB_USER = "admin"
    DB_PASS = "YourPassword123"
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"backup_{timestamp}.sql"
    
    print(f"Starting backup for {DB_NAME}...")
    
    # Thiết lập biến môi trường mật khẩu để pg_dump không hỏi pass
    os.environ['PGPASSWORD'] = DB_PASS
    
    cmd = f"pg_dump -U {DB_USER} -h localhost {DB_NAME} > {backup_file}"
    subprocess.run(cmd, shell=True)
    print(f"Backup completed: {backup_file}")

if __name__ == "__main__":
    backup_postgres()