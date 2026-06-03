pipeline {
    agent any

    environment {
        CRED_ID = 'azure-vm-ssh-key-id'
        // Thư mục chứa code/config trên Azure
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
                            # 1. Dừng và xóa container cũ sạch sẽ
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "docker compose -f ${APP_DIR}/docker-compose.yml down || true"
                            
                            # 2. Xóa sạch thư mục cũ để tái thiết lập quyền hạn
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "rm -rf ${APP_DIR}"
                            
                            # 3. Tạo lại thư mục và cấp quyền cho azureuser
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "mkdir -p ${APP_DIR}"
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "chown -R azureuser:azureuser ${APP_DIR}"
                            
                            # 4. Upload file môi trường và cấu hình mới
                            scp -o StrictHostKeyChecking=no $ENV_FILE $SERVER_IP:${APP_DIR}/.env
                            scp -o StrictHostKeyChecking=no docker-compose.yml backup_full.sql nginx.conf $SERVER_IP:${APP_DIR}/
                            
                            # 5. Đẩy image mới sang Azure
                            docker save qlycv_backend:${BUILD_NUMBER} | ssh -o StrictHostKeyChecking=no $SERVER_IP "docker load"
                            docker save qlycv_frontend:${BUILD_NUMBER} | ssh -o StrictHostKeyChecking=no $SERVER_IP "docker load"
                            
                            # 6. Khởi động lại hệ thống
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "cd ${APP_DIR} && export IMAGE_TAG=${BUILD_NUMBER} && docker compose up -d"
                            
                            # 7. Migrate database để đồng bộ cấu trúc bảng
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "docker exec qlycv_backend python manage.py migrate"
                            
                            # 8. Dọn dẹp image rác trên Azure
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "docker image prune -af"
                        '''
                    }
                }
            }
        }
    }
}   