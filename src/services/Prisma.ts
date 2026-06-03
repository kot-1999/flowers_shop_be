import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client'
import config from 'config';

import logger from './Logger'
import { IConfig } from '../types/config';

/**
 * @class PrismaService
 * @description Wrapper around PrismaClient that:
 * - Initializes Prisma with logging
 * - Attaches custom query methods via $extends
 * - Provides a centralized Prisma instance
 *
 * @property client - Prisma client instance (extended with custom queries)
 *
 * @method getPrismaClient Returns the current Prisma client instance
 */
class PrismaService {
    private client: any
    private dbConfig: IConfig['database']
    /**
     * @constructor
     * @description Initializes Prisma client with logging and event listeners
     */
    constructor(dbConfig: IConfig['database']) {
        this.dbConfig = dbConfig;
        this.client = new PrismaClient({
            adapter: new PrismaPg({
                connectionString: this.dbConfig.postgresURL
            }),
            log: [{
                level: 'warn',
                emit: 'event'
            }, {
                level: 'error',
                emit: 'event'
            },{
                level: 'info',
                emit: 'event'
            }]
        })

        this.client.$on('warn', (e: Prisma.LogEvent) => {
            logger.warn(`[Prisma] ${e.message}`);
        })

        this.client.$on('error', (e: Prisma.LogEvent) => {
            logger.error(`[Prisma] ${e.message}`);
        })

        this.client.$on('info', (e: Prisma.LogEvent) => {
            logger.info(`[Prisma] ${e.message}`);
        })

        logger.info('Prisma client was created')
    }

    // private initSlug() {
    //     this.client
    // }

    /**
     * @method getPrismaClient
     * @description Returns the current Prisma client instance
     *
     * @returns {any} Prisma client (possibly extended)
     */
    public getPrismaClient() {
        return this.client
    }
}

const dbConfig = config.get<IConfig['database']>('database')

const prismaService = new PrismaService(dbConfig)

const prisma = prismaService.getPrismaClient()

export default prisma