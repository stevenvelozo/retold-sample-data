# Entity Reference

Complete column listing for every entity in the bookstore schema. For the high-level relationship view see the [Schema Overview](schema.md); this page is the nitty-gritty reference.

All non-join entities carry the standard audit columns:

- `CreateDate` (DateTime)
- `CreatingIDUser` (Numeric) -- lifecycle-set
- `UpdateDate` (DateTime)
- `UpdatingIDUser` (Numeric) -- lifecycle-set
- `Deleted` (Boolean, 0/1)
- `DeleteDate` (DateTime)
- `DeletingIDUser` (Numeric) -- lifecycle-set

These are elided from the column tables below for readability. Join tables (`BookAuthorJoin`) do not carry the audit columns.

## Customer

The tenant-owner of every other record. Every entity in the schema has an `IDCustomer` FK pointing back here.

| Column | Type | Notes |
|--------|------|-------|
| `IDCustomer` | ID | Primary key |
| `GUIDCustomer` | GUID | |
| `Name` | String | Customer display name |
| `Description` | String | |
| `ContactName` | String | |
| `ContactEmail` | String | |
| `ContactPhone` | String | |
| `Address` | String | |
| `City` | String | |
| `State` | String | |
| `Postal` | String | |
| `Country` | String | |
| `Active` | Boolean | 1 if tenant is active |

---

## User

Identity table. Referenced by `Author`, `BookStoreEmployee`, `BookStoreSale`, `BookStoreInventory.StockingAssociate`, and `Review`.

| Column | Type | Notes |
|--------|------|-------|
| `IDUser` | ID | Primary key |
| `GUIDUser` | Numeric(int) | *Known-weird -- declared Numeric instead of GUID for legacy reasons* |
| `LoginID` | String(128) | Username |
| `Password` | String(255) | *Demo data -- never store real passwords like this* |
| `NameFirst` | String(128) | |
| `NameLast` | String(128) | |
| `FullName` | String(255) | Denormalized full name |
| `Config` | String(64) | Per-user config key |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |
| `Email` | String(200) | |
| `Phone` | String(32) | |
| `Address` | String | |
| `City` | String | |
| `State` | String | |
| `Postal` | String | |
| `Country` | String | |

**Note:** `User` does not carry the standard audit columns (no `CreateDate` / `CreatingIDUser` / etc.) because it's the entity that provides those values for everything else.

---

## Book

The catalog entry for a book. The most-referenced entity in the schema.

| Column | Type | Notes |
|--------|------|-------|
| `IDBook` | ID | Primary key |
| `GUIDBook` | GUID | |
| `Title` | String(200) | |
| `Type` | String(32) | e.g. `'Hardcover'`, `'Paperback'`, `'Ebook'` |
| `Genre` | String(128) | e.g. `'Fiction'`, `'Mystery'` |
| `ISBN` | String(64) | |
| `Language` | String(12) | e.g. `'en'`, `'es'` |
| `ImageURL` | String(254) | Book cover URL |
| `PublicationYear` | Numeric | |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

Outgoing references: none. Incoming references: `BookAuthorJoin`, `BookPrice`, `BookStoreInventory`, `BookStoreSaleItem`, `Review`.

---

## Author

Author identity. Optionally linked to a `User` identity via `IDUser`.

| Column | Type | Notes |
|--------|------|-------|
| `IDAuthor` | ID | Primary key |
| `GUIDAuthor` | GUID | |
| `Name` | String(200) | Full author name |
| `IDUser` | Numeric | Optional FK -> `User.IDUser` |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

Outgoing references: `User`. Incoming references: `BookAuthorJoin`.

---

## BookAuthorJoin

Many-to-many bridge between `Book` and `Author`. One row per (book, author) pairing.

| Column | Type | Notes |
|--------|------|-------|
| `IDBookAuthorJoin` | ID | Primary key |
| `GUIDBookAuthorJoin` | GUID | |
| `IDBook` | Numeric | FK -> `Book.IDBook` |
| `IDAuthor` | Numeric | FK -> `Author.IDAuthor` |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

Seed data contains 27 rows joining the 22 books to the 13 authors, with some books having multiple co-authors.

**No audit columns** -- join tables are write-once.

---

## BookPrice

Historical and active pricing for a book. One book can have many `BookPrice` records over time.

| Column | Type | Notes |
|--------|------|-------|
| `IDBookPrice` | ID | Primary key |
| `GUIDBookPrice` | GUID | |
| `Price` | Decimal | |
| `StartDate` | DateTime | When this price became active |
| `EndDate` | DateTime | When this price stopped being active (null = current) |
| `Discountable` | Boolean | Whether the price is eligible for promo discounts |
| `CouponCode` | String(16) | Optional coupon required to get this price |
| `IDBook` | Numeric | FK -> `Book.IDBook` |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

Outgoing: `Book`. Incoming: `BookStoreInventory`, `BookStoreSaleItem`.

---

## BookStore

A physical or online retail location.

| Column | Type | Notes |
|--------|------|-------|
| `IDBookStore` | ID | Primary key |
| `GUIDBookStore` | GUID | |
| `Name` | String | |
| `StoreType` | String | e.g. `'Physical'`, `'Online'`, `'Warehouse'` |
| `Address` | String | |
| `City` | String | |
| `State` | String | |
| `Postal` | String | |
| `Country` | String | |
| `Phone` | String | |
| `Email` | String | |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

