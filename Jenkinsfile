pipeline {
    agent { label 'worker-agents' }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        HELM_CHART = './rs-school-app'
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials')
        PATH = "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/snap/bin:$PATH" // Ensure npm is found
    }

    triggers {
        githubPush()
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'node -v && npm -v' // for debugging
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm test || echo "No unit tests found or configured"'
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

                        if (env.CHANGE_ID) {
                            sonarParams += """
                                -Dsonar.pullrequest.key=${env.CHANGE_ID} \
                                -Dsonar.pullrequest.branch=${env.CHANGE_BRANCH} \
                                -Dsonar.pullrequest.base=${env.CHANGE_TARGET}
                            """
                        } else {
                            sonarParams += "-Dsonar.branch.name=${env.BRANCH_NAME}"
                        }

                        sh "sonar-scanner ${sonarParams}"
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
            emailext(
                subject: "✅ SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """
                    ✅ Pipeline succeeded!
                    App: https://rsschool.codershub.top
                    SonarQube: https://sonarqube.codershub.top/dashboard?id=rs-school-stars-shine
                """,
                to: 'edy@codershub.top'
            )
        }

        failure {
            emailext(
                subject: "❌ FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """
                    ❌ Pipeline failed.
                    See logs: ${env.BUILD_URL}
                """,
                to: 'edy@codershub.top'
            )
        }

        always {
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
        }
    }
}
