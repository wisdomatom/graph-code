# Schema DSL Directive Reference Manual

GraphCode's Schema DSL uses declarative syntax to define models, fields, indexes, and relationships through `@directives` (Annotations). This document provides an in-depth analysis of all supported directives.

---

## 1. Basic Data Types (`@type`)

Directive format: `fieldName @type(T)`.

| Type (T) | Description | Corresponding GraphQL Type | Remarks |
| :--- | :--- | :--- | :--- |
| `string` | String | `String` | - |
| `int` | 64-bit Integer | `ScalarInt` | Supports automatic conversion from Float |
| `float` | 64-bit Floating Point | `Float` | - |
| `bool` | Boolean | `Boolean` | - |
| `datetime` | Date & Time | `ScalarDateTime` | RFC3339 compliant format |
| `float32vector`| AI Vector Type | `[Float!]` | Used for semantic search |
| `geo` | Geospatial | `Geo` | Stores points or polygons (GeoJSON) |
| `ModelName` | **Object Reference** | Object Entity | Defines 1:1 or N:1 relationships |
| `[]ModelName`| **Object List Ref** | Object Entity List | **Shorthand syntax** for 1:N or N:N |

### 💡 Shorthand Syntax Optimization
When defining associated lists, the shorthand syntax is recommended:
- **Full Version**: `users @type(object) @list @ref(User)`
- **Recommended Shorthand**: `users @type([]User)`

---

## 2. Index & Retrieval Directives (`@index`)

| Index Type | Applicable Field Type | Description |
| :--- | :--- | :--- |
| `hash` | `string` | Exact match; suitable for IDs, statuses, etc. |
| `exact` | `string` | Exact match; supports inequality comparison and sorting. |
| `term` | `string` | Term matching; suitable for titles, tags. |
| `fulltext` | `string` | Full-text search; supports multi-language tokenization. |
| `trigram` | `string` | Mandatory for regex matching and fuzzy search (`_REGEX`). |
| `int` / `float` | `int`, `float` | Numeric index; supports range queries (`_GE`, `_LT`, etc.). |
| `hour` / `day` / `month` / `year` | `datetime` | Datetime index granularity. |
| `hnsw` | `float32vector` | Vector index; mandatory for semantic search. |
| `geo` | `geo` | Geospatial index; supports `_NEAR`, `_WITHIN`, etc. |

---

## 3. Constraint & Validation Directives

| Directive | Description | Parameter Example |
| :--- | :--- | :--- |
| `@required` | Mandatory field; enforced during Mutation. | - |
| `@uni` / `@unique` | Global uniqueness constraint. | - |
| `@uniNm(name)` | Named uniqueness constraint; fields with the same name form a **composite unique index**. | `@uniNm(primary)` |
| `@minL` / `@maxL` | Minimum/Maximum string length validation. | `@minL(2) @maxL(64)` |
| `@min` / `@max` | Minimum/Maximum numeric value validation. | `@min(0.01) @max(1000)` |
| `@pattern(re)` | Regular expression validation. | `@pattern("^1[3-9]\\d{9}$")` |
| `@format(fmt)` | Predefined format validation. Supports: `date`, `date-time`, `email`, `ipv4`, `ipv6`, `regex`. | `@format(email)` |

---

## 4. Relationship Orchestration Directives (Core)

GraphCode's powerful deeply nested association capabilities are primarily driven by the following directives.

| Directive | Description | Logical Meaning |
| :--- | :--- | :--- |
| `@ref(Model)` | Reference model. | Defines an edge pointing to the target model. Can be omitted when using `@type(Model)`. |
| `@inv(Field)` | **Inverse Association**. | **Core Directive**. Defines bidirectional linking; modifying one end automatically syncs the other. |
| `@invIL` | **Inverse Is List**. | Marks the reverse edge as `[]object` type. |
| `@inline` | Inline storage. | During `_CREATE`, it is processed as a whole nested entity. |
| `@facets(...)` | Edge attributes. | Stores additional data on the relational edge (e.g., weights, association time). |

### 💡 Automatic Inference of Bidirectional Relationships
GraphCode has powerful relationship inference capabilities. When defining a standard bidirectional association, you only need to define it completely on **one side**, and the system will automatically complete the other side.

**Example: Many-to-Many Relationship between User and UserGroup**
You only need to define `User` as follows:
```graphql
User {
    # Define a list associated with UserGroup, reverse field name is users, and marked reverse as a list
    userGroups @type([]UserGroup) @inv(users) @invIL
}
```
For `UserGroup`, you **don't need to define** the `users` field at all:
```graphql
UserGroup {
    name @type(string) @index(hash)
    # The users field will be automatically completed by the system based on @inv(users) on the User side
}
```

---

## 5. Advanced Enhancement Directives

| Directive | Description | Example |
| :--- | :--- | :--- |
| `@enum(...)` | Defines enum values; supports specifying underlying values. | `@enum(Active(value="A"), Inactive(value="I"))` |
| `@exp(expr)` | **Calculated Field**. Real-time calculation based on an expression engine; not stored. | `total @type(float) @exp("price * quantity")` |
| `@autoCreatedAt` | Automatically maintains creation time. | `createdAt @type(datetime) @index(hour)` |
| `@autoUpdatedAt` | Automatically maintains update time. | `updatedAt @type(datetime) @index(hour)` |
| `@isScalar` | Forces complex structures to be stored as JSON scalars. | `metadata @type(object) @isScalar` |

---

## 6. AI Vector Search Directive (`@vector`)

**Syntax**: `@vector(dim:Dimensions, metric:Metric)`

- **dim**: Vector dimensions (e.g., 1536).
- **metric**: Metric standard; options include `cosine`, `euclidean`, `dot`.

**Example**:
```
embedding @type(float32vector) @vector(dim:1536, metric:cosine) @index(hnsw)
```
