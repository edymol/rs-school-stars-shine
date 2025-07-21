pipeline {
    agent { label 'worker-agents' }

    triggers {
        githubPush()
    }

    environment {
        DOCKER_IMAGE = 'edydockers/rs-school-app'
        RELEASE_NAME = 'rs-school-app'
        CHART_DIR = './helm/rs-school-app'
        KUBE_CONFIG = credentials('kubernetes-config')
        NAMESPACE = 'rs-school' // Application and Monitoring namespace
        CONFIG_DIR = "./helm/kube-monitoring-stack" // Path to kube-prometheus-stack values
        GRAFANA_CONFIGS_DIR = "./helm/grafana-configs" // Path to your custom Grafana ConfigMaps chart
        PROMETHEUS_CHART_NAME = "kube-prometheus-stack"
        PROMETHEUS_CLUSTER_NAMESPACE = "rs-school" // Explicitly set for monitoring stack
    }

    stages {
        stage('Initialize Kubeconfig') { // New stage for common kubeconfig setup
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG_FILE')]) { // Changed variable name for clarity
                    sh """
                        mkdir -p ~/.kube
                        cp ${KUBECONFIG_FILE} ~/.kube/config
                        chmod 600 ~/.kube/config
                        # Ensure kubectl is available on the agent
                        # This might vary based on your worker-agent's OS. Example for Debian/Ubuntu:
                        # apt-get update && apt-get install -y kubectl helm || true
                        # For now, rely on previous successful runs showing helm is available.
                        # It's good practice to ensure kubectl is in PATH, but it's not blocking now.
                    """
                }
            }
        }

        stage('Deploy Grafana Configs') {
            steps {
                sh '''
                    # Create namespace if it doesn't exist
                    kubectl create namespace ${NAMESPACE} || true

                    # Use helm upgrade --install for robustness
                    helm upgrade --install grafana-configs ${GRAFANA_CONFIGS_DIR} \
                        -n ${NAMESPACE} \
                        --wait
                '''
            }
        }

        stage('Deploy Monitoring Stack') {
            steps {
                sh '''
                    # Optional: Clean up old release from wrong namespace if it somehow exists
                    helm delete prometheus -n monitoring || true
                    # Optional: Delete from correct namespace for a guaranteed clean re-install, though --install should handle it
                    # helm delete prometheus -n ${NAMESPACE} || true

                    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true # Add || true to prevent failure if repo already exists
                    helm repo update

                    # Use helm upgrade --install for robustness
                    helm upgrade --install prometheus prometheus-community/${PROMETHEUS_CHART_NAME} \
                        -n ${NAMESPACE} \
                        -f ${CONFIG_DIR}/values.yaml \
                        --atomic \
                        --wait
                '''
            }
        }

        stage('Deploy RS School App') { // Renamed for clarity
            steps {
                sh '''
                    # Optional: Clean up old release from wrong namespace (default) if it exists
                    helm delete ${RELEASE_NAME} -n default || true
                    # Optional: Delete from correct namespace for a guaranteed clean re-install
                    # helm delete ${RELEASE_NAME} -n ${NAMESPACE} || true

                    # Use helm upgrade --install for robustness
                    helm upgrade --install ${RELEASE_NAME} ${CHART_DIR} \
                        --namespace ${NAMESPACE} \
                        --set image.repository=${DOCKER_IMAGE} \
                        --set image.tag=${BUILD_NUMBER} \
                        --wait --timeout 5m
                '''
            }
        }
    }

    post {
        always {
            sh 'rm -f ~/.kube/config || true'
        }
    }
}