Outgoing: `Customer`. Incoming: `BookStoreEmployee`, `BookStoreInventory`, `BookStoreSale`.

---

## BookStoreInventory

Stock level for a specific book at a specific store at a specific date. Also records which employee stocked it and which `BookPrice` was in effect.

| Column | Type | Notes |
|--------|------|-------|
| `IDBookStoreInventory` | ID | Primary key |
| `GUIDBookStoreInventory` | GUID | |
| `StockDate` | DateTime | When the stock count was taken |
| `BookCount` | Numeric | Current stock count |
| `AggregateBookCount` | Numeric | Running total / aggregate count |
| `IDBook` | Numeric | FK -> `Book.IDBook` |
| `IDBookStore` | Numeric | FK -> `BookStore.IDBookStore` |
| `IDBookPrice` | Numeric | FK -> `BookPrice.IDBookPrice` (which price was in effect) |
| `StockingAssociate` | Numeric | FK -> `User.IDUser` *(non-standard column name)* |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

**Note the `StockingAssociate` oddity:** this is a foreign key to `User` but the column is not named `IDUser`. This is deliberate -- it gives `meadow-graph-client`'s solver a test case for hints and manual-path overrides when automatic name-matching fails. See [Schema Overview § Design Decisions](schema.md#design-decisions-worth-knowing).

---

## BookStoreEmployee

Ties a `User` identity to a `BookStore` as an employee, with hire dates and active status.

| Column | Type | Notes |
|--------|------|-------|
| `IDBookStoreEmployee` | ID | Primary key |
| `GUIDBookStoreEmployee` | GUID | |
| `Title` | String | Job title |
| `HireDate` | DateTime | |
| `TerminationDate` | DateTime | Null if still employed |
| `IsActive` | Boolean | Active-employee flag |
| `IDUser` | Numeric | FK -> `User.IDUser` |
| `IDBookStore` | Numeric | FK -> `BookStore.IDBookStore` |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

---

## BookStoreSale

A sale transaction -- one sale per customer per checkout, with a total and a payment method.

| Column | Type | Notes |
|--------|------|-------|
| `IDBookStoreSale` | ID | Primary key |
| `GUIDBookStoreSale` | GUID | |
| `SaleDate` | DateTime | |
| `TotalAmount` | Decimal | Sum of all `BookStoreSaleItem.LineTotal` for this sale |
| `PaymentMethod` | String | e.g. `'Cash'`, `'CreditCard'`, `'Gift Card'` |
| `TransactionID` | String | External payment processor reference |
| `IDBookStore` | Numeric | FK -> `BookStore.IDBookStore` (which store rang it up) |
| `IDUser` | Numeric | FK -> `User.IDUser` (the cashier) |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

Outgoing: `BookStore`, `User`. Incoming: `BookStoreSaleItem`.

---

## BookStoreSaleItem

One line item on a sale -- a specific book at a specific price in a specific quantity. Multiple sale items per sale.

| Column | Type | Notes |
|--------|------|-------|
| `IDBookStoreSaleItem` | ID | Primary key |
| `GUIDBookStoreSaleItem` | GUID | |
| `Quantity` | Numeric | Number of copies sold in this line |
| `UnitPrice` | Decimal | Price per copy at time of sale (snapshotted) |
| `LineTotal` | Decimal | `Quantity × UnitPrice` |
| `IDBookStoreSale` | Numeric | FK -> `BookStoreSale.IDBookStoreSale` |
| `IDBook` | Numeric | FK -> `Book.IDBook` |
| `IDBookPrice` | Numeric | FK -> `BookPrice.IDBookPrice` (which price record was used) |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

Outgoing: `BookStoreSale`, `Book`, `BookPrice`. Incoming: none.

---

## Review

A reader's rating and written review for a specific book.

| Column | Type | Notes |
|--------|------|-------|
| `IDReview` | ID | Primary key |
| `GUIDReview` | GUID | |
| `Text` | Text | Free-form review body |
| `Rating` | Numeric | Numeric rating (scale not enforced by the schema) |
| `IDBook` | Numeric | FK -> `Book.IDBook` |
| `IDUser` | Numeric | FK -> `User.IDUser` (reviewer) |
| `IDCustomer` | Numeric | FK -> `Customer.IDCustomer` |

---

## Data Type Summary

| Meadow Type | SQLite DDL | Notes |
|-------------|------------|-------|
| `ID` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Exactly one per table, always `ID<Scope>` |
| `GUID` | `TEXT` | UUID string |
| `String` with `Size: <N>` | `VARCHAR(N)` | Typical short strings |
| `Text` | `TEXT` | Long-form free text |
| `Numeric` with `Size: 'int'` or default | `INTEGER` | Used for counts, IDs, foreign keys |
| `Decimal` | `REAL` | Used for monetary amounts |
| `DateTime` | `TEXT` | ISO 8601 strings |
| `Boolean` | `INTEGER` | 0 or 1 |

See [meadow-provider-offline's entity-schema doc](https://github.com/stevenvelozo/meadow-provider-offline/blob/master/docs/entity-schema.md) for the complete meadow type -> SQLite type mapping.

## Related

- [Schema Overview](schema.md) -- Mermaid ER diagram and design principles
- [Seed Data](seed-data.md) -- what's in the sample rows
- [Using With Meadow](using-with-meadow.md) -- integration walkthroughs
