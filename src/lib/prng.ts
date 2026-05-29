// PRNG determinístico baseado em seed string.
// Garante que a mesma seed sempre produz o mesmo dataset/flags/hashes.

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private rand: () => number;
  constructor(seed: string) {
    const seedGen = xmur3(seed);
    this.rand = mulberry32(seedGen());
  }

  next(): number {
    return this.rand();
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  pickN<T>(arr: readonly T[], n: number): T[] {
    return this.shuffle(arr).slice(0, n);
  }

  shuffle<T>(arr: readonly T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  hexHash(length: number): string {
    const chars = "abcdef0123456789";
    let s = "";
    for (let i = 0; i < length; i++) s += chars[Math.floor(this.next() * chars.length)];
    return s;
  }

  ntlmHash(): string {
    // Simulação de NTLM: 32 chars hex.
    return this.hexHash(32);
  }

  bool(p = 0.5): boolean {
    return this.next() < p;
  }
}

export function shortHashOf(seed: string, length = 4): string {
  const r = new Rng(seed);
  return r.hexHash(length);
}
