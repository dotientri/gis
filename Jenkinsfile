pipeline {
    agent any

    environment {
        CRED_ID = 'azure-vm-ssh-key-id'
        // Thư mục chứa code/config
        APP_DIR = '/home/azureuser/gis_data'
    }

    stages {
        stage('Check code') {
            steps {
                checkout scm
            }
        }

        stage('Build Container') {
            steps {
                sh 'docker build -t qlycv_backend:${BUILD_NUMBER} ./qlycv/backend'
                sh 'docker build -t qlycv_frontend:${BUILD_NUMBER} ./qlycv/frontend'
            }
        }

        stage('Deploy len Azure') {
            steps {
                withCredentials([file(credentialsId: 'env-qlycv', variable: 'ENV_FILE')]) {
                    sshagent([CRED_ID]) {
                        sh '''
                            # 1. Dọn dẹp sạch sành sanh container và image cũ trên Azure
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "docker compose -f ${APP_DIR}/docker-compose.yml down || true"
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "docker container prune -f"
                            
                            # 2. Xóa sạch thư mục cũ để xóa bỏ mọi quyền sở hữu cũ (root/docker)
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "rm -rf ${APP_DIR}"
                            
                            # 3. Tạo lại thư mục và phân quyền từ đầu cho azureuser
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "mkdir -p ${APP_DIR}"
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "chown -R azureuser:azureuser ${APP_DIR}"
                            
                            # 4. Upload lại toàn bộ file sạch
                            scp -o StrictHostKeyChecking=no $ENV_FILE $SERVER_IP:${APP_DIR}/.env
                            scp -o StrictHostKeyChecking=no docker-compose.yml backup_full.sql nginx.conf $SERVER_IP:${APP_DIR}/
                            
                            # 5. Load image mới
                            docker save qlycv_backend:${BUILD_NUMBER} | ssh -o StrictHostKeyChecking=no $SERVER_IP "docker load"
                            docker save qlycv_frontend:${BUILD_NUMBER} | ssh -o StrictHostKeyChecking=no $SERVER_IP "docker load"
                            
                            # 6. Khởi động lại hệ thống
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "cd ${APP_DIR} && export IMAGE_TAG=${BUILD_NUMBER} && docker compose up -d"
                            
                            # 7. Migrate sau khi đã khởi động xong backend
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "docker exec qlycv_backend python manage.py migrate"
                            
                            # 8. Dọn dẹp rác image để nhẹ máy
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "docker image prune -af"
                        '''
                    }
                }
            }
        }
    }
}