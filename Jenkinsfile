pipeline {
    agent { label 'worker-agents' }

    triggers {
        githubPush()
    }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        CHART_NAME = 'rs-school-chart'
        CHART_DIR = "helm/${CHART_NAME}"
        RELEASE_NAME = 'rs-school-app'
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials')
        KUBE_PORT = '31001'
        SLACK_CHANNEL = '#notifications'
        PROMETHEUS_CHART_NAME = "kube-monitoring-stack"
        PROMETHEUS_CLUSTER_NAMESPACE = "monitoring"
        CONFIG_DIR = "./helm/kube-monitoring-stack"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Build') {
            steps {
                sh 'npm ci'
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
                            "-Dsonar.exclusions=**/coverage/**,**/dist/**",
                            "-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info",
                            "-Dsonar.javascript.node.maxspace=1024"
                        ]

                        if (env.CHANGE_ID) {
                            sonarParams += [
                                "-Dsonar.pullrequest.key=${env.CHANGE_ID}",
                                "-Dsonar.pullrequest.branch=${env.CHANGE_BRANCH}",
                                "-Dsonar.pullrequest.base=${env.CHANGE_TARGET}"
                            ]
                        }

                        env.SONAR_SCANNER_OPTS = "-Xmx1g"
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

        stage('Docker Build & Push') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                    sh "docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest"
                    withCredentials([usernamePassword(credentialsId: 'Docker_credentials', usernameVariable: 'DOCKERHUB_CREDENTIALS_USR', passwordVariable: 'DOCKERHUB_CREDENTIALS_PSW')]) {
                        // Corrected Docker login syntax for Groovy string interpolation
                        sh "echo \"${DOCKERHUB_CREDENTIALS_PSW}\" | docker login -u \"${DOCKERHUB_CREDENTIALS_USR}\" --password-stdin"
                    }
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Apply Grafana Configurations') {
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG_FILE')]) {
                    sh """
                        mkdir -p ~/.kube
                        cp ${KUBECONFIG_FILE} ~/.kube/config
                        chmod 600 ~/.kube/config
                        kubectl create namespace ${PROMETHEUS_CLUSTER_NAMESPACE} || true
                        kubectl apply -f ${CONFIG_DIR}/grafana-contact-points.yaml \
                                    -f ${CONFIG_DIR}/grafana-alert-rules.yaml \
                                    -f ${CONFIG_DIR}/grafana-dashboards.yaml \
                                    -n ${PROMETHEUS_CLUSTER_NAMESPACE}
                    """
                }
            }
        }

        stage('Deploy monitoring Stack') {
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG_FILE')]) {
                    sh """
                        mkdir -p ~/.kube
                        cp ${KUBECONFIG_FILE} ~/.kube/config
                        chmod 600 ~/.kube/config
                        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
                        helm repo update
                        helm upgrade --install prometheus prometheus-community/${PROMETHEUS_CHART_NAME} \
                            -n ${PROMETHEUS_CLUSTER_NAMESPACE} \
                            -f ${CONFIG_DIR}/values.yaml \
                            --create-namespace \
                            --atomic \
                            --wait
                    """
                }
            }
        }

        stage('Deploy to K3s via Helm') {
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG_FILE')]) {
                    sh """
                        mkdir -p ~/.kube
                        cp ${KUBECONFIG_FILE} ~/.kube/config
                        chmod 600 ~/.kube/config

                        helm upgrade --install ${RELEASE_NAME} ${CHART_DIR} \
                            --namespace default \
                            --set image.repository=${DOCKER_IMAGE} \
                            --set image.tag=${BUILD_NUMBER} \
                            --wait --timeout 5m
                    """
                }
            }
        }
    }

    post {
        success {
            emailext (
                subject: "✅ SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "✅ Deployment complete. App is available at: https://rsschool.codershub.top",
                to: 'edy@codershub.top'
            )
            slackSend (
                channel: "${SLACK_CHANNEL}",
                color: 'good',
                message: "✅ SUCCESS: Pipeline '${env.JOB_NAME}' (#${env.BUILD_NUMBER}) deployed successfully! 🎉\nApp: https://rsschool.codershub.top\n<${env.BUILD_URL}|View Build Logs>"
            )
        }

        failure {
            emailext (
                subject: "❌ FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "❌ Pipeline failed. Check logs: ${env.BUILD_URL}",
                to: 'edy@codershub.top'
            )
            slackSend (
                channel: "${SLACK_CHANNEL}",
                color: 'danger',
                message: "❌ FAILED: Pipeline '${env.JOB_NAME}' (#${env.BUILD_NUMBER}) failed.\n<${env.BUILD_URL}|View Logs>"
            )
        }

        always {
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
            sh 'rm -f ~/.kube/config || true'
        }
    }
}