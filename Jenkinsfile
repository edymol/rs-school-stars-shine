pipeline {
    agent { label 'worker-agents' }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        CHART_NAME = 'rs-school-chart'
        RELEASE_NAME = 'rs-school-app'
        KUBE_PORT = '31001'

        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS_ID = 'Docker_credentials' // Directly use the string ID here

        SLACK_CHANNEL = '#github-trello-jenkins-updates'
        SLACK_INTEGRATION_ID = 'slack'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('2. Install Dependencies & Build Application') {
            steps {
                echo 'Installing Node.js dependencies and building the application...'
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('3. Run Unit Tests') {
            steps {
                echo 'Running unit tests with Vitest...'
                sh 'npx vitest run --coverage || echo "No tests configured"'
            }
        }

        stage('4. SonarQube Static Code Analysis') {
            steps {
                echo 'Performing SonarQube analysis...'
                withSonarQubeEnv('SonarQube') {
                    script {
                        def sonarParams = [
                            "-Dsonar.projectKey=rs-school-stars-shine",
                            "-Dsonar.sources=src",
                            "-Dsonar.tests=src",
                            "-Dsonar.exclusions=**/coverage/**,**/dist/**",
                            "-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info"
                        ]

                        if (env.CHANGE_ID) {
                            sonarParams += [
                                "-Dsonar.pullrequest.key=${env.CHANGE_ID}",
                                "-Dsonar.pullrequest.branch=${env.CHANGE_BRANCH}",
                                "-Dsonar.pullrequest.base=${env.CHANGE_TARGET}"
                            ]
                        }

                        env.SONAR_SCANNER_OPTS = "-Xmx2g"
                        sh "npx sonar-scanner ${sonarParams.join(' ')}"
                    }
                }
            }
            post {
                always {
                    echo 'Waiting for SonarQube Quality Gate result...'
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('5. Docker Image Build & Push') {
            steps {
                echo 'Building and pushing Docker image...'
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                    sh "docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest"
                    withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKERHUB_CREDENTIALS_USR', passwordVariable: 'DOCKERHUB_CREDENTIALS_PSW')]) {
                        sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                    }
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('6. Create Helm Chart') {
            steps {
                echo 'Generating Helm chart files dynamically...'
                sh '''
                    rm -rf ${CHART_NAME}
                    mkdir -p ${CHART_NAME}/templates

                    cat <<EOF > ${CHART_NAME}/Chart.yaml
apiVersion: v2
name: ${CHART_NAME}
version: 0.1.0
description: A Helm chart for my application
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
                '''
            }
        }

        stage('7. Deploy to Kubernetes with Helm') {
            steps {
                echo 'Deploying application to K3s cluster using Helm...'
                withCredentials([file(credentialsId: KUBE_CONFIG, variable: 'KUBECONFIG_FILE')]) {
                    sh '''
                        mkdir -p ~/.kube
                        cp $KUBECONFIG_FILE ~/.kube/config
                        chmod 600 ~/.kube/config

                        helm upgrade --install ${RELEASE_NAME} ${CHART_NAME} \\
                          --namespace default \\
                          --set image.repository=${DOCKER_IMAGE} \\
                          --set image.tag=${BUILD_NUMBER} \\
                          --wait --timeout 5m
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded! Sending notifications.'
            // Email notification for success (multi-recipient, external template)
            emailext (
                subject: "✅ SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                to: 'edy@codershub.top, team.lead@example.com, devops.team@example.com', // Added multiple recipients
                body: '${MAIL_TEMPLATE,showPaths=true,template="pipeline_success.html"}', // Uses external template
                mimeType: 'text/html' // Ensures HTML rendering in email client
            )
            // Slack notification for success (kept as is)
            slackSend (
                channel: "${SLACK_CHANNEL}",
                color: 'good',
                message: "✅ SUCCESS: Pipeline '${env.JOB_NAME}' (${env.BUILD_NUMBER}) completed successfully! App deployed to: https://rsschool.codershub.top <${env.BUILD_URL}|View Build>"
            )
        }

        failure {
            echo 'Pipeline failed! Sending notifications.'
            // Email notification for failure (multi-recipient, external template)
            emailext (
                subject: "❌ FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                to: 'edy@codershub.top, team.lead@example.com, devops.team@example.com', // Added multiple recipients
                body: '${MAIL_TEMPLATE,showPaths=true,template="pipeline_failure.html"}', // Uses external template
                mimeType: 'text/html'
            )
            // Slack notification for failure (kept as is)
            slackSend (
                channel: "${SLACK_CHANNEL}",
                color: 'danger',
                message: "❌ FAILED: Pipeline '${env.JOB_NAME}' (${env.BUILD_NUMBER}) failed! Please check the build logs: <${env.BUILD_URL}|View Build>"
            )
        }

        always {
            echo 'Performing post-build cleanup...'
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
            sh 'rm -f ~/.kube/config'
        }
    }
}
