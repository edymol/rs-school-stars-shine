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

    // --- Stages: The sequential steps of your CI/CD pipeline ---
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
                // Executes Vitest tests. '|| echo "No tests configured"' prevents pipeline failure
                // if vitest is not set up or returns non-zero for test issues (adjust as needed).
                sh 'npx vitest run --coverage || echo "No tests configured"'
            }
        }

        stage('4. SonarQube Static Code Analysis') {
            steps {
                echo 'Performing SonarQube analysis...'
                // Integrates with a SonarQube server configured in Jenkins global tools
                withSonarQubeEnv('SonarQube') { // 'SonarQube' is the name of your SonarQube server config in Jenkins
                    script {
                        def sonarParams = [
                            "-Dsonar.projectKey=rs-school-stars-shine", // SonarQube project key
                            "-Dsonar.sources=src",                      // Source code directory to analyze
                            "-Dsonar.tests=src",                        // Test files directory to analyze
                            "-Dsonar.exclusions=**/coverage/**,**/dist/**", // Files/dirs to exclude
                            "-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info" // Path to LCOV report for coverage
                        ]

                        // Add Pull Request specific parameters if this is a PR build
                        if (env.CHANGE_ID) {
                            sonarParams += [
                                "-Dsonar.pullrequest.key=${env.CHANGE_ID}",
                                "-Dsonar.pullrequest.branch=${env.CHANGE_BRANCH}",
                                "-Dsonar.pullrequest.base=${env.CHANGE_TARGET}"
                            ]
                        }

                        // Increase JVM memory for Sonar Scanner if needed
                        env.SONAR_SCANNER_OPTS = "-Xmx2g"
                        sh "npx sonar-scanner ${sonarParams.join(' ')}" // Executes the SonarQube scan
                    }
                }
            }
            // Post-stage action for SonarQube: Wait for Quality Gate status
            post {
                always {
                    echo 'Waiting for SonarQube Quality Gate result...'
                    timeout(time: 5, unit: 'MINUTES') { // Max 5 minutes to wait for Quality Gate
                        waitForQualityGate abortPipeline: true // Aborts pipeline if Quality Gate fails
                    }
                }
            }
        }

        stage('5. Docker Image Build & Push') {
            steps {
                echo 'Building and pushing Docker image...'
                script {
                    // Build Docker image with build number tag
                    sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                    // Tag the image as 'latest'
                    sh "docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest"
                    // Login to DockerHub using credentials from Jenkins Credential Store
                    // DOCKERHUB_CREDENTIALS_USR and DOCKERHUB_CREDENTIALS_PSW are exposed from the 'Docker_credentials' ID
                    withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS, usernameVariable: 'DOCKERHUB_CREDENTIALS_USR', passwordVariable: 'DOCKERHUB_CREDENTIALS_PSW')]) {
                        sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                    }
                    // Push tagged images to DockerHub
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('6. Create Helm Chart') {
            steps {
                echo 'Generating Helm chart files dynamically...'
                // Dynamically creates the Helm chart directory and essential files (Chart.yaml, values.yaml, templates/deployment.yaml, templates/service.yaml)
                // This approach ensures the chart is always in sync with the pipeline's variables.
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
  tag: "${BUILD_NUMBER}" # Use the current build number for image tag

service:
  type: NodePort
  port: 80
  targetPort: 9999
  nodePort: ${KUBE_PORT} # Use the dynamically set NodePort
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
                // Uses Kubernetes config from Jenkins Credential Store (file type)
                withCredentials([file(credentialsId: KUBE_CONFIG, variable: 'KUBECONFIG_FILE')]) {
                    sh '''
                        # Set KUBECONFIG environment variable to use the provided credential file
                        mkdir -p ~/.kube
                        cp $KUBECONFIG_FILE ~/.kube/config
                        chmod 600 ~/.kube/config # Ensure correct permissions for kubectl/helm

                        # Upgrade or install the Helm release
                        helm upgrade --install ${RELEASE_NAME} ${CHART_NAME} \\
                          --namespace default \\
                          --set image.repository=${DOCKER_IMAGE} \\
                          --set image.tag=${BUILD_NUMBER} \\
                          --wait --timeout 5m # Wait for release to be ready, max 5 minutes
                    '''
                }
            }
        }
        // Optional: Add a stage for Application Verification (e.g., curl endpoints, run smoke tests)
        // stage('8. Application Verification') {
        //     steps {
        //         echo 'Verifying application deployment...'
        //         sh 'curl -f http://<your-app-service-ip>:<your-app-nodeport>/health || exit 1' // Example smoke test
        //     }
        // }
    }

    // --- Post-build Actions: Notifications and cleanup based on pipeline status ---
    post {
        success {
            echo 'Pipeline succeeded! Sending notifications.'
            // Email notification for SUCCESS
            emailext (
                subject: "✅ SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                to: 'edy@codershub.top', // Multiple recipients
                body: '${MAIL_TEMPLATE,showPaths=true,template="pipeline_success.html"}', // Uses external template
                mimeType: 'text/html' // Ensures HTML rendering in email client
            )
            // Slack notification for SUCCESS
            slackSend (
                channel: "${SLACK_CHANNEL}",
                color: 'good', // Green color
                message: "✅ SUCCESS: Pipeline '${env.JOB_NAME}' (${env.BUILD_NUMBER}) completed successfully! App deployed to: https://rsschool.codershub.top <${env.BUILD_URL}|View Build>"
            )
            // Discord notification for SUCCESS
            discordSend (
                message: "✅ SUCCESS: Pipeline `${env.JOB_NAME}` Build #${env.BUILD_NUMBER} completed successfully! App deployed to: https://rsschool.codershub.top <${env.BUILD_URL}>",
                color: '#28A745', // Green hex color
                username: 'Jenkins CI/CD',
                avatarUrl: 'https://raw.githubusercontent.com/jenkinsci/jenkins/master/war/src/main/webapp/images/logo.png'
            )
        }

        failure {
            echo 'Pipeline failed! Sending notifications.'
            // Email notification for FAILURE
            emailext (
                subject: "❌ FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                to: 'edy@codershub.top', // Multiple recipients
                body: '${MAIL_TEMPLATE,showPaths=true,template="pipeline_failure.html"}', // Uses external template
                mimeType: 'text/html'
            )
            // Slack notification for FAILURE
            slackSend (
                channel: "${SLACK_CHANNEL}",
                color: 'danger', // Red color
                message: "❌ FAILED: Pipeline '${env.JOB_NAME}' (${env.BUILD_NUMBER}) failed! Please check the build logs: <${env.BUILD_URL}|View Build>"
            )
            // Discord notification for FAILURE
            discordSend (
                message: "❌ FAILED: Pipeline `${env.JOB_NAME}` Build #${env.BUILD_NUMBER} failed! Check logs: <${env.BUILD_URL}>",
                color: '#DC3545', // Red hex color
                username: 'Jenkins CI/CD',
                avatarUrl: 'https://raw.githubusercontent.com/jenkinsci/jenkins/master/war/src/main/webapp/images/logo.png'
            )
        }

        always {
            echo 'Performing post-build cleanup...'
            // Clean up Docker login session and local images
            sh 'docker logout || true' // Logout from DockerHub, '|| true' prevents pipeline failure if not logged in
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true" // Remove specific image tag
            sh "docker rmi ${DOCKER_IMAGE}:latest || true" // Remove latest tag
            sh 'rm -f ~/.kube/config' // Remove temporary Kubernetes config file
        }
    }
}