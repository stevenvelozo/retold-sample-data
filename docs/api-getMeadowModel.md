# getMeadowModel

Read and parse `MeadowModel.json` -- the combined 12-entity model in the format `meadow-graph-client` and `meadow-provider-offline`'s `DataModel` option expect.

## Signature

```javascript
getMeadowModel()
```

**Returns:** `object` with shape `{ Tables: { EntityName: { TableName, Domain, Columns: [...] } } }`.

## What It Does

1. Computes the path `source/schemas/bookstore/MeadowModel.json`
2. Reads the file with `fs.readFileSync`
3. Parses the JSON and returns the object

No caching -- every call re-reads from disk. Cache the result yourself if you call it repeatedly.

## Return Shape

```javascript
{
    Tables:
    {
        Customer: { TableName: 'Customer', Domain: 'Default', Columns: [...] },
        User:     { TableName: 'User',     Domain: 'Default', Columns: [...] },
        Book:     { TableName: 'Book',     Domain: 'Default', Columns: [...] },
        // ... 9 more entities
    }
}
```

Each table's `Columns` array contains `{ Column, DataType, Size?, Join? }` entries.

## Code Example: Basic Usage

```javascript
let tmpModel = _SampleData.getMeadowModel();
console.log('Entities:', Object.keys(tmpModel.Tables));
// -> [ 'Customer', 'User', 'Book', 'BookAuthorJoin', 'Author', 'BookPrice',
//     'BookStore', 'BookStoreInventory', 'BookStoreEmployee',
//     'BookStoreSale', 'BookStoreSaleItem', 'Review' ]
```

## Code Example: Feeding `meadow-graph-client`

The most common use. Hand the model to `meadow-graph-client`'s constructor:

```javascript
const libMeadowGraphClient = require('meadow-graph-client');

_Fable.serviceManager.addServiceType('MeadowGraphClient', libMeadowGraphClient);

let _GraphClient = _Fable.serviceManager.instantiateServiceProvider('MeadowGraphClient',
    {
        DataModel: _SampleData.getMeadowModel()
    });

// Graph traversal just works
let tmpPath = _GraphClient.solveGraphConnections('Book', 'Author');
console.log(tmpPath.OptimalSolutionPath.EdgeAddress);
// -> 'Book-->BookAuthorJoin-->Author'
```

## Code Example: Inspecting a Specific Entity

```javascript
let tmpModel = _SampleData.getMeadowModel();
let tmpBookColumns = tmpModel.Tables.Book.Columns;

console.log('Book columns:', tmpBookColumns.map((pCol) => pCol.Column));

// Find the foreign key columns
let tmpJoins = tmpBookColumns.filter((pCol) => pCol.Join);
console.log('Book foreign keys:', tmpJoins);
// -> [ { Column: 'IDCustomer', DataType: 'Numeric', Size: 'int', Join: 'IDCustomer' } ]
```

## Code Example: Counting Tables by Category

```javascript
let tmpModel = _SampleData.getMeadowModel();
let tmpCategorized = { entities: [], joins: [] };

for (let tmpName of Object.keys(tmpModel.Tables))
{
    if (tmpName.endsWith('Join'))
    {
        tmpCategorized.joins.push(tmpName);
    }
    else
    {
        tmpCategorized.entities.push(tmpName);
    }
}

console.log(tmpCategorized);
// -> { entities: [ 'Customer', 'User', 'Book', 'Author', ... ], joins: [ 'BookAuthorJoin' ] }
```

## Difference from getSchema()

`getMeadowModel()` reads `MeadowModel.json`. `getSchema()` reads `Schema.json`. They have the same top-level shape (`{ Tables: { ... } }`) but are intended for different consumers:

- `MeadowModel.json` -> `meadow-graph-client`, `meadow-provider-offline`
- `Schema.json` -> `retold-data-service`

In practice the files are very similar -- they describe the same schema. Pick the one whose name matches the package you're feeding it to.

## Errors

Throws if:
- `MeadowModel.json` is missing from the installed package (shouldn't happen unless you've edited `node_modules/retold-sample-data/`)
- The file is not valid JSON

Both are essentially "you broke the package" errors, not runtime user errors.

## Related

- [getSchema](api-getSchema.md) -- the alternate `Schema.json` form
- [getMeadowSchema](api-getMeadowSchema.md) -- per-entity version for `meadow.loadFromPackageObject()`
- [getEntityList](api-getEntityList.md) -- just the entity names without the full model
- [Schema Overview](schema.md) -- ER diagram of what's inside the returned object
