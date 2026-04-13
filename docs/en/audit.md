# Change Auditing (Audit / MutRecord)

This project implements full traceability of business data changes through a built-in auditing mechanism. This mechanism not only records "who did what and when" but also accurately captures field-level changes using **Incremental Storage** technology.

---

## 1. Core Features

- **On-demand Activation**: Auditing is only triggered for models marked with `@mutRecord` in the DSL, balancing performance and compliance.
- **Incremental Storage (Delta-Only)**: The system automatically compares snapshots before and after changes, storing only the modified fields (`recordRemoveFieldEqual` logic), greatly saving storage space and simplifying Diff analysis.
- **Relationship Traceability**: Supports recording relational operations like `_CONNECT` and `_DISCONNECT`, automatically logging the UIDs of associated objects.
- **User Identification**: Automatically records the `Operator` (executor) and `OriOperator` (original operator, used in proxy/impersonation scenarios) of the current operation.
- **Real-time Notification**: The generation of an audit record simultaneously triggers a `notify` event, allowing downstream systems to perform real-time processing (e.g., sending emails, syncing to data warehouses).

---

## 2. Enable Auditing

Add the `@mutRecord` annotation to the model definition.

```graphql
# E-commerce Case: Enable auditing for the Order model
Order @mutRecord {
    orderNo @type(string) @index(exact)
    status @type(string) @enum(pending, paid, shipped)
    amount @type(float)
    customer @type(object) @ref(MetaUser)
}
```

---

## 3. Audit Model Structure (`MetaMutRecord`)

The system uses the built-in `MetaMutRecord` model to store audit data:

| Field | Type | Description |
| :--- | :--- | :--- |
| `at` | `datetime` | Timestamp of the operation |
| `op` | `string` | Operation type: `_CREATE`, `_UPDATE`, `_DELETE`, `_CONNECT`, `_DISCONNECT`, etc. |
| `schema` | `string` | Name of the model being operated on |
| `objId` | `string` | Unique identifier (UID) of the operated entity |
| `operator` | `string` | Username of the executor |
| `source` | `json` | Incremental snapshot **before** the change (only modified fields) |
| `target` | `json` | Incremental snapshot **after** the change (only modified fields) |
| `field` | `[string]` | List of names of all fields involved in this change |

---

## 4. Case Demo: Order Status Change

Assume the `admin` user changes the status of order `0x123` from `paid` to `shipped`.

### 4.1 Execute Change
```graphql
mutation {
  updateOrders(where: { id: "0x123" }, update: { status: "shipped" }) {
    nodeUpdated
  }
}
```

### 4.2 Query Audit Records
Audit records are stored in system models and are typically queried by users with `admin` privileges.

```graphql
query {
  queryMetaMutRecords(where: { objId: "0x123" }) {
    at
    op
    operator
    source # Returns JSON string: {"status": "paid"}
    target # Returns JSON string: {"status": "shipped"}
    field  # Returns ["status"]
  }
}
```

### 4.3 Incremental Storage Logic Explanation
If the order has 50 other fields that remain unchanged, `source` and `target` will **completely exclude** those fields. This design allows developers to see at a glance "exactly what changed".

---

## 5. Relationship Auditing (Connect / Disconnect)

For operations on relational fields, audit records capture the establishment and severance of relationships.

- **`_CONNECT`**: `target` will contain the UID or Display identifier of the newly associated object.
- **`_DISCONNECT`**: `source` will contain the UID or Display identifier of the severed object.

---

## 6. Development Recommendations

1. **Silent Changes**: For system-triggered auxiliary field updates (e.g., `updatedAt`), if you don't want to generate audit records, you can disable auditing sensitivity for that field in the `MetaProperty` configuration.
2. **Large Data Optimization**: Since audit logs grow rapidly with business volume, it is recommended to periodically export historical `MetaMutRecord` data to cold storage.
3. **Query Authorization**: `MetaMutRecord` contains sensitive operation history; strictly limit its query permissions in `UpsertACL` to auditors or system administrators only.
