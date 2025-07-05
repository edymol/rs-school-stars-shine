pipeline {
    agent any
    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-credentials')
        SONAR_TOKEN = credentials('sonarqube-token')
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_HOST_URL = 'http://my-sonarqube-server-sonarqube.sonarqube:9000'
    }
    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/edymol/rs-school-stars-shine.git', branch: 'main'
            }
        }
        stage('Build Application') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        stage('Unit Tests') {
            steps {
                sh 'npm test'
            }
        }
        stage('Security Check with SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                    sonar-scanner \
                      -Dsonar.projectKey=rs-school-app \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=${SONAR_HOST_URL} \
                      -Dsonar.login=${SONAR_TOKEN}
                    '''
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        def customImage = docker.build("edydockers/rs-school-app:${env.BUILD_ID}")
                        customImage.push()
                    }
                }
            }
        }
        stage('Deploy to Kubernetes with Helm') {
            steps {
                sh '''
                mkdir -p ~/.kube
                echo "${KUBE_CONFIG}" > ~/.kube/config
                helm upgrade --install rs-school-app ./rs-school-app \
                  --set image.repository=edydockers/rs-school-app \
                  --set image.tag=${BUILD_ID} \
                  --namespace default
                '''
            }
        }
        stage('Application Verification') {
            steps {
                sh '''
                sleep 10  # Wait for deployment to settle
                curl -f http://rs-school-app.default:9898 || exit 1
                '''
            }
        }
    }
    post {
        success {
            echo 'Pipeline succeeded! Notifying...'
            mail to: 'edy@codershub.top',
                 subject: "Pipeline Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "The pipeline completed successfully. Check the app at http://rs-school-app.default:9898"
        }
        failure {
            echo 'Pipeline failed! Notifying...'
            mail to: 'edy@codershub.top',
                 subject: "Pipeline Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "The pipeline failed. Please investigate the logs."
        }
    }
}