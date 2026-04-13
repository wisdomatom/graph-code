# GraphQL API Overview & Contracts

This project automatically generates API interfaces compliant with the GraphQL specification based on the Schema DSL. All interfaces follow unified naming and parameter conventions.

## 1. Naming Conventions

For every model `Model` defined in the DSL, the system automatically generates the following interfaces:

### Query Operations
- `queryModels`: Retrieve a list of models, supporting filtering, pagination, and sorting.
- `countModels`: Retrieve the total number of records matching the criteria.
- `aggregateModels`: Aggregation queries (e.g., sum, average, max/min).

### Mutation Operations
- `createModels`: Batch create records.
- `updateModels`: Batch update records matching the criteria.
- `upsertModels`: Update if exists, create if not (**Note**: Generated only when the model has a `@uniNm(primary)` index).
- `deleteModels`: Batch delete records matching the criteria.
- `batchUpdateModels`: Batch execution of different update operations.

---

## 2. Common Parameter Structure

### 2.1 Filter (`where`)
All query and some update/delete interfaces accept a `where` parameter.
- **Scalar Filtering**: Supports suffixes like `name: "xxx"`, `age_GE: 18`, `tags_IN: ["A", "B"]`. All suffixes start with `_` and are in uppercase.
- **Logical Composition**: Supports infinite levels of nesting for `AND`, `OR`, and `NOT`.
- **Relational Filtering**: Allows filtering across models, such as querying "all products where the category name is 'Electronics'".

### 2.2 Options (`option`)
Used to control the result set:
- `limit`: Restricts the number of returned items.
- `offset`: Offset for pagination.
- `after`: Cursor-based pagination.
- `sort`: Sorting configuration (supports multi-field sorting).

---

## 3. Relationship Operation Contracts

A key feature of this project is the ability to handle complex object relationships in a single Mutation. **Relationship operator suffixes also start with `_` and are in uppercase.**

- **_CONNECT**: Establish associations between existing objects (target specified via `where` conditions).
- **_DISCONNECT**: Sever associations between existing objects.
- **_CREATE**: Nestedly create a new object and establish an association.
- **_DELETE**: Cascade delete associated objects.

---

## 4. Response Specification

### Mutation Response (Info Object)
All Mutation interfaces return an Info object containing:
- `nodeCreated`: Number of nodes added in this operation.
- `nodeUpdated`: Number of nodes updated in this operation.
- `nodeDeleted`: Number of nodes deleted in this operation (only for update/delete).
- `models`: Returns a list of object entities after the operation.

---

## 5. Quick Example (Using Mall Product)

### Query Interface Definition
```graphql
queryProducts(
  where: ProductWhere
  option: ProductOption
): [Product!]!
```

### Create Interface Definition
```graphql
createProducts(
  input: [ProductCreate!]!
): CreateProductsInfo!
```

Subsequent chapters will detail the usage of [Query Capabilities (Query)](query.md) and [Mutation Capabilities (Mutation)](mutation.md).
