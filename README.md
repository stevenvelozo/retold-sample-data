# Retold Sample Data

> A realistic bookstore schema and seed data set for testing and developing against the Retold ecosystem

Retold Sample Data is a Fable service provider that ships a complete 12-entity bookstore schema (books, authors, customers, sales, inventory, reviews, and the join tables that wire them together) plus thousands of pre-populated seed rows. Every file the rest of the Retold ecosystem needs — `MeadowModel.json`, per-entity `MeadowSchemaFoo.json`, a full SQLite DDL file, and an extensive `INSERT` seed — is bundled into the package and exposed through a tiny API so consumers can load them without touching the filesystem directly.

This is the canonical test fixture used throughout the Retold test harness. `retold-harness`, `meadow-graph-client`'s test suite, and `meadow-provider-offline`'s integration tests all read from here, which means any query, traversal, or sync behavior you demonstrate against this schema will look familiar to anyone who has worked with Retold. It's also a reasonable starting point if you're learning the Meadow schema format and want something non-trivial to play with.

## Features

- **12-Entity Schema** - Customer, User, Book, Author, BookAuthorJoin, BookPrice, BookStore, BookStoreInventory, BookStoreEmployee, BookStoreSale, BookStoreSaleItem, Review
- **MeadowModel.json** - The combined schema in the format `meadow-graph-client` and `meadow-provider-offline` consume
- **Per-Entity MeadowSchema Files** - Individual `MeadowSchemaFoo.json` files in the format `meadow.loadFromPackageObject()` consumes
- **SQLite DDL** - A ready-to-run `CREATE TABLE` script covering every entity with proper types and constraints
- **Seed Data** - An `INSERT` script with 13 authors, 22 books, 27 book/author joins, 8 users, plus customers, stores, inventories, sales, and reviews
- **Extended Seed Data** - An additional smaller seed script for scenarios that need an alternate data set
- **Multi-Tenancy Ready** - Every entity carries `IDCustomer` so the schema demonstrates the Retold tenant-isolation pattern
- **Audit Columns** - Standard `CreateDate`, `CreatingIDUser`, `UpdateDate`, `UpdatingIDUser`, `Deleted`, `DeleteDate`, `DeletingIDUser` on most entities
- **First-Class Fable Service** - Standard lifecycle and service-manager integration; nothing to configure

## Quick Start

```javascript
const libFable = require('fable');
const libRetoldSampleData = require('retold-sample-data');

const _Fable = new libFable();
_Fable.serviceManager.addServiceType('RetoldSampleData', libRetoldSampleData);

let _SampleData = _Fable.serviceManager.instantiateServiceProvider('RetoldSampleData');

// The combined MeadowModel (ready for meadow-graph-client / meadow-provider-offline)
let tmpModel = _SampleData.getMeadowModel();
console.log('Entities:', Object.keys(tmpModel.Tables));
// → [ 'Customer', 'User', 'Book', 'BookAuthorJoin', 'Author', 'BookPrice',
//     'BookStore', 'BookStoreInventory', 'BookStoreEmployee',
//     'BookStoreSale', 'BookStoreSaleItem', 'Review' ]

// A single entity's meadow package schema (ready for meadow.loadFromPackageObject)
let tmpBookSchema = _SampleData.getMeadowSchema('Book');

// The SQLite DDL (for bootstrapping an in-memory database)
let tmpDDL = _SampleData.getSQLiteDDL();

// The seed data INSERTs
let tmpSeedSQL = _SampleData.getSeedDataSQL();
```

## Installation

```bash
npm install retold-sample-data
```

## What's Inside

```
source/schemas/bookstore/
├── MeadowModel.json                            — combined model (all 12 tables)
├── Schema.json                                 — full RetoldDataService schema
├── meadow/
│   ├── MeadowSchemaAuthor.json                — per-entity package schemas
│   ├── MeadowSchemaBook.json
│   ├── MeadowSchemaBookAuthorJoin.json
│   ├── MeadowSchemaBookPrice.json
│   ├── MeadowSchemaBookStore.json
│   ├── MeadowSchemaBookStoreEmployee.json
│   ├── MeadowSchemaBookStoreInventory.json
│   ├── MeadowSchemaBookStoreSale.json
│   ├── MeadowSchemaBookStoreSaleItem.json
│   ├── MeadowSchemaCustomer.json
│   ├── MeadowSchemaReview.json
│   └── MeadowSchemaUser.json
└── sqlite_create/
    ├── BookStore-CreateSQLiteTables.sql       — full DDL (222 lines)
    ├── BookStore-SeedData.sql                 — main seed (76 INSERTs, ~30k lines)
    └── BookStore-SeedData-Extended.sql        — alternate seed (11 INSERTs)
```

## API

Every method is synchronous and reads from disk (inside the package) on each call. For long-running processes you'll typically call them once at startup and cache the results.

| Method | Description |
|--------|-------------|
| `getBookstoreSchemaPath()` | Absolute path to the bookstore schema directory inside the package |
| `getMeadowModel()` | The combined `MeadowModel.json` as a parsed object |
| `getSchema()` | The `Schema.json` used by `retold-data-service` as a parsed object |
| `getMeadowSchema(pEntityName)` | The individual `MeadowSchema<Name>.json` as a parsed object |
| `getEntityList()` | Array of entity names (the keys of `MeadowModel.Tables`) |
| `getSQLiteDDL()` | The `CREATE TABLE` SQL as a raw string |
| `getSeedDataSQL()` | The `INSERT` seed data SQL as a raw string |

## Documentation

Full documentation lives in the [`docs`](./docs) folder and is served via [pict-docuserve](https://github.com/stevenvelozo/pict-docuserve):

- [Overview](docs/README.md) — what the module ships and where each file lives
- [Quick Start](docs/quickstart.md) — three-minute walkthrough from install to first query
- [Schema Overview](docs/schema.md) — full entity-relationship Mermaid diagram and design notes
- [Entity Reference](docs/entities.md) — every entity, every column, every join
- [Seed Data](docs/seed-data.md) — what's in the seed SQL and how to pick a subset
- [Using With Meadow](docs/using-with-meadow.md) — end-to-end integration with `meadow-graph-client` and `meadow-provider-offline`
- [API Reference](docs/api-reference.md) — one page per public method

## Related Packages

- [meadow](https://github.com/stevenvelozo/meadow) — data access and ORM the schema targets
- [meadow-graph-client](https://github.com/stevenvelozo/meadow-graph-client) — graph queries over the schema in this module
- [meadow-provider-offline](https://github.com/stevenvelozo/meadow-provider-offline) — offline provider that loads this schema in the browser
- [meadow-connection-sqlite-browser](https://github.com/stevenvelozo/meadow-connection-sqlite-browser) — browser SQLite connection used with the DDL from this module
- [retold-harness](https://github.com/stevenvelozo/retold-harness) — the test harness this module exists to feed
- [retold-data-service](https://github.com/stevenvelozo/retold-data-service) — consumes the `Schema.json` form
- [fable](https://github.com/stevenvelozo/fable) — application services framework

## License

MIT

## Contributing

Pull requests are welcome. For details on our code of conduct, contribution process, and testing requirements, see the [Retold Contributing Guide](https://github.com/stevenvelozo/retold/blob/main/docs/contributing.md).
