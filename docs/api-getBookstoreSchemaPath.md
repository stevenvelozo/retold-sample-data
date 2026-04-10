# getBookstoreSchemaPath

Return the absolute filesystem path to the bundled bookstore schema directory inside the installed package.

## Signature

```javascript
getBookstoreSchemaPath()
```

**Returns:** `string` -- an absolute path to `.../retold-sample-data/source/schemas/bookstore`.

## What It Does

Joins `__dirname` (the directory of `Retold-Sample-Data.js` inside the installed package) with `'schemas', 'bookstore'`. No filesystem access -- the path is computed, not resolved, so it's fast and doesn't throw.

## Code Example

```javascript
const _SampleData = _Fable.serviceManager.instantiateServiceProvider('RetoldSampleData');
console.log(_SampleData.getBookstoreSchemaPath());
// -> /path/to/your-app/node_modules/retold-sample-data/source/schemas/bookstore
```

## Code Example: Reading a File Not Covered by the Accessors

The dedicated methods cover `MeadowModel.json`, `Schema.json`, per-entity `MeadowSchema*.json`, the DDL SQL, and the main seed SQL. If you need one of the other files (the alternate `BookStore-SeedData-Extended.sql`, for example), use this method plus raw filesystem calls:

```javascript
const libFS = require('fs');
const libPath = require('path');

let tmpExtendedSeedPath = libPath.join(
    _SampleData.getBookstoreSchemaPath(),
    'sqlite_create',
    'BookStore-SeedData-Extended.sql');

let tmpExtendedSeed = libFS.readFileSync(tmpExtendedSeedPath, 'utf8');
```

## Code Example: Listing the Schema Directory

```javascript
const libFS = require('fs');

let tmpEntries = libFS.readdirSync(_SampleData.getBookstoreSchemaPath());
console.log(tmpEntries);
// -> [ 'MeadowModel.json', 'Schema.json', 'meadow', 'sqlite_create' ]
```

## Errors

None -- this method never throws. It's a pure path computation.

## When to Use It

- You need a file the other accessors don't expose
- You want to verify the package is installed correctly
- You're building tooling that needs to enumerate the schema directory

## Related

- [getMeadowModel](api-getMeadowModel.md) -- reads `MeadowModel.json` inside this directory
- [getSQLiteDDL](api-getSQLiteDDL.md) -- reads the main DDL inside this directory
- [getSeedDataSQL](api-getSeedDataSQL.md) -- reads the main seed inside this directory
