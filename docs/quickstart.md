# Quick Start

Load the bookstore schema into a Fable app and run a query against it in under three minutes.

## 1. Install

```bash
npm install retold-sample-data fable
```

## 2. Instantiate the Service

```javascript
const libFable = require('fable');
const libRetoldSampleData = require('retold-sample-data');

const _Fable = new libFable();
_Fable.serviceManager.addServiceType('RetoldSampleData', libRetoldSampleData);

let _SampleData = _Fable.serviceManager.instantiateServiceProvider('RetoldSampleData');
```

No options — the service is stateless and reads from its bundled schema directory.

## 3. Inspect What's Available

```javascript
console.log('Entities:', _SampleData.getEntityList());
// → [ 'Customer', 'User', 'Book', 'BookAuthorJoin', 'Author', 'BookPrice',
//     'BookStore', 'BookStoreInventory', 'BookStoreEmployee',
//     'BookStoreSale', 'BookStoreSaleItem', 'Review' ]

console.log('Schema path:', _SampleData.getBookstoreSchemaPath());
// → /path/to/node_modules/retold-sample-data/source/schemas/bookstore
```

## 4. Pick Your Load Format

The module ships three parallel representations of the same data. You pick the one that matches the downstream consumer:

| Consumer | Method | Returns |
|----------|--------|---------|
| `meadow-graph-client`, `meadow-provider-offline` (combined form) | `getMeadowModel()` | Parsed `MeadowModel.json` — one object with `Tables: { ... }` |
| `meadow.loadFromPackageObject()` (per-entity form) | `getMeadowSchema('Book')` | Parsed `MeadowSchemaBook.json` — ready for the meadow DAL |
| `retold-data-service` | `getSchema()` | Parsed `Schema.json` |
| Raw SQLite bootstrap | `getSQLiteDDL()` + `getSeedDataSQL()` | Two raw SQL strings |

## 5. Use With `meadow-graph-client`

```javascript
const libMeadowGraphClient = require('meadow-graph-client');

_Fable.serviceManager.addServiceType('MeadowGraphClient', libMeadowGraphClient);

let _GraphClient = _Fable.serviceManager.instantiateServiceProvider('MeadowGraphClient',
    {
        DataModel: _SampleData.getMeadowModel()
    });

// Solve a path from Book to Author (requires traversing BookAuthorJoin)
let tmpSolution = _GraphClient.solveGraphConnections('Book', 'Author');
console.log(tmpSolution.OptimalSolutionPath.EdgeAddress);
// → 'Book-->BookAuthorJoin-->Author'
```

The graph client sees the entity connections right away and can resolve filters like `{Entity: 'Book', Filter: {'Author.Name': 'Dan Brown'}}` without any extra configuration.

## 6. Use With `meadow-provider-offline`

```javascript
const libMeadowProviderOffline = require('meadow-provider-offline');

_Fable.serviceManager.addServiceType('MeadowProviderOffline', libMeadowProviderOffline);

let _Offline = _Fable.serviceManager.instantiateServiceProvider('MeadowProviderOffline',
    {
        SessionDataSource: 'None',
        DefaultSessionObject: { UserID: 1, UserRole: 'Administrator', UserRoleIndex: 255, LoggedIn: true }
    });

_Offline.initializeAsync((pError) =>
{
    if (pError) throw pError;

    // Register every entity from the sample data
    let tmpEntitySchemas = _SampleData.getEntityList().map(
        (pName) => _SampleData.getMeadowSchema(pName));

    _Offline.addEntities(tmpEntitySchemas, () =>
    {
        _Offline.connect(_Fable.RestClient);
        console.log('Offline provider ready with', _Offline.entityNames.length, 'entities');
    });
});
```

Every meadow REST call now routes through an in-browser SQLite database populated with the bookstore schema.

## 7. Use With Raw SQLite

If you're bootstrapping a raw SQLite database (sql.js, better-sqlite3, native SQLite on mobile) directly:

```javascript
const Database = require('better-sqlite3');
const db = new Database(':memory:');

db.exec(_SampleData.getSQLiteDDL());
db.exec(_SampleData.getSeedDataSQL());

// Now query directly
let tmpBooks = db.prepare('SELECT IDBook, Title FROM Book').all();
console.log(tmpBooks.slice(0, 5));
```

The DDL is idempotent-ish (uses `CREATE TABLE IF NOT EXISTS` in some forms) but the seed SQL is not — don't run it twice against the same database or you'll get duplicate-key errors on the AutoIdentity columns.

## 8. What's In The Seed Data

After running the main seed (`getSeedDataSQL()`) you have:

| Entity | Rows |
|--------|------|
| Author | 13 |
| Book | 22 |
| BookAuthorJoin | 27 |
| User | 8 |
| Customer | 1 |
| BookStore | 1 |
| BookStoreEmployee | 1 |
| BookStoreSale | 1 |
| BookStoreSaleItem | 1 |
| Review | 1 |

Plenty for running graph-traversal tests, exercising dirty-tracking flows, or screenshotting a working UI with realistic data. See [Seed Data](seed-data.md) for the full breakdown.

## What to Explore Next

- [Schema Overview](schema.md) — full entity-relationship Mermaid diagram and design notes
- [Entity Reference](entities.md) — every column on every table
- [Seed Data](seed-data.md) — what's in the seed and how to pick a subset
- [Using With Meadow](using-with-meadow.md) — end-to-end integration recipes
- [API Reference](api-reference.md) — per-method pages for every public function
