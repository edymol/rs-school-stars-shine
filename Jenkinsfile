pipeline {
  agent any

  environment {
    DOCKER_IMAGE = 'edydockers/rs-school-app'
    IMAGE_TAG = '48'
    KUBE_DIR = '/home/jenkins/.kube'
    CHART_NAME = 'rs-school-chart'
    STATIC_NODEPORT = 31001
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare Helm Chart') {
      steps {
        script {
          sh 'rm -rf ${CHART_NAME}'
          sh "helm create ${CHART_NAME}"

          // Set static NodePort configuration using yq
          sh '''
            yq -i '.service.type = "NodePort" |
                   .service.port = 80 |
                   .service.targetPort = 9999 |
                   .service.nodePort = ${STATIC_NODEPORT}' ${CHART_NAME}/values.yaml
          '''
        }
      }
    }

    stage('Validate YAML (optional)') {
      steps {
        script {
          sh 'pip install --user yamllint || true'
          withEnv(["PATH=${env.HOME}/.local/bin:${env.PATH}"]) {
            sh 'yamllint ${CHART_NAME} || true' // Don't fail if yamllint fails
          }
        }
      }
    }

    stage('Setup Kubeconfig') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-credentials-id', variable: 'KUBECONFIG_FILE')]) {
          sh '''
            mkdir -p ${KUBE_DIR}
            cp $KUBECONFIG_FILE ${KUBE_DIR}/config
            chmod 600 ${KUBE_DIR}/config
            export KUBECONFIG=${KUBE_DIR}/config
          '''
        }
      }
    }

    stage('Build & Push Docker Image') {
      steps {
        sh '''
          docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} .
          docker tag ${DOCKER_IMAGE}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest
          docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
          docker push ${DOCKER_IMAGE}:latest
        '''
      }
    }

    stage('Deploy Helm Chart') {
      steps {
        sh '''
          export KUBECONFIG=${KUBE_DIR}/config
          helm upgrade --install rs-school-app ${CHART_NAME} \
            --namespace default \
            --set image.repository=${DOCKER_IMAGE} \
            --set image.tag=${IMAGE_TAG} \
            --wait --timeout 5m
        '''
      }
    }
  }

  post {
    always {
      script {
        sh '''
          docker logout || true
          docker rmi ${DOCKER_IMAGE}:${IMAGE_TAG} || true
          docker rmi ${DOCKER_IMAGE}:latest || true
          rm -f ${KUBE_DIR}/config
        '''
      }
      emailext(
        subject: "Jenkins Build - ${currentBuild.fullDisplayName}",
        body: "Build finished with status: ${currentBuild.currentResult}",
        to: "edy@codershub.top"
      )
    }
  }
}