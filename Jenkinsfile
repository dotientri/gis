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
                    sh "docker build -t qlycv_backend:${IMAGE_TAG} ./qlycv/backend"
                    sh "docker build -t qlycv_frontend:${IMAGE_TAG} ./qlycv/frontend"
                    sh "docker save qlycv_backend:${IMAGE_TAG} > backend.tar"
                    sh "docker save qlycv_frontend:${IMAGE_TAG} > frontend.tar"
                }
            }
        }

        stage('Transfer') {
            steps {
                withCredentials([file(credentialsId: 'env-qlycv', variable: 'ENV_FILE')]) {
                    sshagent([CRED_ID]) {
                        sh '''
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "mkdir -p ${APP_DIR}/qlycv/backend/media ${APP_DIR}/qlycv/backend/static"
                            scp -o StrictHostKeyChecking=no $ENV_FILE ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/.env
                            scp -o StrictHostKeyChecking=no docker-compose.yml backup_full.sql nginx.conf ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/
                            scp -o StrictHostKeyChecking=no backend.tar frontend.tar ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "docker load < ${APP_DIR}/backend.tar && docker load < ${APP_DIR}/frontend.tar"
                        '''
                    }
                }
            }
        }

        stage('Approval') {
            steps {
                input message: "Deploy version #${IMAGE_TAG} to Production?"
            }
        }

        stage('Deploy') {
            steps {
                sshagent([CRED_ID]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "cd ${APP_DIR} && docker compose down || true"
                        ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "cd ${APP_DIR} && export IMAGE_TAG=${IMAGE_TAG} && docker compose up -d"
                        ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "docker exec qlycv_backend python manage.py migrate"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            sh 'rm -f backend.tar frontend.tar'
        }
    }
}
