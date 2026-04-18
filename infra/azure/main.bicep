// FinFlow — Azure Container Apps infrastructure
// Deploy with:
//   az deployment group create \
//     --resource-group rg-finflow-prod \
//     --template-file infra/azure/main.bicep \
//     --parameters @infra/azure/main.parameters.json

@description('Deployment environment')
@allowed(['prod', 'staging'])
param environment string = 'prod'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Container registry login server (e.g. finflowacr.azurecr.io)')
param acrLoginServer string

@description('Short SHA of the image tag to deploy')
param imageTag string = 'latest'

@description('PostgreSQL administrator password')
@secure()
param postgresAdminPassword string

@description('JWT secret (min 32 characters)')
@secure()
param jwtSecret string

// ─── Variables ──────────────────────────────────────────────────────────────

var prefix = 'finflow-${environment}'
var tags = {
  project: 'finflow'
  environment: environment
  managedBy: 'bicep'
}

// ─── Log Analytics Workspace ────────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${prefix}-logs'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ─── Container Apps Environment ─────────────────────────────────────────────

resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${prefix}-env'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ─── Azure Container Registry ────────────────────────────────────────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: replace('${prefix}acr', '-', '')
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// ─── PostgreSQL Flexible Server ──────────────────────────────────────────────

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: '${prefix}-postgres'
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: 'finflow'
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource accountsDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgres
  name: 'accounts_db'
}

resource transactionsDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgres
  name: 'transactions_db'
}

resource loansDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgres
  name: 'loans_db'
}

resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: postgres
  name: 'allow-azure-services'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ─── Shared secrets / connection strings ────────────────────────────────────

var postgresHost = postgres.properties.fullyQualifiedDomainName
var accountsDbUrl = 'postgresql://finflow:${postgresAdminPassword}@${postgresHost}/accounts_db?sslmode=require'
var transactionsDbUrl = 'postgresql://finflow:${postgresAdminPassword}@${postgresHost}/transactions_db?sslmode=require'
var loansDbUrl = 'postgresql://finflow:${postgresAdminPassword}@${postgresHost}/loans_db?sslmode=require'

// ─── Accounts Service ────────────────────────────────────────────────────────

resource accountsService 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'accounts-service'
  location: location
  tags: tags
  properties: {
    environmentId: containerEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: 3001
      }
      registries: [
        {
          server: acrLoginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'database-url'
          value: accountsDbUrl
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'accounts-service'
          image: '${acrLoginServer}/accounts-service:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'PORT'
              value: '3001'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3001
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// ─── Transactions Service ─────────────────────────────────────────────────────

resource transactionsService 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'transactions-service'
  location: location
  tags: tags
  properties: {
    environmentId: containerEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: 3002
      }
      registries: [
        {
          server: acrLoginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'database-url'
          value: transactionsDbUrl
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'transactions-service'
          image: '${acrLoginServer}/transactions-service:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'PORT'
              value: '3002'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3002
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// ─── Loans Service ───────────────────────────────────────────────────────────

resource loansService 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'loans-service'
  location: location
  tags: tags
  properties: {
    environmentId: containerEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: 3003
      }
      registries: [
        {
          server: acrLoginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'database-url'
          value: loansDbUrl
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'loans-service'
          image: '${acrLoginServer}/loans-service:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'PORT'
              value: '3003'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3003
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// ─── BFF ─────────────────────────────────────────────────────────────────────

resource bff 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'bff'
  location: location
  tags: tags
  properties: {
    environmentId: containerEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: 4000
        corsPolicy: {
          allowedOrigins: [
            'https://${web.properties.configuration.ingress.fqdn}'
          ]
          allowCredentials: true
        }
      }
      registries: [
        {
          server: acrLoginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'bff'
          image: '${acrLoginServer}/bff:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'JWT_EXPIRY'
              value: '8h'
            }
            {
              name: 'ACCOUNTS_SERVICE_URL'
              value: 'http://accounts-service'
            }
            {
              name: 'TRANSACTIONS_SERVICE_URL'
              value: 'http://transactions-service'
            }
            {
              name: 'LOANS_SERVICE_URL'
              value: 'http://loans-service'
            }
            {
              name: 'FRONTEND_URL'
              value: 'https://${web.properties.configuration.ingress.fqdn}'
            }
            {
              name: 'PORT'
              value: '4000'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 4000
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
}

// ─── Web (Next.js) ───────────────────────────────────────────────────────────

resource web 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'web'
  location: location
  tags: tags
  properties: {
    environmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
      registries: [
        {
          server: acrLoginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: '${acrLoginServer}/web:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NEXT_PUBLIC_BFF_URL'
              value: 'https://${bff.properties.configuration.ingress.fqdn}/graphql'
            }
            {
              name: 'PORT'
              value: '3000'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 3000
              }
              initialDelaySeconds: 15
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Public URL for the web frontend')
output webUrl string = 'https://${web.properties.configuration.ingress.fqdn}'

@description('Internal URL for the BFF (GraphQL endpoint)')
output bffUrl string = 'https://${bff.properties.configuration.ingress.fqdn}/graphql'

@description('Container registry login server')
output acrLoginServer string = acr.properties.loginServer

@description('Log Analytics workspace ID')
output logAnalyticsWorkspaceId string = logAnalytics.id
