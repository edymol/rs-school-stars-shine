pipeline {
    agent any

    environment {
        HELM_CHART_DIR = "rs-school-chart"
        IMAGE_REPO = "edydockers/rs-school-app"
        IMAGE_TAG = "48"  // adjust as needed
        KUBE_CONFIG_PATH = "/home/jenkins/.kube/config"
        NAMESPACE = "default"
        NODE_PORT = 31001
    }

    stages {
        stage('Prepare Helm Chart') {
            steps {
                script {
                    // Clean old chart dir
                    sh "rm -rf ${HELM_CHART_DIR}"

                    // Create new Helm chart
                    sh "helm create ${HELM_CHART_DIR}"

                    // Patch values.yaml to set static nodePort and NodePort type
                    sh """
                    yq e '.service.type = "NodePort" | 
                          .service.port = 80 | 
                          .service.targetPort = 9999 | 
                          .service.nodePort = ${NODE_PORT}' -i ${HELM_CHART_DIR}/values.yaml
                    """
                }
            }
        }

        stage('Validate YAML (optional)') {
            steps {
                script {
                    // Install yamllint if missing
                    def yamllintExists = sh(script: "command -v yamllint || true", returnStdout: true).trim()
                    if (!yamllintExists) {
                        echo "Installing yamllint..."
                        sh "pip install --user yamllint"
                    }

                    // Run yamllint (optional, fail fast)
                    def lintResult = sh(script: "yamllint ${HELM_CHART_DIR} || true", returnStatus: true)
                    if (lintResult != 0) {
                        echo "WARNING: YAML linting failed. Please fix your Helm templates."
                        // Do NOT fail build here; just warn
                    }
                }
            }
        }

        stage('Setup Kubeconfig') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-credentials-id', variable: 'KUBECONFIG_FILE')]) {
                    sh """
                        mkdir -p /home/jenkins/.kube
                        cp $KUBECONFIG_FILE ${KUBE_CONFIG_PATH}
                        chmod 600 ${KUBE_CONFIG_PATH}
                    """
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    sh """
                        docker build -t ${IMAGE_REPO}:${IMAGE_TAG} .
                        docker push ${IMAGE_REPO}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Deploy Helm Chart') {
            steps {
                script {
                    // Helm upgrade/install with static nodePort set in values.yaml
                    sh """
                        helm upgrade --install rs-school-app ${HELM_CHART_DIR} \
                          --namespace ${NAMESPACE} \
                          --set image.repository=${IMAGE_REPO} \
                          --set image.tag=${IMAGE_TAG} \
                          --wait --timeout 5m
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                // Clean up docker images to save space
                sh """
                    docker logout || true
                    docker rmi ${IMAGE_REPO}:${IMAGE_TAG} || true
                    docker rmi ${IMAGE_REPO}:latest || true
                """
                // Optional: Remove kubeconfig for security
                sh "rm -f ${KUBE_CONFIG_PATH}"
            }
        }

        failure {
            emailext (
                to: 'edy@codershub.top',
                subject: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Check Jenkins logs for details."
            )
        }
    }
}