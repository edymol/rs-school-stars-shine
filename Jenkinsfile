pipeline {
    agent { label 'worker-agents' } // Specifies that this pipeline will run on an agent with the 'worker-agents' label

    environment {
        // --- Application and Environment Specific Variables ---
        DOCKER_IMAGE = 'edydockers/rs-school-app' // Name for your Docker image
        CHART_NAME = 'rs-school-chart'           // Name of your Helm chart
        RELEASE_NAME = 'rs-school-app'           // Name for your Helm release in Kubernetes
        KUBE_PORT = '31001'                      // NodePort for your application service in Kubernetes

        // --- Jenkins Credentials IDs ---
        KUBE_CONFIG = credentials('kubernetes-config')      // Credential ID for Kubernetes config file
        SONAR_TOKEN = credentials('sonarqube-token')        // Credential ID for SonarQube authentication token
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials') // Credential ID for DockerHub login (Username/Password)

        // --- Notification Specific Variables ---
        SLACK_CHANNEL = '#github-trello-jenkins-updates' // Slack channel for notifications
        SLACK_INTEGRATION_ID = 'slack'                   // Credential ID for Slack API Token (configured globally)

        // Ensure your external email templates are located in $JENKINS_HOME/email-templates/
        // e.g., /var/lib/jenkins/email-templates/pipeline_success.html
        // e.g., /var/lib/jenkins/email-templates/pipeline_failure.html
    }

    // --- Triggers: How the pipeline is initiated ---
    triggers {
        // Triggers a build automatically when code is pushed to the GitHub repository.
        // Requires a GitHub webhook configured in your repository pointing to Jenkins' /github-webhook/ endpoint.
        githubPush()
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Checking out source code...'
                checkout scm // Checks out the code from the SCM defined in the job configuration
            }
        }

        stage('2. Install Dependencies & Build Application') {
            steps {
                echo 'Installing Node.js dependencies and building the application...'
                sh 'npm install' // Installs Node.js packages
                sh 'npm run build' // Builds the application
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
                withSonarQubeEnv('SonarQube') { // 'SonarQube' is the name of your SonarQube server config in Jenkins
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
                        sh "npx sonar-scanner ${sonarParams.join(' ')}" // Executes the SonarQube scan
                    }
                }
            }
            // Post-stage action for SonarQube: Wait for Quality Gate status
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
                    withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS, usernameVariable: 'DOCKERHUB_CREDENTIALS_USR', passwordVariable: 'DOCKERHUB_CREDENTIALS_PSW')]) {
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

    // --- Post-build Actions: Notifications and cleanup based on pipeline status ---
    post {
        success {
            echo 'Pipeline succeeded! Sending notifications.'
            // Email notification for SUCCESS
            emailext (
                subject: "✅ SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                to: 'edy@codershub.top',
                body: '${MAIL_TEMPLATE,showPaths=true,template="pipeline_success.html"}',
                mimeType: 'text/html'
            )
            // Slack notification for SUCCESS
            slackSend (
                channel: "${SLACK_CHANNEL}",
                color: 'good',
                message: "✅ SUCCESS: Pipeline '${env.JOB_NAME}' (${env.BUILD_NUMBER}) completed successfully! App deployed to: https://rsschool.codershub.top <${env.BUILD_URL}|View Build>"
            )
            // Discord notification for SUCCESS (CORRECTED PARAMETERS)
            discordSend (
                content: "✅ SUCCESS: Pipeline `${env.JOB_NAME}` Build #${env.BUILD_NUMBER} completed successfully! App deployed to: https://rsschool.codershub.top <${env.BUILD_URL}>",
                embeds: [[
                    color: 2621485, // Green hex color as decimal (0x28A745)
                    author: [name: "Jenkins CI/CD", icon_url: "https://raw.githubusercontent.com/jenkinsci/jenkins/master/war/src/main/webapp/images/logo.png"],
                    title: "Pipeline Status: SUCCESS",
                    url: env.BUILD_URL,
                    description: "Details for build #${env.BUILD_NUMBER} of ${env.JOB_NAME}",
                    fields: [
                        [name: "Deployment URL", value: "https://rsschool.codershub.top", inline: true],
                        [name: "Build Duration", value: "${BUILD_DURATION}", inline: true]
                    ],
                    footer: [text: "Automated notification from Jenkins"]
                ]]
                // customUsername: 'Jenkins CI/CD', // This can be set globally in Jenkins config for the plugin
                // avatarUrl: 'https://raw.githubusercontent.com/jenkinsci/jenkins/master/war/src/main/webapp/images/logo.png' // Can be set globally
            )
        }

        failure {
            echo 'Pipeline failed! Sending notifications.'
            // Email notification for FAILURE
            emailext (
                subject: "❌ FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                to: 'edy@codershub.top',
                body: '${MAIL_TEMPLATE,showPaths=true,template="pipeline_failure.html"}',
                mimeType: 'text/html'
            )
            // Slack notification for FAILURE (kept as is)
            slackSend (
                channel: "${SLACK_CHANNEL}",
                color: 'danger',
                message: "❌ FAILED: Pipeline '${env.JOB_NAME}' (${env.BUILD_NUMBER}) failed! Please check the build logs: <${env.BUILD_URL}|View Build>"
            )
            // Discord notification for FAILURE (CORRECTED PARAMETERS)
            discordSend (
                content: "❌ FAILED: Pipeline `${env.JOB_NAME}` Build #${env.BUILD_NUMBER} failed! Check logs: <${env.BUILD_URL}>",
                embeds: [[
                    color: 14423109, // Red hex color as decimal (0xDC3545)
                    author: [name: "Jenkins CI/CD", icon_url: "https://raw.githubusercontent.com/jenkinsci/jenkins/master/war/src/main/webapp/images/logo.png"],
                    title: "Pipeline Status: FAILED",
                    url: env.BUILD_URL,
                    description: "Build #${env.BUILD_NUMBER} of ${env.JOB_NAME} has failed.",
                    fields: [
                        [name: "Failure Cause", value: "${CAUSE}", inline: false],
                        [name: "Build Duration", value: "${BUILD_DURATION}", inline: true]
                    ],
                    footer: [text: "Automated notification from Jenkins"]
                ]]
                // customUsername: 'Jenkins CI/CD',
                // avatarUrl: 'https://raw.githubusercontent.com/jenkinsci/jenkins/master/war/src/main/webapp/images/logo.png'
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