import { redis } from './redis';

export async function clearUserCache(userId: string) {
  await redis.del(`user:${userId}`);
}

export async function clearAuthCache(email: string) {
  await redis.del(`auth:${email}`);
}
