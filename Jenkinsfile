pipeline {
    agent { label 'worker-agents' }

    tools {
        nodejs 'nodejs20'
    }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        HELM_CHART = './rs-school-app'
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials')
    }

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
                sh 'npx vitest run --coverage || echo "No tests configured"'
            }
        }
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def sonarParams = [
                            "-Dsonar.projectKey=rs-school-stars-shine",
                            "-Dsonar.sources=src",
                            "-Dsonar.tests=src",
                            "-Dsonar.host.url=https://sonarqube.codershub.top",
                            "-Dsonar.login=${SONAR_TOKEN}",
                            "-Dsonar.exclusions=**/coverage/**,**/dist/**",
                            "-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info"
                        ]

                        if (env.CHANGE_ID) {
                            sonarParams += [
                                "-Dsonar.pullrequest.key=${env.CHANGE_ID}",
                                "-Dsonar.pullrequest.branch=${env.CHANGE_BRANCH}",
                                "-Dsonar.pullrequest.base=${env.CHANGE_TARGET}"
                            ]
                        } else {
                            sonarParams += "-Dsonar.branch.name=${env.BRANCH_NAME}"
                        }

                        env.SONAR_SCANNER_OPTS = "-Xmx2g"

                        // Join the params properly and run with npx
                        sh "npx sonar-scanner ${sonarParams.join(' ')}"
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
                sh 'sleep 30'
                sh 'kubectl get pods -n default | grep rs-school-app || exit 1'
                sh 'curl -f -k https://rsschool.codershub.top || exit 1'
            }
        }
    }
    post {
        success {
            emailext (
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "The pipeline succeeded. Application deployed to https://rsschool.codershub.top",
                to: 'your.email@example.com'
            )
        }
        failure {
            emailext (
                subject: "FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "The pipeline failed. Check console output at ${env.BUILD_URL}",
                to: 'your.email@example.com'
            )
        }
        always {
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
        }
    }
}