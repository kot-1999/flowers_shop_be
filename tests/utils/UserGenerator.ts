import { faker } from '@faker-js/faker'
import { User, UserRole } from '@prisma/client'
import dayjs from 'dayjs'

import prisma from '../../src/services/Prisma'

export default class UserGenerator {
    public static generateUser(userData: Partial<User> = {}): Promise<User> {
        return prisma.user.create({ data: UserGenerator.generateData(userData) })
    }

    public static generateData(userData: Partial<User> = {}): User {
        return {
            id: userData.id ?? faker.string.uuid(),
            firstName: userData.firstName ?? faker.person.firstName(),
            lastName: userData.lastName ?? faker.person.lastName(),
            email: userData?.email?.toLowerCase() ?? faker.internet.email().toLowerCase(),
            emailVerified: userData.emailVerified ?? false,
            password: userData.password ?? null,
            role: userData.role ?? UserRole.User,
            googleProfileID: userData.googleProfileID ?? null,
            createdAt: userData.createdAt as Date ?? dayjs().toISOString(),
            updatedAt: userData.updatedAt as Date ?? dayjs().toISOString(),
            deletedAt: userData.deletedAt ?? null
        }
    }
}
