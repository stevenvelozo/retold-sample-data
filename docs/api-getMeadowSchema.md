# getMeadowSchema

Read and parse an individual per-entity `MeadowSchema<Name>.json` file -- the meadow package format that `meadow.loadFromPackageObject()` and `meadow-provider-offline.addEntity()` consume.

## Signature

```javascript
getMeadowSchema(pEntityName)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `pEntityName` | string | The entity name (e.g. `'Book'`, `'Author'`, `'BookAuthorJoin'`). Case-sensitive. Must match a file in `source/schemas/bookstore/meadow/MeadowSchema<Name>.json`. |

**Returns:** `object` -- the parsed meadow package schema with shape:

```javascript
{
    Scope: 'Book',
    DefaultIdentifier: 'IDBook',
    Schema: [ /* column definitions */ ],
    DefaultObject: { /* default record shape */ },
    JsonSchema: { /* JSON Schema for validation */ },
    Authorization: { /* per-role permissions */ }
}
```

## What It Does

1. Computes the path `source/schemas/bookstore/meadow/MeadowSchema<Name>.json`
2. Reads the file with `fs.readFileSync`
3. Parses the JSON and returns the object

Like all the accessors, there's no caching -- every call reads from disk. Since per-entity files are small and you usually only need each entity once, this is fine.

## Available Entity Names

The 12 entities with individual `MeadowSchemaFoo.json` files are:

```
Author, Book, BookAuthorJoin, BookPrice, BookStore, BookStoreEmployee,
BookStoreInventory, BookStoreSale, BookStoreSaleItem, Customer, Review, User
```

Call `getEntityList()` to get this list programmatically.

## Code Example: Basic Usage

```javascript
let tmpBookSchema = _SampleData.getMeadowSchema('Book');

console.log('Scope:', tmpBookSchema.Scope);
console.log('Identifier:', tmpBookSchema.DefaultIdentifier);
console.log('Columns:', tmpBookSchema.Schema.map((pCol) => pCol.Column));
```

## Code Example: Loading Into a Meadow DAL

```javascript
const libMeadow = require('meadow');

let tmpMeadow = libMeadow.new(_Fable);
let tmpBookDAL = tmpMeadow.loadFromPackageObject(_SampleData.getMeadowSchema('Book'));
tmpBookDAL.setProvider('SQLiteNode');
tmpBookDAL.setIDUser(1);

tmpBookDAL.doReads('', 0, 10, (pError, pQuery, pBooks) =>
{
    console.log('First 10 books:', pBooks);
});
```

## Code Example: Bulk Loading Into `meadow-provider-offline`

The most common pattern -- iterate the entity list, read each schema, and hand them to `addEntities()`:

```javascript
_Offline.initializeAsync(() =>
{
    let tmpSchemas = _SampleData.getEntityList().map(
        (pName) => _SampleData.getMeadowSchema(pName));

    _Offline.addEntities(tmpSchemas, (pError) =>
    {
        if (pError) throw pError;
        _Offline.connect(_Fable.RestClient);
    });
});
```

## Code Example: Inspecting an Entity's Authorization

```javascript
let tmpSchema = _SampleData.getMeadowSchema('Book');
console.log('Book permissions:', JSON.stringify(tmpSchema.Authorization, null, 2));
// Example output:
// {
//   "Administrator": { "Create": "Allow", "Read": "Allow", "Update": "Allow", "Delete": "Allow" },
//   "User":          { "Create": "Deny",  "Read": "Allow", "Update": "Deny",  "Delete": "Deny"  }
// }
```

## Errors

Throws if:
- `MeadowSchema<Name>.json` doesn't exist for the given entity name (e.g. `getMeadowSchema('NonExistent')`)
- The file is not valid JSON

To check first:

```javascript
if (_SampleData.getEntityList().indexOf('Book') >= 0)
{
    let tmpSchema = _SampleData.getMeadowSchema('Book');
}
```

## Case Sensitivity

The entity name must match the filename capitalization exactly. `getMeadowSchema('book')` will throw because the file is `MeadowSchemaBook.json`, not `MeadowSchemabook.json`. Always use the exact casing from `getEntityList()`.

## Related

- [getEntityList](api-getEntityList.md) -- list of valid entity names to pass here
- [getMeadowModel](api-getMeadowModel.md) -- the combined form (all entities in one object)
- [Using With Meadow](using-with-meadow.md) -- end-to-end recipes that use this method
