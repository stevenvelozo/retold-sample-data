# getSeedDataSQL

Return the raw `INSERT` SQL for the bookstore seed data as a string. Run this after `getSQLiteDDL()` to populate a database with the full sample data set.

## Signature

```javascript
getSeedDataSQL()
```

**Returns:** `string` — the raw SQL, ~30,000 lines, 76 `INSERT` statements across 10 tables.

## What's in the Seed

| Entity | Rows Inserted |
|--------|---------------|
| `Author` | 13 |
| `Book` | 22 |
| `BookAuthorJoin` | 27 |
| `User` | 8 |
| `Customer` | 1 |
| `BookStore` | 1 |
| `BookStoreEmployee` | 1 |
| `BookStoreSale` | 1 |
| `BookStoreSaleItem` | 1 |
| `Review` | 1 |

See [Seed Data](seed-data.md) for a detailed breakdown.

## Code Example: Full Bootstrap

```javascript
const Database = require('better-sqlite3');
const db = new Database(':memory:');

// 1. Create the tables
db.exec(_SampleData.getSQLiteDDL());

// 2. Insert the seed data
db.exec(_SampleData.getSeedDataSQL());

// 3. Query
let tmpBooks = db.prepare('SELECT IDBook, Title, Genre FROM Book').all();
console.log('First 3 books:', tmpBooks.slice(0, 3));
```

## Code Example: With `sql.js`

```javascript
const initSqlJs = require('sql.js');

initSqlJs().then((SQL) =>
{
    const db = new SQL.Database();
    db.exec(_SampleData.getSQLiteDDL());
    db.exec(_SampleData.getSeedDataSQL());

    let tmpResult = db.exec('SELECT COUNT(*) FROM BookAuthorJoin');
    console.log('Book-author pairings:', tmpResult[0].values[0][0]);  // → 27
});
```

## Code Example: Reset Between Tests

```javascript
function freshDB(pSampleData)
{
    const db = new Database(':memory:');
    db.exec(pSampleData.getSQLiteDDL());
    db.exec(pSampleData.getSeedDataSQL());
    return db;
}

// In each test:
let db = freshDB(_SampleData);
// ... run test ...
db.close();
```

In-memory databases are free to throw away, so this pattern is fast and reliable.

## Non-Idempotence

**Do not run the seed twice against the same database.** The `INSERT` statements use literal primary-key values, so a second run will hit `UNIQUE constraint failed` errors on the AutoIdentity columns. If you need to reset, drop and recreate the tables or drop the whole in-memory database.

## Loading Just Specific Entities

The seed is a single concatenated SQL string. To load only specific entities, filter by table name before executing:

```javascript
function seedForTables(pFullSeedSQL, pTableNames)
{
    let tmpSet = new Set(pTableNames);
    return pFullSeedSQL.split('\n')
        .filter((pLine) =>
        {
            let tmpMatch = pLine.match(/^INSERT INTO (\w+)/);
            return !tmpMatch || tmpSet.has(tmpMatch[1]);
        })
        .join('\n');
}

// Load only the book / author / join tables
db.exec(_SampleData.getSQLiteDDL());
db.exec(seedForTables(
    _SampleData.getSeedDataSQL(),
    ['Book', 'Author', 'BookAuthorJoin']));
```

The parser is naïve (it assumes one `INSERT` per line) but works reliably because the seed file is generated that way.

## Alternate Extended Seed

The module also ships a smaller alternate seed at `BookStore-SeedData-Extended.sql` (11 `INSERT`s). It doesn't have a dedicated accessor — use `getBookstoreSchemaPath()` plus raw `fs.readFileSync`:

```javascript
const libFS = require('fs');
const libPath = require('path');

let tmpExtendedSQL = libFS.readFileSync(
    libPath.join(_SampleData.getBookstoreSchemaPath(), 'sqlite_create', 'BookStore-SeedData-Extended.sql'),
    'utf8');

db.exec(_SampleData.getSQLiteDDL());
db.exec(tmpExtendedSQL);
```

## Feeding Into `meadow-provider-offline`

`meadow-provider-offline` doesn't execute raw SQL — it expects records as JavaScript objects. To get the seed data into offline mode, load it into a temporary sql.js database first, then query out each entity:

```javascript
const initSqlJs = require('sql.js');

initSqlJs().then((SQL) =>
{
    const tmp = new SQL.Database();
    tmp.exec(_SampleData.getSQLiteDDL());
    tmp.exec(_SampleData.getSeedDataSQL());

    for (let tmpName of _SampleData.getEntityList())
    {
        let tmpResult = tmp.exec(`SELECT * FROM ${tmpName}`);
        if (!tmpResult.length) continue;

        let tmpCols = tmpResult[0].columns;
        let tmpRecords = tmpResult[0].values.map((pRow) =>
        {
            let tmpRec = {};
            tmpCols.forEach((pCol, pIdx) => { tmpRec[pCol] = pRow[pIdx]; });
            return tmpRec;
        });

        _Offline.seedEntity(tmpName, tmpRecords);
    }
});
```

See [Using With Meadow § Recipe 3](using-with-meadow.md) for the full pattern.

## Errors

Throws if `BookStore-SeedData.sql` is missing from the installed package. Never happens in normal use.

## Related

- [getSQLiteDDL](api-getSQLiteDDL.md) — run this first to create the tables
- [Seed Data](seed-data.md) — what each `INSERT` populates
- [Using With Meadow](using-with-meadow.md) — integration recipes that use the seed
