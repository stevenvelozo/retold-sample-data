# Retold Sample Data

> A realistic bookstore schema and seed data set for testing and developing against the Retold ecosystem

Retold Sample Data is a Fable service provider that ships a complete 12-entity bookstore schema plus thousands of pre-populated seed rows. Every file the rest of the Retold ecosystem needs — the combined `MeadowModel.json`, the per-entity `MeadowSchemaFoo.json` files, a full SQLite DDL script, and an extensive `INSERT` seed — is bundled into the package and exposed through a tiny API so consumers can load them without hand-rolling filesystem paths.

It exists because nearly every Retold package needs a non-trivial schema to test against, and re-inventing one per package is tedious and produces inconsistency. By concentrating the fixture here, every downstream test exercises the same shape and the same data. The `retold-harness` test server loads these files. `meadow-graph-client`'s graph-traversal tests load these files. `meadow-provider-offline`'s integration tests load these files. Using it outside tests — as a learning aid or a starting point for your own schema — works equally well.

## Features

- **12-Entity Bookstore Schema** - Customer, User, Book, Author, BookAuthorJoin, BookPrice, BookStore, BookStoreInventory, BookStoreEmployee, BookStoreSale, BookStoreSaleItem, Review
- **MeadowModel.json** - The combined schema in the format `meadow-graph-client` and `meadow-provider-offline` consume
- **Per-Entity MeadowSchema Files** - Individual `MeadowSchemaFoo.json` files in the format `meadow.loadFromPackageObject()` consumes
- **SQLite DDL** - A ready-to-run `CREATE TABLE` script covering every entity
- **Seed Data** - An `INSERT` script with 13 authors, 22 books, 27 book/author joins, 8 users, plus customers, stores, inventories, sales, and reviews
- **Extended Seed Data** - An additional smaller seed script for scenarios that need an alternate data set
- **Multi-Tenancy Ready** - Every entity carries `IDCustomer` so the schema demonstrates the Retold tenant-isolation pattern
- **First-Class Fable Service** - Standard lifecycle, logging, and service-manager integration

## What's Inside The Package

```
source/schemas/bookstore/
├── MeadowModel.json                            — combined model (all 12 tables)
├── Schema.json                                 — RetoldDataService schema variant
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
    ├── BookStore-CreateSQLiteTables.sql       — 222 lines of DDL
    ├── BookStore-SeedData.sql                 — main seed (76 INSERTs, ~30k lines)
    └── BookStore-SeedData-Extended.sql        — alternate seed (11 INSERTs)
```

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
```

See [Quick Start](quickstart.md) for a complete walkthrough from install to first query.

## Where to Go Next

- [Quick Start](quickstart.md) — three-minute walkthrough from install to first query
- [Schema Overview](schema.md) — Mermaid ER diagram and design notes
- [Entity Reference](entities.md) — every entity, every column, every join
- [Seed Data](seed-data.md) — what's in the seed SQL and how to load a subset
- [Using With Meadow](using-with-meadow.md) — end-to-end with `meadow-graph-client` and `meadow-provider-offline`
- [API Reference](api-reference.md) — one page per public method

## Related Packages

- [meadow](https://github.com/stevenvelozo/meadow) — data access and ORM
- [meadow-graph-client](https://github.com/stevenvelozo/meadow-graph-client) — graph queries that consume this schema
- [meadow-provider-offline](https://github.com/stevenvelozo/meadow-provider-offline) — offline provider that loads this schema in the browser
- [meadow-connection-sqlite-browser](https://github.com/stevenvelozo/meadow-connection-sqlite-browser) — browser SQLite connection used with the DDL
- [retold-harness](https://github.com/stevenvelozo/retold-harness) — the test harness that consumes this data
- [retold-data-service](https://github.com/stevenvelozo/retold-data-service) — consumes the `Schema.json` form
- [fable](https://github.com/stevenvelozo/fable) — application services framework
