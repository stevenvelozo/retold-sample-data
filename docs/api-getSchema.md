# getSchema

Read and parse `Schema.json` -- the bookstore schema in the format `retold-data-service` consumes.

## Signature

```javascript
getSchema()
```

**Returns:** `object` with shape `{ Tables: { EntityName: { TableName, Domain, Columns: [...] } } }`.

## Relationship to getMeadowModel()

`Schema.json` and `MeadowModel.json` both describe the same 12-entity bookstore schema with the same top-level shape. The two files exist because:

- `MeadowModel.json` is the canonical form for `meadow-graph-client` and `meadow-provider-offline`
- `Schema.json` is the form `retold-data-service` expects

In practice they contain essentially the same column definitions -- the split exists to give each consumer a file it owns and can evolve independently without breaking the other.

For new code you'll typically want `getMeadowModel()`. Use `getSchema()` specifically when feeding `retold-data-service`.

## Code Example: Basic Usage

```javascript
let tmpSchema = _SampleData.getSchema();
console.log('Entities in Schema.json:', Object.keys(tmpSchema.Tables));
// -> [ 'User', 'Customer', 'Book', 'Author', ... ]
```

## Code Example: Feeding `retold-data-service`

```javascript
const libRetoldDataService = require('retold-data-service');

_Fable.serviceManager.addServiceType('RetoldDataService', libRetoldDataService);
_Fable.serviceManager.instantiateServiceProvider('RetoldDataService',
    {
        Schema: _SampleData.getSchema()
    });

// The data service is now configured with the bookstore entities
```

## Code Example: Verifying Schemas Match

If you're curious whether `Schema.json` and `MeadowModel.json` differ in any meaningful way:

```javascript
let tmpSchema = _SampleData.getSchema();
let tmpModel = _SampleData.getMeadowModel();

let tmpSchemaEntities = new Set(Object.keys(tmpSchema.Tables));
let tmpModelEntities = new Set(Object.keys(tmpModel.Tables));

let tmpOnlyInSchema = [...tmpSchemaEntities].filter((pN) => !tmpModelEntities.has(pN));
let tmpOnlyInModel = [...tmpModelEntities].filter((pN) => !tmpSchemaEntities.has(pN));

console.log('Only in Schema.json:', tmpOnlyInSchema);
console.log('Only in MeadowModel.json:', tmpOnlyInModel);
```

## Errors

Throws if `Schema.json` is missing or not valid JSON. In a normal `npm install` neither happens.

## Related

- [getMeadowModel](api-getMeadowModel.md) -- the `meadow-graph-client` variant
- [getMeadowSchema](api-getMeadowSchema.md) -- per-entity meadow package form
- [API Reference](api-reference.md) -- method index
