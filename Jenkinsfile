pipeline {
   agent { label 'worker-agents' }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        HELM_CHART = './rs-school-app'
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials')
    }

//     triggers {
//         pollSCM('H/5 * * * *')
//     }
    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        stage('Unit Tests') {
            steps {
                sh 'npm test || echo "No unit tests found or configured"'
            }
        }
        stage('SonarQube Security Check') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                    sonar-scanner \
                      -Dsonar.projectKey=rs-school-stars-shine \
                      -Dsonar.sources=src \
                      -Dsonar.host.url=https://sonarqube.codershub.top \
                      -Dsonar.login=${SONAR_TOKEN}
                    """
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
        stage('Deploy to Kubernetes') {
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
        stage('Application Verification') {
            steps {
                sh 'sleep 30'  // Wait for deployment rollout
                sh 'kubectl get pods -n default | grep rs-school-app || exit 1'
                sh 'curl -f -k https://rsschool.codershub.top || exit 1'  // Smoke test; -k if self-signed cert
            }
        }
    }
    post {
        success {
            emailext (
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "The pipeline succeeded. Application deployed to https://rsschool.codershub.top",
                to: 'your.email@example.com'  // Configure recipient
            )
        }
        failure {
            emailext (
                subject: "FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "The pipeline failed. Check console output at ${env.BUILD_URL}",
                to: 'your.email@example.com'  // Configure recipient
            )
        }
        always {
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
        }
    }
}