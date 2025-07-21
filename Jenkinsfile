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
        stage('Initialize Kubeconfig') {
            steps {
                withCredentials([file(credentialsId: 'kubernetes-config', variable: 'KUBECONFIG_FILE')]) {
                    sh """
                        mkdir -p ~/.kube
                        # Securely copy kubeconfig
                        cp "${KUBECONFIG_FILE}" ~/.kube/config
                        chmod 600 ~/.kube/config
                        # You can add kubectl/helm installation checks here if worker-agent truly lacks them
                        # e.g., if ! command -v kubectl &> /dev/null; then sudo apt-get update && sudo apt-get install -y kubectl; fi
                    """
                }
            }
        }

        stage('Deploy Grafana Configs') {
            steps {
                sh '''
                    kubectl create namespace ${NAMESPACE} || true # Ensure namespace exists
                    helm upgrade --install grafana-configs ${GRAFANA_CONFIGS_DIR} \
                        -n ${NAMESPACE} \
                        --wait
                '''
            }
        }

        stage('Deploy Monitoring Stack') {
            steps {
                sh '''
                    # Aggressive cleanup of old/stuck releases (from any possible namespace)
                    helm uninstall prometheus -n monitoring || true
                    helm uninstall prometheus -n ${NAMESPACE} || true

                    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
                    helm repo update

                    helm upgrade --install prometheus prometheus-community/${PROMETHEUS_CHART_NAME} \
                        -n ${NAMESPACE} \
                        -f ${CONFIG_DIR}/values.yaml \
                        --atomic \
                        --wait
                '''
            }
        }

        stage('Deploy RS School App') {
            steps {
                sh '''
                    helm uninstall ${RELEASE_NAME} -n default || true
                    helm uninstall ${RELEASE_NAME} -n ${NAMESPACE} || true # Ensure clean slate in target namespace

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