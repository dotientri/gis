pipeline {
    agent any

    environment {
        CRED_ID = 'azure-vm-ssh-key-id'
        SERVER_USER = 'azureuser'
        SERVER_IP = '40.83.95.4'
        APP_DIR = '/home/azureuser/gis_data'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Build') {
            steps {
                script {
                    // Build local trên Jenkins agent
                    sh "docker build -t qlycv_backend:${IMAGE_TAG} ./qlycv/backend"
                    sh "docker build -t qlycv_frontend:${IMAGE_TAG} ./qlycv/frontend"
                    
                    // Lưu image ra file tạm để tránh lỗi pipe
                    sh "docker save qlycv_backend:${IMAGE_TAG} > backend.tar"
                    sh "docker save qlycv_frontend:${IMAGE_TAG} > frontend.tar"
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'env-qlycv', variable: 'ENV_FILE')]) {
                    sshagent([CRED_ID]) {
                        sh '''
                            # 1. Dọn dẹp server
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "docker compose -f ${APP_DIR}/docker-compose.yml down || true"
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "rm -rf ${APP_DIR} && mkdir -p ${APP_DIR}"
                            
                            # 2. Upload file
                            scp -o StrictHostKeyChecking=no $ENV_FILE ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/.env
                            scp -o StrictHostKeyChecking=no docker-compose.yml backup_full.sql nginx.conf ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/
                            
                            # 3. Upload image tar
                            scp -o StrictHostKeyChecking=no backend.tar frontend.tar ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/
                            
                            # 4. Load image trên server
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "docker load < ${APP_DIR}/backend.tar && docker load < ${APP_DIR}/frontend.tar"
                            
                            # 5. Khởi động lại
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "cd ${APP_DIR} && export IMAGE_TAG=${IMAGE_TAG} && docker compose up -d"
                            
                            # 6. Migrate
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "docker exec qlycv_backend python manage.py migrate"
                        '''
                    }
                }
            }
        }
    }
    post {
        always {
            // Xóa file tạm
            sh 'rm -f backend.tar frontend.tar'
        }
    }
}