# Using With Meadow

End-to-end recipes for loading the bookstore schema into the three downstream consumers: `meadow` (raw DAL), `meadow-graph-client` (filter-and-traverse queries), and `meadow-provider-offline` (browser-side offline mode). Each recipe is self-contained — pick the one that matches your use case and copy the whole thing.

## Recipe 1: Raw Meadow DAL

When you want to use meadow directly against a sql.js or `better-sqlite3` database, loading one entity at a time via `loadFromPackageObject()`:

```javascript
const libFable = require('fable');
const libMeadow = require('meadow');
const libRetoldSampleData = require('retold-sample-data');
const Database = require('better-sqlite3');

const _Fable = new libFable();
_Fable.serviceManager.addServiceType('RetoldSampleData', libRetoldSampleData);
let _SampleData = _Fable.serviceManager.instantiateServiceProvider('RetoldSampleData');

// Boot a SQLite database and populate it
const db = new Database(':memory:');
db.exec(_SampleData.getSQLiteDDL());
db.exec(_SampleData.getSeedDataSQL());

// Load the Book DAL
let tmpBookMeadow = libMeadow.new(_Fable);
let tmpBookDAL = tmpBookMeadow.loadFromPackageObject(_SampleData.getMeadowSchema('Book'));
tmpBookDAL.setProvider('SQLiteNode');    // or whatever your provider is
tmpBookDAL.setIDUser(1);

// Read books via meadow
tmpBookDAL.doReads('FBV~Genre~LK~Fiction', 0, 10,
    (pError, pQuery, pRecords) =>
    {
        console.log('Fiction books:', pRecords.length);
    });
```

The per-entity loading pattern is a bit verbose if you want everything — just loop:

```javascript
let tmpDALs = {};
for (let tmpName of _SampleData.getEntityList())
{
    let tmpMeadow = libMeadow.new(_Fable);
    let tmpDAL = tmpMeadow.loadFromPackageObject(_SampleData.getMeadowSchema(tmpName));
    tmpDAL.setProvider('SQLiteNode');
    tmpDAL.setIDUser(1);
    tmpDALs[tmpName] = tmpDAL;
}

// Use them
tmpDALs.Book.doReads('', 0, 100, (pError, pQuery, pBooks) => { /* ... */ });
tmpDALs.Author.doRead(1, (pError, pQuery, pAuthor) => { /* ... */ });
```

## Recipe 2: `meadow-graph-client`

When you want to run `{Entity, Filter}` queries with automatic graph traversal:

```javascript
const libFable = require('fable');
const libMeadowGraphClient = require('meadow-graph-client');
const libRetoldSampleData = require('retold-sample-data');

const _Fable = new libFable();
_Fable.serviceManager.addServiceType('RetoldSampleData', libRetoldSampleData);
_Fable.serviceManager.addServiceType('MeadowGraphClient', libMeadowGraphClient);

let _SampleData = _Fable.serviceManager.instantiateServiceProvider('RetoldSampleData');

// One-shot: hand the combined model to the graph client
let _GraphClient = _Fable.serviceManager.instantiateServiceProvider('MeadowGraphClient',
    {
        DataModel: _SampleData.getMeadowModel()
    });

// Solve a path from Book to Author
let tmpSolution = _GraphClient.solveGraphConnections('Book', 'Author');
console.log(tmpSolution.OptimalSolutionPath.EdgeAddress);
// → 'Book-->BookAuthorJoin-->Author'

// Run an actual query — "books by author with IDAuthor = 107"
_GraphClient.get(
    {
        Entity: 'Book',
        Filter:
        {
            'Author.IDAuthor': 107
        }
    },
    (pError, pCompiledGraphRequest) =>
    {
        if (pError) return console.error(pError);
        console.log('Required entities:', pCompiledGraphRequest.ParsedFilter.RequiredEntities);
        // → ['Book', 'Author']
    });
```

### Graph Traversal Test Cases That Work Out of the Box

Thanks to the seed data's shape, these queries all return meaningful results:

