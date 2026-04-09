# getEntityList

Return the array of entity names in the bookstore schema. Equivalent to `Object.keys(getMeadowModel().Tables)` but cheaper to say.

## Signature

```javascript
getEntityList()
```

**Returns:** `string[]` — an array of 12 entity names.

## What It Returns

```javascript
[
    'Customer',
    'User',
    'Book',
    'BookAuthorJoin',
    'Author',
    'BookPrice',
    'BookStore',
    'BookStoreInventory',
    'BookStoreEmployee',
    'BookStoreSale',
    'BookStoreSaleItem',
    'Review'
]
```

The order is the order they appear in `MeadowModel.json`, which roughly follows "foundational entities first, dependent entities after" (Customer → User → Book → Author → joins → stores → sales → reviews).

## What It Does

1. Calls `getMeadowModel()` internally
2. Returns `Object.keys(tmpModel.Tables)`

Because it calls `getMeadowModel()`, each invocation re-reads `MeadowModel.json` from disk. Cache the result yourself if you need it repeatedly.

## Code Example: Basic Usage

```javascript
let tmpEntities = _SampleData.getEntityList();
console.log('Available entities:', tmpEntities);
console.log('Entity count:', tmpEntities.length);
```

## Code Example: Iterating Every Entity's Schema

The canonical pattern for bulk-loading into `meadow-provider-offline`:

```javascript
let tmpSchemas = _SampleData.getEntityList().map(
    (pName) => _SampleData.getMeadowSchema(pName));

_Offline.addEntities(tmpSchemas, (pError) =>
{
    if (pError) throw pError;
    console.log('All', tmpSchemas.length, 'entities registered offline');
});
```

## Code Example: Filtering Join Tables

```javascript
let tmpAll = _SampleData.getEntityList();

let tmpDataEntities = tmpAll.filter((pName) => !pName.endsWith('Join'));
let tmpJoinTables   = tmpAll.filter((pName) =>  pName.endsWith('Join'));

console.log('Data entities:', tmpDataEntities.length);  // 11
console.log('Join tables:', tmpJoinTables.length);      // 1 (BookAuthorJoin)
```

## Code Example: Check If an Entity Exists

```javascript
function entityExists(pSampleData, pName)
{
    return pSampleData.getEntityList().indexOf(pName) >= 0;
}

if (entityExists(_SampleData, 'Book'))
{
    let tmpSchema = _SampleData.getMeadowSchema('Book');
}
```

Or more efficiently if you check multiple entities:

```javascript
let tmpEntitySet = new Set(_SampleData.getEntityList());
if (tmpEntitySet.has('Book')) { /* ... */ }
if (tmpEntitySet.has('Author')) { /* ... */ }
```

## Errors

Throws if `MeadowModel.json` is missing or invalid, via the internal `getMeadowModel()` call. In a normal `npm install` neither happens.

## Related

- [getMeadowModel](api-getMeadowModel.md) — the underlying data this method reads from
- [getMeadowSchema](api-getMeadowSchema.md) — fetch an individual entity by name from this list
- [Entity Reference](entities.md) — per-entity column listing for each name in the list
