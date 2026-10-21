import { Redis } from "@upstash/redis";

/**
 * Capa mínima de almacenamiento.
 * - Con UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN usa Upstash.
 * - Sin esas variables usa un almacenamiento en memoria (solo para probar en local:
 *   se borra al reiniciar el servidor).
 */
export interface KV {
  get<T>(key: string): Promise<T | null>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  set(key: string, value: unknown, opts?: { nx?: boolean; ex?: number }): Promise<boolean>;
  del(...keys: string[]): Promise<void>;
  hset(key: string, field: string, value: unknown): Promise<void>;
  hget<T>(key: string, field: string): Promise<T | null>;
  hgetall<T>(key: string): Promise<Record<string, T>>;
  hdel(key: string, field: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<boolean>;
}

function upstash(): KV {
  const r = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return {
    get: (k) => r.get(k),
    mget: async (keys) => (keys.length ? r.mget(...keys) : []),
    set: async (k, v, o) => {
      const opts: Record<string, unknown> = {};
      if (o?.nx) opts.nx = true;
      if (o?.ex) opts.ex = o.ex;
      const res = await r.set(k, v, opts as never);
      return res === "OK";
    },
    del: async (...keys) => {
      if (keys.length) await r.del(...keys);
    },
    hset: async (k, f, v) => {
      await r.hset(k, { [f]: v });
    },
    hget: (k, f) => r.hget(k, f),
    hgetall: async <T,>(k: string) => ((await r.hgetall<Record<string, T>>(k)) ?? {}) as Record<string, T>,
    hdel: async (k, f) => {
      await r.hdel(k, f);
    },
    sadd: async (k, m) => {
      await r.sadd(k, m);
    },
    srem: async (k, m) => {
      await r.srem(k, m);
    },
    smembers: (k) => r.smembers(k),
    sismember: async (k, m) => (await r.sismember(k, m)) === 1,
  };
}

type Mem = { str: Map<string, string>; hash: Map<string, Map<string, string>>; set: Map<string, Set<string>> };

function memory(): KV {
  const g = globalThis as unknown as { __cornerMem?: Mem };
  const m = (g.__cornerMem ??= { str: new Map(), hash: new Map(), set: new Map() });
  const enc = (v: unknown) => JSON.stringify(v);
  const dec = <T,>(s: string | undefined): T | null => (s === undefined ? null : (JSON.parse(s) as T));
  return {
    get: async (k) => dec(m.str.get(k)),
    mget: async (keys) => keys.map((k) => dec(m.str.get(k))),
    set: async (k, v, o) => {
      if (o?.nx && m.str.has(k)) return false;
      m.str.set(k, enc(v));
      return true;
    },
    del: async (...keys) => {
      for (const k of keys) {
        m.str.delete(k);
        m.hash.delete(k);
        m.set.delete(k);
      }
    },
    hset: async (k, f, v) => {
      if (!m.hash.has(k)) m.hash.set(k, new Map());
      m.hash.get(k)!.set(f, enc(v));
    },
    hget: async (k, f) => dec(m.hash.get(k)?.get(f)),
    hgetall: async <T,>(k: string) => {
      const out: Record<string, T> = {};
      for (const [f, v] of m.hash.get(k) ?? []) out[f] = JSON.parse(v);
      return out;
    },
    hdel: async (k, f) => {
      m.hash.get(k)?.delete(f);
    },
    sadd: async (k, v) => {
      if (!m.set.has(k)) m.set.set(k, new Set());
      m.set.get(k)!.add(v);
    },
    srem: async (k, v) => {
      m.set.get(k)?.delete(v);
    },
    smembers: async (k) => [...(m.set.get(k) ?? [])],
    sismember: async (k, v) => m.set.get(k)?.has(v) ?? false,
  };
}

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
if (!hasUpstash && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
  console.warn("[Córner] Faltan las variables de Upstash: se está usando almacenamiento en memoria. Los datos se pierden al reiniciar.");
}

export const kv: KV = hasUpstash ? upstash() : memory();
export const usingMemory = !hasUpstash;
