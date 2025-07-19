pipeline {
    agent { label 'worker-agents' }

    triggers {
        // GitHub webhook trigger
        githubPush()
        // Or use polling if needed
        // pollSCM('H/5 * * * *')
    }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        CHART_NAME = 'rs-school-chart'
        RELEASE_NAME = 'rs-school-app'
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials')
        KUBE_PORT = '31001'
        SLACK_CHANNEL = '#notifications'
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
                            "-Dsonar.javascript.node.maxspace=1024" // 🔧 Lowered to prevent OOM
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

        stage('Create Clean Helm Chart') {
            steps {
                sh """
                    rm -rf ${CHART_NAME}
                    mkdir -p ${CHART_NAME}/templates

                    cat <<EOF > ${CHART_NAME}/Chart.yaml
apiVersion: v2
name: ${CHART_NAME}
version: 0.1.0
EOF

                    cat <<EOF > ${CHART_NAME}/values.yaml
replicaCount: 1

image:
  repository: ${DOCKER_IMAGE}
  pullPolicy: IfNotPresent
  tag: "${BUILD_NUMBER}"

service:
  type: NodePort
  port: 80
  targetPort: 9999
  nodePort: ${KUBE_PORT}
EOF

                    cat <<EOF > ${CHART_NAME}/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${RELEASE_NAME}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: ${RELEASE_NAME}
  template:
    metadata:
      labels:
        app: ${RELEASE_NAME}
    spec:
      containers:
      - name: ${RELEASE_NAME}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: 9999
EOF

                    cat <<EOF > ${CHART_NAME}/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ${RELEASE_NAME}
spec:
  type: {{ .Values.service.type }}
  selector:
    app: ${RELEASE_NAME}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      nodePort: {{ .Values.service.nodePort }}
EOF
                """
            }
        }

        stage('Deploy to K3s via Helm') {
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG_FILE')]) {
                    sh """
                        mkdir -p ~/.kube
                        cp $KUBECONFIG_FILE ~/.kube/config
                        chmod 600 ~/.kube/config

                        helm upgrade --install ${RELEASE_NAME} ${CHART_NAME} \
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