| Query | What the Solver Does |
|-------|----------------------|
| `{Entity: 'Book', Filter: {'Author.Name': 'Dan Brown'}}` | Walks `Book → BookAuthorJoin → Author` |
| `{Entity: 'Author', Filter: {'Book.Genre': 'Mystery'}}` | Walks `Author → BookAuthorJoin → Book` |
| `{Entity: 'Book', Filter: {'BookPrice.Discountable': true}}` | Walks `Book → BookPrice` (direct incoming) |
| `{Entity: 'BookStoreSale', Filter: {'Book.Title': 'The Da Vinci Code'}}` | Walks `BookStoreSale → BookStoreSaleItem → Book` |
| `{Entity: 'Review', Filter: {'Book.Genre': 'Fiction'}}` | Walks `Review → Book` |

The `StockingAssociate` column on `BookStoreInventory` is the one case where automatic traversal fails — see [Schema Overview § Design Decisions](schema.md#design-decisions-worth-knowing). To get the solver to pick that path use a hint:

```javascript
_GraphClient.get(
    {
        Entity: 'BookStoreInventory',
        Filter: { 'User.LoginID': 'alice' },
        Hints: ['User']
    },
    (pError, pResult) => { /* ... */ });
```

Or, preferably, a manual path in the constructor options. See [meadow-graph-client's hints doc](https://github.com/stevenvelozo/meadow-graph-client/blob/master/docs/hints-and-manual-paths.md).

## Recipe 3: `meadow-provider-offline`

When you want the offline provider to intercept meadow REST calls and serve them from an in-browser SQLite database:

```javascript
const libFable = require('fable');
const libMeadowProviderOffline = require('meadow-provider-offline');
const libRetoldSampleData = require('retold-sample-data');

const _Fable = new libFable(
    {
        Product: 'BookstoreOfflineDemo',
        ProductVersion: '1.0.0'
    });

_Fable.serviceManager.addServiceType('RetoldSampleData', libRetoldSampleData);
_Fable.serviceManager.addServiceType('MeadowProviderOffline', libMeadowProviderOffline);

let _SampleData = _Fable.serviceManager.instantiateServiceProvider('RetoldSampleData');

let _Offline = _Fable.serviceManager.instantiateServiceProvider('MeadowProviderOffline',
    {
        SessionDataSource: 'None',
        DefaultSessionObject:
        {
            UserID: 1,
            UserRole: 'Administrator',
            UserRoleIndex: 255,
            LoggedIn: true
        }
    });

_Offline.initializeAsync((pError) =>
{
    if (pError) throw pError;

    // Register every entity at once
    let tmpSchemas = _SampleData.getEntityList().map(
        (pName) => _SampleData.getMeadowSchema(pName));

    _Offline.addEntities(tmpSchemas, (pAddError) =>
    {
        if (pAddError) throw pAddError;

        // Connect the interceptor
        _Offline.connect(_Fable.RestClient);

        // Load the seed data into offline mode
        seedOfflineFromSQL(_Offline, _SampleData, () =>
        {
            console.log('Offline mode ready with full bookstore seed');

            // Now any meadow REST call routes through SQLite, not HTTP
            _Fable.RestClient.getJSON('/1.0/Books/0/10',
                (pError, pResponse, pBooks) =>
                {
                    console.log('Offline books:', pBooks.length);
                });
        });
    });
});

// Helper: bootstrap sql.js separately, then push records to the offline provider
function seedOfflineFromSQL(pOffline, pSampleData, fCallback)
{
    const initSqlJs = require('sql.js');
    initSqlJs().then((SQL) =>
    {
        let tmpBootstrap = new SQL.Database();
        tmpBootstrap.exec(pSampleData.getSQLiteDDL());
        tmpBootstrap.exec(pSampleData.getSeedDataSQL());

        for (let tmpName of pSampleData.getEntityList())
        {
            let tmpResult = tmpBootstrap.exec(`SELECT * FROM ${tmpName}`);
            if (!tmpResult.length) continue;

            let tmpCols = tmpResult[0].columns;
            let tmpRecords = tmpResult[0].values.map((pRow) =>
            {
                let tmpRec = {};
                tmpCols.forEach((pCol, pIdx) => { tmpRec[pCol] = pRow[pIdx]; });
                return tmpRec;
            });

            pOffline.seedEntity(tmpName, tmpRecords);
        }

        tmpBootstrap.close();
        return fCallback();
    });
}
```

After this runs, your application code can call `_Fable.RestClient.getJSON('/1.0/Books/0/10', ...)` and the request never touches the network — it's routed through the offline provider's in-process Orator IPC layer and served from SQLite.

## Recipe 4: Combined Stack — Graph Client + Offline Provider + Sample Data

All three working together. This is what `retold-harness` does for its offline test mode:

```javascript
const libFable = require('fable');
const libMeadowGraphClient = require('meadow-graph-client');
const libMeadowProviderOffline = require('meadow-provider-offline');
const libRetoldSampleData = require('retold-sample-data');

const _Fable = new libFable();

_Fable.serviceManager.addServiceType('RetoldSampleData', libRetoldSampleData);
_Fable.serviceManager.addServiceType('MeadowProviderOffline', libMeadowProviderOffline);
_Fable.serviceManager.addServiceType('MeadowGraphClient', libMeadowGraphClient);

let _SampleData = _Fable.serviceManager.instantiateServiceProvider('RetoldSampleData');

let _Offline = _Fable.serviceManager.instantiateServiceProvider('MeadowProviderOffline', {
    SessionDataSource: 'None',
    DefaultSessionObject: { UserID: 1, UserRole: 'Administrator', UserRoleIndex: 255, LoggedIn: true }
});

// Graph client gets the combined model directly
let _GraphClient = _Fable.serviceManager.instantiateServiceProvider('MeadowGraphClient', {
    DataModel: _SampleData.getMeadowModel()
});

_Offline.initializeAsync(() =>
{
    // Register entities
    _Offline.addEntities(
        _SampleData.getEntityList().map((pName) => _SampleData.getMeadowSchema(pName)),
        () =>
        {
            _Offline.connect(_Fable.RestClient);
            // Seed data loading omitted for brevity — same as Recipe 3

            // Now the graph client can compile queries against the same schema
            // the offline provider serves; when the graph client's data request
            // goes out via RestClient, it's caught by the offline interceptor
            // and served from SQLite.
            _GraphClient.get(
                {
                    Entity: 'Book',
                    Filter: { 'Author.Name': 'Vonnegut' }
                },
                (pError, pResult) =>
                {
                    console.log('Vonnegut books from offline cache:', pResult);
                });
        });
});
```

This setup is specifically designed for writing graph-traversal tests that don't need a running retold-harness server. All the query logic that would run against a real meadow-endpoints API runs in-process, with the sample data providing deterministic results.

## Using Just the Raw Schema

If you're not using meadow at all and just want the bookstore DDL as a fixture for your own code:

```javascript
const libRetoldSampleData = require('retold-sample-data');

// The service can be instantiated without fable for simple read-only use
const _SampleData = new libRetoldSampleData({}, {});

console.log(_SampleData.getSQLiteDDL());         // the raw DDL
console.log(_SampleData.getSeedDataSQL());       // the raw seed
console.log(_SampleData.getBookstoreSchemaPath()); // the folder on disk
```

The service extends `fable-serviceproviderbase` but doesn't actually call fable for anything except its logger. Passing `{}` for fable and `{}` for options is enough for the read methods to work. (This isn't guaranteed — it's a side effect of the current implementation — so if you want robustness, use a real Fable.)

## Related

- [Quick Start](quickstart.md) — the fast walkthrough without all the recipes
- [Schema Overview](schema.md) — entity relationships
- [Seed Data](seed-data.md) — what's in the rows these recipes load
- [API Reference](api-reference.md) — the methods these recipes call
