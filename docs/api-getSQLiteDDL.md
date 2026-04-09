# getSQLiteDDL

Return the raw `CREATE TABLE` SQL for the bookstore schema as a string. Use this to bootstrap a SQLite database directly (sql.js, better-sqlite3, node-sqlite3, or native SQLite on mobile).

## Signature

```javascript
getSQLiteDDL()
```

**Returns:** `string` — the raw SQL, ~222 lines, covering all 12 entities.

## What's in the DDL

A sequence of `CREATE TABLE` statements, one per entity. Every table gets:

- An `IDENTIFIER INTEGER PRIMARY KEY AUTOINCREMENT` column
- Standard audit columns (`CreateDate`, `CreatingIDUser`, etc.)
- The entity-specific business columns
- Foreign-key columns (as `INTEGER`) — the foreign-key relationship is encoded in column naming, not as `FOREIGN KEY` constraints

Foreign-key constraints are deliberately omitted so the seed data can be loaded in any order without having to topologically sort inserts.

## Code Example: Basic Usage With `better-sqlite3`

```javascript
const Database = require('better-sqlite3');
const db = new Database(':memory:');

db.exec(_SampleData.getSQLiteDDL());

// Tables now exist
let tmpTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tmpTables.map((pT) => pT.name));
// → [ 'Customer', 'User', 'Book', 'BookAuthorJoin', 'Author', 'BookPrice', ... ]
```

## Code Example: Basic Usage With `sql.js`

```javascript
const initSqlJs = require('sql.js');

initSqlJs().then((SQL) =>
{
    const db = new SQL.Database();
    db.exec(_SampleData.getSQLiteDDL());
    console.log('Database initialized');
});
```

## Code Example: Bootstrap + Seed

The typical flow: DDL first, then seed:

```javascript
const Database = require('better-sqlite3');
const db = new Database(':memory:');

db.exec(_SampleData.getSQLiteDDL());
db.exec(_SampleData.getSeedDataSQL());

let tmpBookCount = db.prepare('SELECT COUNT(*) as n FROM Book').get();
console.log('Books:', tmpBookCount.n); // → 22
```

## Code Example: Bootstrap Only (Empty Schema)

If you want the schema structure but not the sample rows, just run the DDL without the seed:

```javascript
const db = new Database(':memory:');
db.exec(_SampleData.getSQLiteDDL());

// Tables exist but are empty — good for writing your own data
```

## Idempotence

The DDL uses `CREATE TABLE IF NOT EXISTS` in some forms but not all. Running it twice against the same database will be a **no-op in most places** and a **silent no-op or error in others**, depending on the specific statements. To be safe, treat the DDL as one-shot and recreate the database if you need to re-run it.

## Foreign Keys

The DDL does **not** declare `FOREIGN KEY` constraints. The foreign-key relationships are implicit in the column names (`IDBook` references `Book.IDBook`) and enforced at the application layer by meadow. If you want the database to enforce referential integrity, either:

1. Add `FOREIGN KEY` clauses to the DDL string after reading it
2. Use `PRAGMA foreign_keys = ON` after loading (has no effect without explicit FK clauses)
3. Add triggers

For the default test-fixture use case, application-layer enforcement is sufficient.

## Errors

Throws if `BookStore-CreateSQLiteTables.sql` is missing from the installed package. In a normal `npm install` this never happens.

## Related

- [getSeedDataSQL](api-getSeedDataSQL.md) — the seed `INSERT` script to run after the DDL
- [Seed Data](seed-data.md) — what the seed populates
- [Schema Overview](schema.md) — ER diagram of the tables this DDL creates
