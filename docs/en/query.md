# Query Capabilities (Query)

GraphCode provides a highly standardized set of declarative query interfaces. Regardless of how complex the underlying graph model is, the frontend can address various business needs—from basic retrieval to deep link analysis—through unified `where` (filtering) and `option` (control) parameters.

---

## 1. Scalar Filter Operators

The system automatically generates corresponding filter suffixes based on field types. All suffixes start with `_`.

### 1.1 String Filtering
| Operator | Example | Description |
| :--- | :--- | :--- |
| (None) | `name: "Alice"` | Exact match. Requires `@index(hash)` or `exact`. |
| `_IN` | `status_IN: ["A", "B"]` | Set matching; matches any value in the list. |
| `_REGEX` | `email_REGEX: ".*@gmail.com"` | Regular expression match. Requires `@index(trigram)`. |
| `_ALLOFTEXT` | `content_ALLOFTEXT: "GraphCode Engine"` | Full-text search: matches records containing all specified words. Requires `@index(fulltext)`. |
| `_ANYOFTEXT` | `content_ANYOFTEXT: "Graph AI"` | Full-text search: matches records containing any of the specified words. Requires `@index(fulltext)`. |

### 1.2 Numeric (Int/Float) & DateTime Filtering
These types share a set of range comparison operators, requiring corresponding numeric or datetime indexes.

| Operator | Description | Example |
| :--- | :--- | :--- |
| `_GT` / `_GE` | Greater Than / Greater Than or Equal To | `price_GE: 100` |
| `_LT` / `_LE` | Less Than / Less Than or Equal To | `stock_LT: 10` |
| `_BETWEEN` | Closed interval range query | `age_BETWEEN: {start: 18, end: 35}` |

---

## 2. Logical Orchestration: AND, OR, NOT

You can combine the above operators through logical blocks with infinite nesting levels.

- **AND**: All conditions must be met simultaneously (default behavior).
- **OR**: Any one of the conditions must be met.
- **NOT**: Excludes records that meet the conditions.

**Example:** Query "Electronic products priced above 500" OR "All products currently in promotion."
```graphql
query {
  queryProducts(where: {
    OR: [
      { AND: [{ category: { name: "Electronics" } }, { price_GT: 500 }] },
      { isPromotion: true }
    ]
  }) { name price }
}
```

---

## 3. Deep Relationship Query: The Core Power of GraphCode

The true advantage of graph databases lies in handling complex relationship chains. GraphCode encapsulates this power into a minimalist nested object syntax.

### 3.1 Cross-Model Chain Retrieval
**Business Scenario**: In large data center operations, we need to query all servers located in `Data Center A` -> `Room B` -> `Rack C` -> `Switch D`.

This "five-layer chain" would traditionally require writing complex Join logic or specific APIs. In GraphCode, you simply describe it along the relationship path:

```graphql
query {
  queryServers(where: {
    switch: {
      rack: {
        room: {
          dataCenter: { name: "Data Center A" }
        },
        code: "Rack C"
      }
    }
  }) { 
    name 
    ip 
  }
}
```

### 3.2 Cross-Relational Object Filtering
**Business Scenario**: In an HR system, query colleagues belonging to the `R&D Dept` -> `AI Project Group`, who are `Backend Developers`, and `Have no leave today`.

This involves simultaneous filtering across multiple related models (Department, Project, Leave records):

```graphql
query {
  queryEmployees(where: {
    dept: { name: "R&D Dept" },
    projects: { name: "AI Project Group" },
    role: "Backend",
    NOT: { 
      leaves: { date: "2026-03-15" } # Filters out employees who have a leave record today
    }
  }) { 
    name 
    email 
  }
}
```

---

## 4. Query Result Control (Option)

Through the `option` parameter, you can precisely control the amount of data returned, sorting, and security masking behavior.

- **limit / offset**: Standard pagination.
- **sort**: Multi-field ordered sorting (e.g., `sort: [{ age: DESC }, { name: ASC }]`).
- **aclSilent**: **[Enterprise Feature]** When enabled, fields the user is unauthorized to access will return `null` silently instead of an error, greatly simplifying frontend adaptation logic.

---

## 5. Aggregation & Statistics

GraphCode automatically generates powerful aggregation query interfaces for each model, supporting real-time calculation of totals, sums, averages, and other statistical metrics.

### 5.1 Basic Counting (Count)
If you only need to know the number of records matching the criteria, use `countModels`.
```graphql
query {
  countServers(where: { status: "Online" }) # Returns an integer
}
```

### 5.2 Comprehensive Statistics (Aggregate)
The `aggregateModels` interface allows you to retrieve statistical data across multiple dimensions in one go. The system automatically identifies numeric fields and provides `sum`, `avg`, `min`, and `max` capabilities.

```graphql
query {
  aggregateOrders(where: { date_GE: "2026-01-01" }) {
    count                # Total orders
    amount {             # Statistics for the amount field
      sum
      avg
      max
    }
  }
}
```

### 5.3 Nested Relational Aggregation
When querying a model, you often need to know how many sub-objects it is associated with. GraphCode generates a corresponding `FieldNameAggregate` property for every list-type relational field.

**Business Scenario**: Query all user groups and display the total number of users in each group.
```graphql
query {
  queryUserGroups {
    name
    # Retrieve statistical info for users associated with this group
    usersAggregate {
      count
    }
  }
}
```

---

## 6. Why Choose GraphCode's Query Pattern?

### 6.1 Eliminate R&D Resource Waste
Traditional SQL Join solutions are "handicraft modes":
1. Every new query requirement requires the backend to manually write code, define parameters, and write SQL.
2. As business changes, these hand-written interfaces quickly "rot," leading to extremely high maintenance costs.
3. Different developers have disparate interface styles, leading to significant friction in team collaboration.

**GraphCode provides an "Industrial Automation Mode"**:
- **One Set of Interfaces, Infinite Combinations**: The backend only needs to define the model (Schema), and the frontend can freely combine thousands of query variations without the backend changing a single line of code.
- **Naturally Backward Compatible**: When new fields or relationships are added, all existing query capabilities are automatically upgraded with zero refactoring cost.

### 6.2 Ultimate Consistency
GraphCode enforces a unified query language across the entire project. This means any company's tech stack and any size team can have a **standard, universal, and predictable** API contract—the cornerstone for building large, complex commercial systems.
