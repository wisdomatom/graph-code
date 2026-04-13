# Data Modeling Guide (Schema DSL)

The core development experience of GraphCode stems from **Schema-Driven Design**. You simply define your business domain models through a declarative DSL, and the system automatically constructs high-performance graph infrastructure, GraphQL APIs, and permission validation logic for you.

---

## 1. Define Your First Model

A model consists of a **Model Name** followed by a pair of **Curly Braces**. It is recommended to use UpperCamelCase for model names (e.g., `UserGroup`).

```graphql
# Define a simple User model
User {
    username @type(string) @index(hash) @required @uni @uniNm(primary)
    age @type(int) @index(int)
}
```

## 2. Establishing Graph Relationships (Relations)

The soul of a graph database lies in its relationships. GraphCode supports three core modeling patterns:

### 2.1 One-to-One (1:1) Exclusive Association
Suitable for scenarios like "Employee and Desk" or "User and Profile."
```
Employee {
    name @type(string) @index(exact)
    desk @type(Desk) @inv(occupant)
}
Desk {
    code @type(string) @index(exact)
    occupant @type(Employee) @inv(desk)
}
```
> **Note**: GraphCode automatically maintains bidirectional consistency. If Bob preempts Alice's desk, Alice's `desk` field will be automatically cleared.

### 2.2 One-to-Many (1:N) Bidirectional Association
The most common scenario, such as "Department and Employee" or "Category and Product."
```
Department {
    name @type(string) @index(exact)
    employees @type([]Employee) @inv(dept)
}
Employee {
    name @type(string) @index(exact)
    dept @type(Department) @ref(Department) @inv(employees) @invIL
}
```

### 2.3 Many-to-Many (N:N) Association
Such as "User and Role" or "Student and Course." Simply use `[]` types on both ends and set `@inv` correspondingly.

---

## 3. Using Interfaces for Abstraction

Interfaces are an advanced feature of GraphCode used to **enforce unified fields across models** or implement **global uniqueness constraints**.

### Scenario: Global Uniqueness for Asset Codes Across Devices
```
# Define the base interface
BaseAsset @isInterface {
    assetCode @type(string) @uni @uniNm(primary) @index(hash)
}

# Server inherits from BaseAsset
Server @interface(BaseAsset) {
    cpuCount @type(int)
}

# Switch inherits from BaseAsset
Switch @interface(BaseAsset) {
    portCount @type(int)
}
```
In this way, the `assetCode` cannot be duplicated even between a `Server` and a `Switch`.

---

## 4. Advanced Model Configuration

*   **Enable Auditing (`@mutRecord`)**: Add this directive after the model name, and the system will automatically record all change details for that model.
*   **Calculated Fields (`@exp`)**: Define real-time calculated properties for query-only use.
*   **Geospatial (`@type(geo)`)**: Define coordinate fields with spatial search capabilities (supporting points and polygons).

---

## 5. Further Learning

When you are ready to dive deeper into specific directives (such as index types, validation rules, or vector configurations), please refer to:

👉 **[Schema DSL Directive Reference Manual](./schema-dsl-reference.md)**
