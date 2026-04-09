# Seed Data

The module ships two SQL seed scripts inside `source/schemas/bookstore/sqlite_create/`:

| File | Purpose | Size |
|------|---------|------|
| `BookStore-CreateSQLiteTables.sql` | DDL — `CREATE TABLE` for every entity | 222 lines |
| `BookStore-SeedData.sql` | Main seed — populates every table with test rows | ~30,000 lines, 76 `INSERT`s |
| `BookStore-SeedData-Extended.sql` | Alternate smaller seed | 135 lines, 11 `INSERT`s |

## Main Seed Breakdown

After running `getSeedDataSQL()` against an empty database you have:

| Entity | Rows | Notes |
|--------|------|-------|
| `Author` | 13 | A mix of well-known novelists so traversal tests read naturally |
| `Book` | 22 | Spread across several genres, publication years, and types |
| `BookAuthorJoin` | 27 | Enough to cover books with multiple co-authors |
| `User` | 8 | Includes admin, employees, and reviewers |
| `Customer` | 1 | Single tenant |
| `BookStore` | 1 | Single store used by sale / inventory / employee records |
| `BookStoreEmployee` | 1 | Single active employee |
| `BookStoreSale` | 1 | Single sample transaction |
| `BookStoreSaleItem` | 1 | Single line item on the sample transaction |
| `Review` | 1 | Single sample review |

The heavy skew toward books and authors is deliberate — graph-traversal tests need meaningful multiplicity on the `Book ↔ BookAuthorJoin ↔ Author` edge to exercise the solver. The other entities exist as one-row representatives so code paths are exercised but the test fixture stays small.

## What Makes This Seed Useful

- **Multiple authors per book, multiple books per author.** You can write queries like "all books by an author matching `Dan Brown%`" that return several rows, not zero or one.
- **Non-trivial foreign-key chains.** A `Review` references a `Book` and a `User`; a `BookStoreSaleItem` references a `BookStoreSale`, a `Book`, and a `BookPrice`. Chains that long give graph-traversal tests something to chew on.
- **Consistent tenant.** Every row has the same `IDCustomer`, which means you can ignore tenancy in most tests without filtering but the filtering code path is still covered.
- **Consistent audit user.** `CreatingIDUser` / `UpdatingIDUser` are set to a known user so tests can verify audit-column behavior.

## Loading the Main Seed

```javascript
const Database = require('better-sqlite3');
const db = new Database(':memory:');

// Create tables first
db.exec(_SampleData.getSQLiteDDL());

// Then populate them
db.exec(_SampleData.getSeedDataSQL());

// Verify
let tmpBookCount = db.prepare('SELECT COUNT(*) as n FROM Book').get();
console.log('Books loaded:', tmpBookCount.n); // → 22
```

The seed isn't idempotent — don't run it twice in a row against the same database. Auto-increment primary keys would collide and the second run would throw. If you need to reset, drop and recreate the tables or use `DELETE FROM <table>` between runs.

## Loading the Extended Seed Instead

The extended seed is in the same directory but exposed only via the filesystem path (there's no dedicated accessor method for it). Read it directly:

```javascript
const libFS = require('fs');
const libPath = require('path');

const tmpExtendedPath = libPath.join(
    _SampleData.getBookstoreSchemaPath(),
    'sqlite_create',
    'BookStore-SeedData-Extended.sql');
const tmpExtendedSQL = libFS.readFileSync(tmpExtendedPath, 'utf8');

db.exec(_SampleData.getSQLiteDDL());
db.exec(tmpExtendedSQL);
```

Use the extended seed when the main seed's ~30K lines are overkill (unit tests that only need a handful of rows, for instance).

## Picking a Subset

The cleanest way to load just specific entities is to filter the seed SQL by table name before executing:

```javascript
function extractSeedForTables(pFullSeedSQL, pTableNames)
{
    let tmpLines = pFullSeedSQL.split('\n');
    let tmpKeep = [];
    let tmpSet = new Set(pTableNames);

    for (let tmpLine of tmpLines)
    {
        let tmpMatch = tmpLine.match(/^INSERT INTO (\w+)/);
        if (tmpMatch && !tmpSet.has(tmpMatch[1]))
        {
            continue;
        }
        tmpKeep.push(tmpLine);
    }
    return tmpKeep.join('\n');
}

// Load only books, authors, and the join table
const tmpSubsetSQL = extractSeedForTables(
    _SampleData.getSeedDataSQL(),
    ['Book', 'Author', 'BookAuthorJoin']);

db.exec(_SampleData.getSQLiteDDL());
db.exec(tmpSubsetSQL);
```

This is a naïve parser (it assumes one `INSERT` per line, which is how the generator formats the seed) but it works reliably because the file was emitted by a tool that always puts statements on single lines.

## Resetting to a Clean State

Between tests, the easiest way to reset is to drop the whole in-memory database and rebuild from scratch:

```javascript
function resetDatabase(pSampleData)
{
    const db = new Database(':memory:');
    db.exec(pSampleData.getSQLiteDDL());
    db.exec(pSampleData.getSeedDataSQL());
    return db;
}
```

Since the database is `:memory:`, this is essentially free — no disk I/O, no teardown, just a fresh database each time.

## Using the Seed With `meadow-provider-offline`

The offline provider doesn't execute raw SQL directly — it uses the meadow DAL to insert records. The idiomatic way to get the seed data into offline mode is to:

1. Parse the seed SQL to extract each entity's records, **or**
2. Load the seed into a temporary sql.js database, query out each entity, then call `seedEntity()` or `injectRecords()` with the resulting arrays

Option 2 is usually cleaner:

```javascript
const initSqlJs = require('sql.js');

initSqlJs().then((SQL) =>
{
    const tmpDB = new SQL.Database();
    tmpDB.exec(_SampleData.getSQLiteDDL());
    tmpDB.exec(_SampleData.getSeedDataSQL());

    // Get every entity into the offline provider
    for (let tmpName of _SampleData.getEntityList())
    {
        let tmpRows = tmpDB.exec(`SELECT * FROM ${tmpName}`)[0];
        if (!tmpRows) continue;

        let tmpRecords = tmpRows.values.map((pRow) =>
        {
            let tmpRec = {};
            tmpRows.columns.forEach((pCol, pIdx) => { tmpRec[pCol] = pRow[pIdx]; });
            return tmpRec;
        });

        tmpOffline.seedEntity(tmpName, tmpRecords);
    }
});
```

See [Using With Meadow](using-with-meadow.md) for the full walkthrough.

## Regenerating the Seed

The seed was hand-crafted alongside the schema and isn't regenerated from a source data set. If you need to change it:

1. Edit `source/schemas/bookstore/sqlite_create/BookStore-SeedData.sql` directly
2. Make sure every `INSERT` sets `IDCustomer` to `1` (the single-tenant convention)
3. Make sure every foreign key references a row that's inserted earlier in the same file
4. Run the test suite — the module's tests validate the seed by loading it into sql.js and checking row counts

## Related

- [Schema Overview](schema.md) — the ER diagram showing which tables the seed populates
- [Entity Reference](entities.md) — per-column detail for interpreting seed rows
- [Using With Meadow](using-with-meadow.md) — integration recipes that depend on the seed
