// Jenkinsfile

pipeline {
    // Define a Kubernetes pod as the agent for this pipeline
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: nodejs
    image: node:18-alpine
    command:
    - sleep
    args:
    - 99d
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command:
    - sleep
    args:
    - 99d
  - name: helm
    image: alpine/helm:3.15.2
    command:
    - sleep
    args:
    - 99d
'''
        }
    }

    environment {
        // Credentials IDs from Jenkins
        DOCKER_CREDS_ID = 'dockerhub-credentials'
        SONAR_TOKEN_ID  = 'sonarqube-token'
        KUBECONFIG_ID   = 'kubernetes-config'

        // Configuration
        DOCKER_IMAGE_NAME = 'edydockers/rs-school-app' // Use the correct image name
        SONAR_HOST_URL    = 'http://sonarqube-sonarqube.sonarqube.svc.cluster.local:9000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            // Run build and test steps inside the nodejs container
            steps {
                container('nodejs') {
                    sh 'npm install'
                    sh 'npm run build'
                    sh 'npm test'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('nodejs') { // Assumes sonar-scanner is installed globally or in package.json
                    withSonarQubeEnv('My SonarQube Server') {
                         sh 'sonar-scanner -Dsonar.projectKey=rs-school-app -Dsonar.sources=src -Dsonar.host.url=${SONAR_HOST_URL} -Dsonar.login=${SONAR_TOKEN_ID}'
                    }
                }
                timeout(time: 1, unit: 'hour') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build & Push Docker Image with Kaniko') {
            steps {
                container('kaniko') {
                    script {
                        def imageTag = "${env.BUILD_NUMBER}"
                        // Use Kaniko to build and push the image.
                        // It uses the Docker credentials mounted by Jenkins.
                        sh '''
                        /kaniko/executor --dockerfile `pwd`/Dockerfile \
                                         --context `pwd` \
                                         --destination "${DOCKER_IMAGE_NAME}:${imageTag}"
                        '''
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('helm') {
                    script {
                        def imageTag = "${env.BUILD_NUMBER}"
                        withKubeconfig(credentialsId: "${KUBECONFIG_ID}") {
                            sh "helm upgrade --install my-react-app ./rs-school-app --set image.tag=${imageTag} --namespace default"
                        }
                    }
                }
            }
        }
    }
}