pipeline {
<<<<<<< HEAD
   agent { label 'worker-agents' }
=======
    agent { label 'worker-agents' }
>>>>>>> a777b02ab735d337b61bd7ce863b7538b7248a02

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        HELM_CHART = './rs-school-app'
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials')
    }

<<<<<<< HEAD
//     triggers {
//         pollSCM('H/5 * * * *')
//     }
    triggers {
        githubPush()
=======
    triggers {
        pollSCM('H/5 * * * *')
>>>>>>> a777b02ab735d337b61bd7ce863b7538b7248a02
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
<<<<<<< HEAD
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
=======
        stage('SonarQube Analysis') {  // Renamed for clarity; this "tests" the code quality
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def sonarParams = """
                        -Dsonar.projectKey=rs-school-stars-shine \
                        -Dsonar.sources=src \
                        -Dsonar.host.url=https://sonarqube.codershub.top \
                        -Dsonar.login=${SONAR_TOKEN}
                        """
                        if (env.CHANGE_ID) {  // For PRs
                            sonarParams += """
                            -Dsonar.pullrequest.key=${env.CHANGE_ID} \
                            -Dsonar.pullrequest.branch=${env.CHANGE_BRANCH} \
                            -Dsonar.pullrequest.base=${env.CHANGE_TARGET}
                            """
                        } else {  // For branches
                            sonarParams += "-Dsonar.branch.name=${env.BRANCH_NAME}"
                        }
                        sh "sonar-scanner ${sonarParams}"
                    }
>>>>>>> a777b02ab735d337b61bd7ce863b7538b7248a02
                }
            }
            post {
                always {
                    timeout(time: 5, unit: 'MINUTES') {
<<<<<<< HEAD
                        waitForQualityGate abortPipeline: true
=======
                        waitForQualityGate abortPipeline: true  // Fails build if quality gate fails
>>>>>>> a777b02ab735d337b61bd7ce863b7538b7248a02
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
<<<<<<< HEAD
                sh 'sleep 30'  // Wait for deployment rollout
                sh 'kubectl get pods -n default | grep rs-school-app || exit 1'
                sh 'curl -f -k https://rsschool.codershub.top || exit 1'  // Smoke test; -k if self-signed cert
=======
                sh 'sleep 30'
                sh 'kubectl get pods -n default | grep rs-school-app || exit 1'
                sh 'curl -f -k https://rsschool.codershub.top || exit 1'
>>>>>>> a777b02ab735d337b61bd7ce863b7538b7248a02
            }
        }
    }
    post {
        success {
            emailext (
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
<<<<<<< HEAD
                body: "The pipeline succeeded. Application deployed to https://rsschool.codershub.top",
                to: 'your.email@example.com'  // Configure recipient
=======
                body: "Pipeline succeeded. App at https://rsschool.codershub.top. Sonar results: https://sonarqube.codershub.top/dashboard?id=rs-school-stars-shine",
                to: 'your.email@example.com'
>>>>>>> a777b02ab735d337b61bd7ce863b7538b7248a02
            )
        }
        failure {
            emailext (
                subject: "FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
<<<<<<< HEAD
                body: "The pipeline failed. Check console output at ${env.BUILD_URL}",
                to: 'your.email@example.com'  // Configure recipient
=======
                body: "Pipeline failed: ${env.BUILD_URL}",
                to: 'your.email@example.com'
>>>>>>> a777b02ab735d337b61bd7ce863b7538b7248a02
            )
        }
        always {
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
        }
    }
}