import supertest from 'supertest';

import app from '../../src/app';
import { EncryptionService } from '../../src/services/Encryption';

export async function loginUserAndGetCookie(user: { email: string, password: string } & any): Promise<string> {
    const res = await supertest(app)
        .post('/api/v1/authorization/login')
        .set('Content-Type', 'application/json')
        .send({
            email: user.email,
            password: EncryptionService.encryptAES(user.password)
        })

    if (res.headers['set-cookie']) {
        return res.headers['set-cookie'][0]
    }
    throw new Error('Failed to get session cookie')
}