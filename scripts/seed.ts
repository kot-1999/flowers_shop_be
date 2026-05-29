import { UserRole } from '@prisma/client';
import config from 'config';

import { EncryptionService } from '../src/services/Encryption';
import logger from '../src/services/Logger';
import prisma from '../src/services/Prisma';
import { IConfig } from '../src/types/config';
import UserGenerator from '../tests/utils/UserGenerator';

const seedConfig = config.get<IConfig['seed']>('seed')

async function seed() {
    const users = [];

    // Generate plain objects
    for (let i = 0; i < seedConfig.grain; i++) {
        if (i % 3 === 0) {
            users.push(UserGenerator.generateData({ 
                password: EncryptionService.hashSHA256('Test123'), 
                role: UserRole.Admin
            }))
        } else if (i % 2 === 0) {
            users.push(UserGenerator.generateData({
                password: EncryptionService.hashSHA256('Test123'),
                role: UserRole.User
            }))
        } else {
            users.push(UserGenerator.generateData({
                role: UserRole.NotRegistered
            }))
        }
    }

    const promises: Promise<any>[] = [];
    const seededTables: string[] = [];

    if ((await prisma.user.count()) === 0) {
        promises.push(prisma.user.createMany({
            data: users,
            skipDuplicates: true
        }));
        seededTables.push('users');
    }

    await Promise.all(promises);
     
    logger.info(`Database was seeded with ${seededTables.length} table(s)${seededTables.length > 0 ? ': ' + seededTables.join(', ') : '.'}`);
}

seed().catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
});

export default seed;