import { PrismaClient } from '@prisma/client'
import { createMockPrisma } from './mockStore'

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
  isDbUnavailable: boolean | undefined
}

const rawPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

const mockPrisma = createMockPrisma()

function isConnectionError(err: any): boolean {
  if (!err) return false
  const msg = (err.message || err.toString() || '').toLowerCase()
  return (
    err.name === 'PrismaClientInitializationError' ||
    err.name?.includes('Initialization') ||
    msg.includes("can't reach database server") ||
    msg.includes('connection refused') ||
    msg.includes('econnrefused') ||
    msg.includes('environment variable not found: database_url') ||
    msg.includes('database_url') ||
    msg.includes('failed to connect') ||
    msg.includes('validation error count')
  )
}

function createFallbackProxy(target: any) {
  return new Proxy(target, {
    get(obj, modelName: string) {
      if (modelName === '$connect' || modelName === '$disconnect') {
        return () => Promise.resolve()
      }

      const mockModel = (mockPrisma as any)[modelName]

      return new Proxy(obj[modelName] || {}, {
        get(modelTarget, methodName: string) {
          return async (...args: any[]) => {
            if (globalForPrisma.isDbUnavailable) {
              if (mockModel && typeof mockModel[methodName] === 'function') {
                return mockModel[methodName](...args)
              }
            }

            try {
              if (typeof modelTarget[methodName] === 'function') {
                return await modelTarget[methodName](...args)
              }
            } catch (err: any) {
              if (isConnectionError(err)) {
                globalForPrisma.isDbUnavailable = true
                if (mockModel && typeof mockModel[methodName] === 'function') {
                  return mockModel[methodName](...args)
                }
              }
              throw err
            }

            if (mockModel && typeof mockModel[methodName] === 'function') {
              return mockModel[methodName](...args)
            }
          }
        },
      })
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createFallbackProxy(rawPrisma)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
