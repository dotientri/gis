pipeline {
    agent any

    environment {
        CRED_ID = 'azure-vm-ssh-key-id'
        SERVER_IP = '40.83.95.4' // Định nghĩa cứng IP vào đây cho chắc cú
        APP_DIR = '/home/azureuser/gis_data'
    }

    stages {
        // ... (các stage cũ giữ nguyên)

        stage('Deploy len Azure') {
            steps {
                withCredentials([file(credentialsId: 'env-qlycv', variable: 'ENV_FILE')]) {
                    sshagent([CRED_ID]) {
                        sh '''
                            # Ép buộc ssh phải nhận đúng địa chỉ IP
                            # Dùng dấu ngoặc kép bao quanh toàn bộ lệnh trên remote server
                            ssh -o StrictHostKeyChecking=no azureuser@${SERVER_IP} "docker compose -f ${APP_DIR}/docker-compose.yml down || true"
                            
                            # Tiếp tục các bước còn lại ...
                            ssh -o StrictHostKeyChecking=no azureuser@${SERVER_IP} "rm -rf ${APP_DIR}"
                            ssh -o StrictHostKeyChecking=no azureuser@${SERVER_IP} "mkdir -p ${APP_DIR}"
                            ssh -o StrictHostKeyChecking=no azureuser@${SERVER_IP} "chown -R azureuser:azureuser ${APP_DIR}"
                            
                            scp -o StrictHostKeyChecking=no $ENV_FILE azureuser@${SERVER_IP}:${APP_DIR}/.env
                            scp -o StrictHostKeyChecking=no docker-compose.yml backup_full.sql nginx.conf azureuser@${SERVER_IP}:${APP_DIR}/
                            
                            # Lưu ý: docker save/load cũng phải dùng cú pháp ssh đúng
                            docker save qlycv_backend:${BUILD_NUMBER} | ssh -o StrictHostKeyChecking=no azureuser@${SERVER_IP} "docker load"
                            docker save qlycv_frontend:${BUILD_NUMBER} | ssh -o StrictHostKeyChecking=no azureuser@${SERVER_IP} "docker load"
                            
                            ssh -o StrictHostKeyChecking=no azureuser@${SERVER_IP} "cd ${APP_DIR} && export IMAGE_TAG=${BUILD_NUMBER} && docker compose up -d"
                            ssh -o StrictHostKeyChecking=no azureuser@${SERVER_IP} "docker exec qlycv_backend python manage.py migrate"
                            ssh -o StrictHostKeyChecking=no azureuser@${SERVER_IP} "docker image prune -af"
                        '''
                    }
                }
            }
        }
    }
}