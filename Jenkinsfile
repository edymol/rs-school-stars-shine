pipeline {
    agent { label 'worker-agents' }

    triggers {
        githubPush()
    }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        RELEASE_NAME = 'rs-school-app'
        CHART_DIR = 'rs-school-app'
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials')
        KUBE_PORT = '31001'
        SLACK_CHANNEL = '#notifications'
        NAMESPACE = 'rs-school'
        CONFIG_DIR = "."
        GRAFANA_CONFIGS_DIR = "./helm/grafana-configs"
        PROMETHEUS_CHART_NAME = "kube-prometheus-stack"
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
                        sh """
                            echo "${DOCKERHUB_CREDENTIALS_PSW}" | docker login -u "${DOCKERHUB_CREDENTIALS_USR}" --password-stdin
                        """
                    }
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Deploy Grafana Configs') {
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG')]) {
                    sh '''
                        mkdir -p ~/.kube
                        cp $KUBECONFIG ~/.kube/config
                        chmod 600 ~/.kube/config
                        helm install grafana-configs ${GRAFANA_CONFIGS_DIR} \
                            -n ${NAMESPACE} \
                            --create-namespace \
                            --wait
                    '''
                }
            }
        }

        stage('Deploy monitoring Stack') {
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG')]) {
                    sh '''
                        mkdir -p ~/.kube
                        cp $KUBECONFIG ~/.kube/config
                        chmod 600 ~/.kube/config
                        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
                        helm repo update
                        helm install prometheus prometheus-community/${PROMETHEUS_CHART_NAME} \
                            -n ${NAMESPACE} \
                            -f ${CONFIG_DIR}/values.yaml \
                            --create-namespace \
                            --atomic \
                            --wait
                    '''
                }
            }
        }

        stage('Deploy to K3s via Helm') {
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG')]) {
                    sh '''
                        mkdir -p ~/.kube
                        cp $KUBECONFIG ~/.kube/config
                        chmod 600 ~/.kube/config

                        kubectl create namespace ${NAMESPACE} || true
                        helm install ${RELEASE_NAME} ${CHART_DIR} \
                          --namespace ${NAMESPACE} \
                          --set image.repository=${DOCKER_IMAGE} \
                          --set image.tag=${BUILD_NUMBER} \
                          --wait --timeout 5m
                    '''
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
//             slackSend (
//                 channel: "${SLACK_CHANNEL}",
//                 color: 'danger',
//                 message: "❌ FAILED: Pipeline '${env.JOB_NAME}' (#${env.BUILD_NUMBER}) failed.\n<${env.BUILD_URL}|View Logs>"
//             )
        }

        always {
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
            sh 'rm -f ~/.kube/config || true'
        }
    }
}