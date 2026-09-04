/**
 * A D1 stand-in for the tests, backed by real SQLite.
 *
 * ── Why not a mock ────────────────────────────────────────────────────────
 * The things worth testing here are SQL semantics, not JavaScript: whether
 * `INSERT OR IGNORE` really makes a redelivered webhook a no-op, whether
 * `COALESCE` really protects the original purchase date, whether the UPDATE
 * that redeems a sign-in link really lets exactly one of two racing clicks
 * win. A hand-written fake would answer those questions by restating whatever
 * the author believed, which is the same as not testing them.
 *
 * Node ships SQLite, and D1 *is* SQLite, so the tests run the real statements
 * against a real engine over the real migrations. What this file provides is
 * only the shape of the D1 API on top of it.
 *
 * Not production code and never bundled — the Worker talks to the D1 binding.
 */
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

type Row = Record<string, unknown>;

/** D1 hands back `changes` and `last_row_id` under `meta`. */
interface RunResult {
  success: true;
  meta: { changes: number; last_row_id: number };
}

class Statement {
  // Written out rather than declared as constructor parameter properties:
  // `node --experimental-strip-types` removes types without transforming, and
  // parameter properties are the one TypeScript feature that needs a transform.
  private readonly db: DatabaseSync;
  private readonly sql: string;
  private readonly params: unknown[];

  constructor(db: DatabaseSync, sql: string, params: unknown[] = []) {
    this.db = db;
    this.sql = sql;
    this.params = params;
  }

  bind(...params: unknown[]): Statement {
    return new Statement(this.db, this.sql, params);
  }

  private normalised(): unknown[] {
    // node:sqlite rejects undefined and booleans; D1 accepts null and coerces.
    return this.params.map((p) => {
      if (p === undefined) return null;
      if (typeof p === 'boolean') return p ? 1 : 0;
      return p;
    });
  }

  async first<T = Row>(): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.normalised() as never[]));
    return (row as T) ?? null;
  }

  async all<T = Row>(): Promise<{ results: T[] }> {
    const rows = this.db.prepare(this.sql).all(...(this.normalised() as never[]));
    return { results: rows as T[] };
  }

  async run(): Promise<RunResult> {
    const result = this.db.prepare(this.sql).run(...(this.normalised() as never[]));
    return {
      success: true,
      meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) },
    };
  }
}

/**
 * `RETURNING` makes a statement a query even though it is a write, and
 * node:sqlite refuses to `run()` one. `bumpSessionVersion` uses it, so `first()`
 * has to be the path that executes it — which it is above.
 */
export class TestD1 {
  private readonly db = new DatabaseSync(':memory:');

  constructor(migrationsDir: string) {
    this.db.exec('PRAGMA foreign_keys = ON;');
    const files = readdirSync(migrationsDir).filter((f: string) => f.endsWith('.sql')).sort();
    for (const file of files) {
      this.db.exec(readFileSync(path.join(migrationsDir, file), 'utf8'));
    }
  }

  prepare(sql: string): Statement {
    return new Statement(this.db, sql);
  }

  /**
   * D1 batches are atomic. Wrapping in a transaction is what makes the tests
   * exercise the same all-or-nothing behaviour the Worker relies on when it
   * writes a purchase row and the entitlement together.
   */
  async batch<T = Row>(statements: Statement[]): Promise<{ results: T[] }[]> {
    this.db.exec('BEGIN');
    try {
      const out: { results: T[] }[] = [];
      for (const statement of statements) {
        await statement.run();
        out.push({ results: [] });
      }
      this.db.exec('COMMIT');
      return out;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /** Test-only escape hatch for asserting on state the app has no reader for. */
  query<T = Row>(sql: string, ...params: unknown[]): T[] {
    return this.db.prepare(sql).all(...(params as never[])) as T[];
  }
}

/** The Worker's types want a D1Database; structurally this is one. */
export function testDatabase(migrationsDir: string): TestD1 {
  return new TestD1(migrationsDir);
}
