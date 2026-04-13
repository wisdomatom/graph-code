# Relationship Maintenance & Consistency (Integrity)

In a graph database, "relationships" between nodes are core assets. The GraphCode engine automatically maintains bidirectional integrity and handles complex "exclusive resource" contention scenarios.

## 1. Automatic Bidirectional Sync (@inv)

Fields defined with the `@inv` tag in the DSL are physically symmetric. You only need to operate on one end, and the other end will update automatically.

### Business Scenario: Employee and Department
```graphql
# Department -> Employee (1:N)
Department { employees @type([]Employee) @inv(dept) }
# Employee -> Department (N:1)
Employee { dept @type(Department) @inv(employees) }
```

When you execute `updateEmployees` and specify `dept_CONNECT`, the system not only establishes the `Employee -> Department` link but also automatically adds that employee to the `Department.employees` list.

## 2. Preemption in 1:1 Relationships

This is the most powerful automation feature of the GraphCode relationship engine. In 1:1 relationships (e.g., between an employee and a desk), the system automatically handles the "disconnect predecessor" logic.

### Scenario Demo: Desk Contention
1.  **Initial State**: Employee `Alice` occupies desk `D-101`.
2.  **The Change**: Another employee `Bob` attempts to associate with the same desk `D-101`.

```graphql
mutation {
  updateEmployees(
    where: { name: "Bob" },
    update: { desk_CONNECT: { where: { code: "D-101" } } }
  ) { nodeUpdated }
}
```

### Engine Automated Execution Steps:
1.  **Detection**: The system discovers that `D-101` is currently occupied by `Alice`.
2.  **Eviction**: Automatically performs the physical disconnection of `Alice -[desk]-> D-101`.
3.  **Handover**: Establishes the new association `Bob -[desk]-> D-101`.
4.  **Sync**: Synchronously updates `D-101 -[occupant]-> Bob`.

**Final Result**: The user of `D-101` becomes `Bob`, and `Alice`'s `desk` field automatically becomes `null`. This entire process requires no manual unbinding from the frontend, mandating business rule consistency at the underlying level.

## 3. Relationship Orchestration Operator Reference

| Operator | Behavior Definition | Typical Case |
| :--- | :--- | :--- |
| `_CONNECT` | Establish relationship | Assign an existing desk to an employee |
| `_CREATE` | Nested creation and association | Hire a new employee and create a new desk simultaneously |
| `_DISCONNECT` | Sever relationship only | Employee leaves, releasing the desk |
| `_DELETE` | Sever relationship and physically delete sub-node | Delete a department and all its subordinate tasks |
| `_REPLACE` | Clear old list and associate newly created nodes | Redefine the tag set of a product |
| `_RECONNECT` | Clear old list and associate existing nodes | Reassign all members of a project group |

## 4. Determinism Constraints & Zero Residuals

-   **Ambiguity Blocking**: For single-object fields, the `where` condition must match **exactly one** target. Matching zero or multiple targets will cause the request to fail.
-   **Physical Cleanup**: When a node is deleted, all reverse associations (`@inv`) and metadata on edges (Facets) are synchronously erased by the engine, preventing data isolation or index residuals.
