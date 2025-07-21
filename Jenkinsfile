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
        NAMESPACE = 'rs-school'
        CONFIG_DIR = "./kube-monitoring-stack"
        GRAFANA_CONFIGS_DIR = "./helm/grafana-configs"
        PROMETHEUS_CHART_NAME = "kube-prometheus-stack"
    }

    stages {
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
        always {
            sh 'rm -f ~/.kube/config || true'
        }
    }
}