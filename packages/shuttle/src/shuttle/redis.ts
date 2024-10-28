import { Redis, Cluster, RedisOptions } from "ioredis";

export const getRedisClient = (redisUrl: string, redisOpts?: RedisOptions) => {
  const client = new Redis(redisUrl, {
    connectTimeout: 5_000,
    maxRetriesPerRequest: null, // BullMQ requires this to be set to null to prevent auto-retries on failure
    ...redisOpts,
  });
  return client;
};

export class RedisClient {
  public client: Redis | Cluster;

  constructor(client: Redis | Cluster) {
    this.client = client;
  }

  static create(redisUrl: string, redisOpts?: RedisOptions) {
    const client = getRedisClient(redisUrl, redisOpts);
    return new RedisClient(client);
  }

  async setLastProcessedEvent(hubId: string, eventId: number) {
    if (eventId < 0) throw new Error("eventId must be a non-negative integer");

    const key = `hub:${hubId}:last-hub-event-id`;
    if (eventId === 0) {
      await this.client.del(key);
    } else {
      await this.client.set(key, eventId.toString());
    }
  }

  async getLastProcessedEvent(hubId: string) {
    const eventId = await this.client.get(`hub:${hubId}:last-hub-event-id`);
    return eventId ? parseInt(eventId) : 0;
  }

  async clearForTest() {
    await this.client.flushdb(); // Flushes all data in Redis, useful for testing
  }
}
