# Mutation Capabilities (Mutation)

This chapter explains how to perform create, update, and delete operations on graph data via the GraphQL interface. GraphCode provides powerful **deeply nested mutation** and **relationship orchestration** semantics, supporting atomic logical operations across multiple models in a single request.

## 1. Business Scenario: Corporate Organizational Structure
To demonstrate mutation capabilities, we define a set of models including departments, employees, sensitive info, and desks.

### 1.1 DSL Model Definition
```graphql
# Department Model
Department {
    name @type(string) @index(exact)
    employees @type([]Employee) @inv(dept)
}

# Basic Employee Info
Employee {
    name @type(string) @index(exact) @required
    dept @type(Department) @inv(employees)
    desk @type(Desk) @inv(occupant)
    sensitive @type(EmployeeSensitive) @inv(employee)
}

# Sensitive Employee Info (for ACL isolation demo)
EmployeeSensitive {
    salary @type(float)
    employee @type(Employee) @inv(sensitive)
}

# Desk Model
Desk {
    code @type(string) @index(exact) @required
    occupant @type(Employee) @inv(desk)
}
```

## 2. Basic Mutation Interfaces

The system automatically generates four types of interfaces for each model: `create`, `update`, `upsert`, and `delete`.

### 2.1 Batch Creation (Create)
The create interface supports entering multiple nodes of the same type at once.
```graphql
mutation {
  createDepartments(input: [
    { name: "Engineering" },
    { name: "Marketing" }
  ]) {
    nodeCreated # Returns total number of nodes created
    departments { id name } # Returns details of created nodes (including IDs)
  }
}
```

## 3. Deeply Nested Mutations (Relational Mutations)

GraphCode's core advantage lies in allowing you to describe mutation logic in a "tree-like" structure, which the system automatically deconstructs into high-performance graph operations.

### 3.1 Nested Creation (_CREATE)
You can create sub-objects simultaneously while creating the main object.
```graphql
mutation {
  createDepartments(input: [{
    name: "Engineering",
    # Create an employee and their sensitive info while creating the department
    employees_CREATE: [{
      name: "Alice",
      sensitive_CREATE: { salary: 15000.0 }
    }]
  }]) {
    nodeCreated
  }
}
```

### 3.2 Conditional Association (_CONNECT)
Establish relationships between existing nodes. The system recalls target nodes based on `where` conditions and links them.
```graphql
mutation {
  updateEmployees(
    where: { name: "Alice" }, 
    update: {
      # Associate Alice with the desk whose code is D-101
      desk_CONNECT: { where: { code: "D-101" } }
    }
  ) {
    nodeUpdated
  }
}
```

### 3.3 Cascading Deletion & Unbinding (_DELETE / _DISCONNECT)
- **`_DISCONNECT`**: Only severs the relationship; the sub-node continues to exist.
- **`_DELETE`**: Severs the relationship and physically deletes the sub-node (cascading cleanup).
```graphql
mutation {
  updateEmployees(
    where: { name: "Alice" },
    update: {
      # Physically delete Alice's sensitive info node
      sensitive_DELETE: { where: { salary_GT: 0 } }
    }
  ) {
    nodeUpdated
  }
}
```

## 4. Transactions & Atomicity

1. **Atomicity**: A single Mutation request corresponds to one underlying database transaction. If any nested operation fails (e.g., uniqueness conflict), the entire request is fully rolled back.
2. **Determinism Validation**: For single-object reference fields (e.g., `Employee.desk`), the `where` condition in a `_CONNECT` operation must match **exactly one** target node; otherwise, the system throws an error to prevent ambiguity.
3. **Immediate Visibility**: Once a mutation is committed, the underlying indexes are updated synchronously. Subsequent Query requests can immediately retrieve the latest data.
