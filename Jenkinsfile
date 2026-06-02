pipeline{
    agent any
    environment{
        CRED_ID = 'azure-vm-ssh-key-id'

    }
    stages{
        stage('Check code'){
            checkout scm
        }
        stage('Build Container'){
            sh 'docker build -t qlycv_backend:${BUILD_NUMBER} ./qlycv/backend'
            sh 'docker build -t qlycv_frontend:${BUILD_NUMBER} ./qlycv/frontend'
        }
        stage('Deploy len Azure') {
            steps {
                withCredentials([secretFile(credentialsId: 'env-qlycv', variable: 'ENV_FILE')]){
                    sshagent([CRED_ID]){
                        sh '''
                            set -a
                            . $ENV_FILE
                            set +a
                            
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "mkdir -p /opt/gis_data"
                            
                            scp -o StrictHostKeyChecking=no $ENV_FILE $SERVER_IP:/opt/gis_data/.env
                            
                            scp -o StrictHostKeyChecking=no docker-compose.yml backup_full.sql nginx.conf $SERVER_IP:/opt/gis_data/
                            
                            docker save qlycv_backend:${BUILD_NUMBER} | ssh -o StrictHostKeyChecking=no $SERVER_IP "docker load"
                            
                            docker save qlycv_frontend:${BUILD_NUMBER} | ssh -o StrictHostKeyChecking=no $SERVER_IP "docker load"
                            
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "cd /opt/gis_data && docker compose down -v || true"
                            
                            ssh -o StrictHostKeyChecking=no $SERVER_IP "cd /opt/gis_data && export IMAGE_TAG=${BUILD_NUMBER} && docker compose up -d"

                        '''
                    }
                }
                }
            }
        }
    }
    