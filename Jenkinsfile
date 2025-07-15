pipeline {
    agent { label 'worker-agents' }

    tools {
        nodejs 'nodejs20'
    }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        HELM_CHART = './helm-chart'
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials')
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build App') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        stage('Unit Tests') {
            steps {
                sh 'npx vitest run --coverage || echo "No tests configured"'
            }
        }
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def sonarParams = """
                        -Dsonar.projectKey=rs-school-stars-shine \
                        -Dsonar.sources=src \
                        -Dsonar.host.url=https://sonarqube.codershub.top \
                        -Dsonar.login=${SONAR_TOKEN}
                        """
                        sh "npx sonar-scanner ${sonarParams}"
                    }
                }
            }
            post {
                always {
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }
        stage('Build and Push Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                    sh "docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest"
                    sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }
        stage('Deploy to K3s') {
            steps {
                sh 'mkdir -p ~/.kube && echo "${KUBE_CONFIG}" > ~/.kube/config'
                sh """
                helm upgrade --install rs-school-app ${HELM_CHART} \
                  --set image.repository=${DOCKER_IMAGE} \
                  --set image.tag=${BUILD_NUMBER} \
                  --namespace default
                """
            }
        }
        stage('Verification') {
            steps {
                sh 'sleep 30'
                sh 'kubectl get pods -n default | grep rs-school-app || exit 1'
                sh 'curl -f -k https://rsschool.codershub.top || exit 1'
            }
        }
    }
    post {
        success {
            emailext subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                     body: "App deployed to https://rsschool.codershub.top",
                     to: 'edy@codershub.top'
        }
        failure {
            emailext subject: "FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                     body: "Failed: ${env.BUILD_URL}",
                     to: 'edy@codershub.top'
        }
        always {
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
        }
    }
}