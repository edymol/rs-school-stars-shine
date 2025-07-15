pipeline {
    agent { label 'worker-node-01' }

    environment {
        DOCKER_IMAGE = "edydockers/rs-school-app"
        SONARQUBE_ENV = "SonarQube"
        SONAR_PROJECT_KEY = "rs-school-stars-shine"
        SONAR_ORGANIZATION = "your-org" // Optional
    }

    tools {
        nodejs "NodeJS 22"
    }

    options {
        skipDefaultCheckout(true)
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci || npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Unit Tests') {
            steps {
                script {
                    def hasTestScript = sh(
                        script: "jq -e '.scripts.test' package.json > /dev/null 2>&1",
                        returnStatus: true
                    ) == 0

                    if (hasTestScript) {
                        sh 'npm test'
                    } else {
                        echo 'No unit tests found or configured'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            environment {
                SONAR_TOKEN = credentials('SONAR_TOKEN')
            }
            steps {
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    sh '''
                        npx sonar-scanner \
                          -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=$SONAR_HOST_URL \
                          -Dsonar.login=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage("Wait for SonarQube Quality Gate") {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build and Push Docker Image') {
            environment {
                DOCKERHUB_CREDENTIALS = credentials('DOCKERHUB_CREDENTIALS')
            }
            steps {
                script {
                    def imageTag = "${DOCKER_IMAGE}:${env.BUILD_NUMBER}"
                    sh "docker login -u $DOCKERHUB_CREDENTIALS_USR -p $DOCKERHUB_CREDENTIALS_PSW"
                    sh "docker build -t ${imageTag} ."
                    sh "docker tag ${imageTag} ${DOCKER_IMAGE}:latest"
                    sh "docker push ${imageTag}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            environment {
                KUBECONFIG = credentials('KUBE_CONFIG')
            }
            steps {
                sh '''
                    kubectl apply -f k8s/deployment.yaml
                    kubectl apply -f k8s/service.yaml
                '''
            }
        }

        stage('Application Verification') {
            steps {
                sh 'curl -f https://rsschool.codershub.top || exit 1'
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker images...'
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
        }

        failure {
            emailext to: 'edy@codershub.top',
                     subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                     body: "Check the Jenkins job here: ${env.BUILD_URL}"
        }
    }
}
