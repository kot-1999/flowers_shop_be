import { UserRole } from '@prisma/client';
import config from 'config';

import * as seedData from './seedData';
import { EncryptionService } from '../src/services/Encryption';
import logger from '../src/services/Logger';
import prisma from '../src/services/Prisma';
import { IConfig } from '../src/types/config';
import CategoryGenerator from '../tests/utils/CategoryGenerator';
import UserGenerator from '../tests/utils/UserGenerator';

const seedConfig = config.get<IConfig['seed']>('seed')

async function seed() {
    const users = [];
    const categories = []

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

    for (const category of seedData.categories) {
        categories.push(CategoryGenerator.generateData(category))
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

    if ((await prisma.category.count()) === 0) {
        promises.push(Promise.all(categories.map((category) =>
            prisma.category.create({
                data: {
                    ...category,
                    name: {
                        create: category.name
                    },
                    description: {
                        create: category.description
                    }
                }
            }))))

        seededTables.push('categories')
    }

    await Promise.all(promises);
     
    logger.info(`Database was seeded with ${seededTables.length} table(s)${seededTables.length > 0 ? ': ' + seededTables.join(', ') : '.'}`);
}

seed().catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
});

export default seed;