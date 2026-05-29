import { EncryptionService } from '../src/services/Encryption';
import prisma from '../src/services/Prisma';
import UserGenerator from '../tests/utils/UserGenerator';

async function seed() {
    const users = [];

    // Generate plain objects
    for (let i = 0; i < 10; i++) {
        users.push(UserGenerator.generateData({ password: EncryptionService.hashSHA256('Test123') }));   // must return plain object
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

    // eslint-disable-next-line
    console.info(`Database was seeded with ${seededTables.length} table(s)${seededTables.length > 0 ? ': ' + seededTables.join(', ') : '.'}`);
}

seed().catch((error) => {
    // eslint-disable-next-line
    console.error('Seeding failed:', error);
    process.exit(1);
});

export default seed;