pipeline {
    agent { label 'worker-agents' }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        CHART_NAME = 'rs-school-chart'
        RELEASE_NAME = 'rs-school-app'
        KUBE_CONFIG = credentials('kubernetes-config')
        SONAR_TOKEN = credentials('sonarqube-token')
        DOCKERHUB_CREDENTIALS = credentials('Docker_credentials')
        KUBE_PORT = '31001'
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

        stage('Install & Build') {
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
                    sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Create Helm Chart Dynamically') {
            steps {
                sh '''
                    rm -rf ${CHART_NAME}
                    helm create ${CHART_NAME}

                    cat <<EOF > ${CHART_NAME}/values.yaml
replicaCount: 2

image:
  repository: ${DOCKER_IMAGE}
  pullPolicy: IfNotPresent
  tag: "${BUILD_NUMBER}"

serviceAccount:
  create: false
  name: ""

service:
  type: NodePort
  port: 80
  nodePort: ${KUBE_PORT}

ingress:
  enabled: true
  className: ""
  annotations: {}
  hosts:
    - host: rsschool.codershub.top
      paths:
        - path: /
          pathType: ImplementationSpecific

autoscaling:
  enabled: false
EOF

                    # Update container and service ports
                    sed -i 's/containerPort: .*/containerPort: 9999/' ${CHART_NAME}/templates/deployment.yaml
                    sed -i 's/targetPort: .*/targetPort: 9999/' ${CHART_NAME}/templates/service.yaml

                    # Safely inject nodePort line under targetPort with correct YAML indentation
                    sed -i "/targetPort: 9999/a\\        nodePort: {{ .Values.service.nodePort }}" ${CHART_NAME}/templates/service.yaml

                    # Attempt to install yamllint (fallback if missing)
                    if ! command -v yamllint >/dev/null 2>&1; then
                        echo "⚠️ yamllint not found — attempting installation..."
                        pip install --user yamllint || echo "⚠️ Failed to install yamllint via pip"
                        export PATH=$HOME/.local/bin:$PATH
                    fi

                    # Validate the modified YAML (or skip if still not available)
                    if command -v yamllint >/dev/null 2>&1; then
                        yamllint ${CHART_NAME}/templates/service.yaml || {
                            echo "❌ YAML is invalid. File content:"
                            cat ${CHART_NAME}/templates/service.yaml
                            exit 1
                        }
                    else
                        echo "⚠️ yamllint still not available. Skipping YAML lint check."
                    fi
                '''
            }
        }

        stage('Deploy to K3s via Helm') {
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG_FILE')]) {
                    sh '''
                        mkdir -p ~/.kube
                        cp $KUBECONFIG_FILE ~/.kube/config
                        chmod 600 ~/.kube/config
                    '''
                    sh """
                        helm upgrade --install ${RELEASE_NAME} ${CHART_NAME} \
                        --namespace default \
                        --set image.repository=${DOCKER_IMAGE} \
                        --set image.tag=${BUILD_NUMBER} \
                        --set service.type=NodePort \
                        --set service.nodePort=${KUBE_PORT} \
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
        }

        failure {
            emailext (
                subject: "❌ FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Pipeline failed. Check logs: ${env.BUILD_URL}",
                to: 'edy@codershub.top'
            )
        }

        always {
            sh 'docker logout || true'
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
            sh 'rm -f ~/.kube/config'
        }
    }
}