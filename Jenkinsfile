pipeline {
    agent { label 'worker-agents' }

    tools {
        maven 'maven3'
        jdk 'JDK17_Worker'
    }

    triggers {
        githubPush()
    }

    environment {
        SONARQUBE_TOKEN = credentials('sonarqube-token') // Your Jenkins secret token
    }

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/edymol/rs-school-stars-shine.git', branch: 'main'
            }
        }

        stage('Build') {
            steps {
                sh 'mvn clean install'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQubeServer') {
                    sh "mvn sonar:sonar -Dsonar.login=${SONARQUBE_TOKEN}"
                }
            }
        }
    }
}
