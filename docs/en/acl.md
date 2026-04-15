# ACL Access Control (Access Control List)

This project adopts a **Schema-Driven Structured Permission Engine**, supporting fine-grained "Field-level Access Control" and "Row-level Data Isolation". Permission rules are stored directly as graph nodes, supporting dynamic updates and real-time enforcement.

---

## 1. Core Concepts

- **Schema Rule**: Defines whether a user has Query or Mutation permissions for a specific model (e.g., `Employee`), supporting granular control down to specific fields.
- **Schema Filter**: Restricts the specific subset of data a user can see through dynamic expressions (`where` conditions). Supports the `$user` variable to inject the current logged-in user ID.
- **Policy**: A collection of rules, acting as the minimum unit for permission assignment.
- **UserGroup**: Associates a set of Policies with multiple users, implementing Role-Based Access Control (RBAC).

---

## 2. Business Case: Multi-level Salary Management

This case demonstrates how to implement the following logic through permission configuration:
1. **Boss**: Can view basic info and salaries of all employees.
2. **Executive**: Can view basic info of all employees, and salaries of all employees except other executives.
3. **Member**: Can view basic info of all employees, but can only view their own salary.

### 2.1 Define Business Models

First, define the basic employee info model and the associated sensitive salary model.

```graphql
Employee {
    name @type(string) @index(exact)
    email @type(string) @index(exact) @uni @uniNm(primary) @format(email)
    user @type(object) @ref(MetaUser) @inv(employee)
    userGroups @type([]object) @ref(MetaUserGroup) @inv(employees) @invIL
    type @type(string) @index(hash) @enum(internal,cp,ip)
}

EmployeeSensitive {
    salary @type(float) @index(float)
    employee @type(object) @ref(Employee) @inv(sensitive)
}
```

### 2.2 Configure UserGroups and Policies

Orchestrate permissions via the built-in `Meta` interface.

#### Step 1: Create UserGroups
```graphql
mutation {
  upsertMetaUserGroups(input: [
    { name: "boss" },
    { name: "executive" },
    { name: "member" }
  ]) {
    nodeCreated
  }
}
```

#### Step 2: Define Permission Policies

The core logic lies in the `where` expression within `schemaFilters`.

```graphql
mutation {
  upsertMetaPolicys(input: [
    # Boss Policy: Full read/write
    {
      name: "policy-employee-boss",
      userGroups_CONNECT: { where: { name: "boss" } },
      schemaRules: [
        { schemaName: "Employee", allQuery: true, allMutation: true },
        { schemaName: "EmployeeSensitive", allQuery: true, allMutation: true }
      ]
    },
    # Executive Policy: Row-level filtering restriction
    {
      name: "policy-employee-executive",
      userGroups_CONNECT: { where: { name: "executive" } },
      schemaRules: [
        { schemaName: "Employee", allQuery: true, allMutation: true },
        { schemaName: "EmployeeSensitive", allQuery: true }
      ],
      schemaFilters: [
        {
          schemaName: "EmployeeSensitive",
          where: {
            OR: [
              { employee: { user: { userGroups: { NOT: { name: "executive" } } } } },
              { employee: { user: { name: "$user" } } }
            ]
          }
        }
      ]
    },
    # Member Policy: View personal salary only
    {
      name: "policy-employee-member",
      userGroups_CONNECT: { where: { name: "member" } },
      schemaRules: [
        { schemaName: "Employee", allQuery: true, allMutation: true },
        { schemaName: "EmployeeSensitive", allQuery: true }
      ],
      schemaFilters: [
        {
          schemaName: "EmployeeSensitive",
          where: { employee: { user: { name: "$user" } } }
        }
      ]
    }
  ]) {
    nodeCreated
  }
}
```

---

## 3. Permission Enforcement Behavior

### 3.1 Row-level Isolation & Variable Injection
In `schemaFilters`, the system automatically replaces the string `"$user"` with the username from the current request context.
- When `member@email.com` logs in and queries `queryEmployeeSensitives`, the underlying engine automatically injects `where: { employee: { user: { name: "member@email.com" } } }`, ensuring they cannot spy on others' privacy.

### 3.2 Field Permissions & Blocking
If `allQuery: true` is not configured in the Policy and a field is not included in the `fields` list, querying that field in GraphQL will trigger a permission error.

### 3.3 Silent Masking Mode (aclSilent)
When `aclSilent: true` is enabled in the query `option`, unauthorized fields will return `null` instead of throwing an error. This is useful for complex frontend pages where some cells in a table may not be viewable.

```graphql
query {
  queryEmployeeSensitives(option: { aclSilent: true }) {
    salary # Returns null if unauthorized
    employee { name }
  }
}
```

## 4. Rapid Verification & Data Preparation

To verify if the above Policies take effect, perform the following data initialization with admin privileges.

```graphql
mutation {
  createMetaUsers(input: [
    {
      name: "boss@email.com",
      userType: guest,
      userGroups_CONNECT: { where: { name: "boss" } },
      employee_CREATE: {
        name: "boss",
        email: "boss@email.com",
        sensitive_CREATE: { salary: 100000.0 }
      }
    },
    {
      name: "executive@email.com",
      userType: guest,
      userGroups_CONNECT: { where: { name: "executive" } },
      employee_CREATE: {
        name: "executive-1",
        email: "executive-1@email.com",
        sensitive_CREATE: { salary: 50000.0 }
      }
    },
    {
      name: "member@email.com",
      userType: guest,
      userGroups_CONNECT: { where: { name: "member" } },
      employee_CREATE: {
        name: "member-1",
        email: "member-1@email.com",
        sensitive_CREATE: { salary: 20000.0 }
      }
    }
  ]) {
    nodeCreated
  }
}
```

Log in with different user identities (via `Authorization` Token or simulated Context in test environments) and execute the following query:

```graphql
query {
  queryEmployeeSensitives {
    salary
    employee { name }
  }
}
```

- **Login as `boss@email.com`**: Returns 3 records, all salaries visible.
- **Login as `executive@email.com`**: Returns records except other executives (in this case, boss and member salaries are visible).
- **Login as `member@email.com`**: Returns only 1 record (their own salary).

---

## 5. Core Management Standards

1. **Additive Principle**: Permissions are additive (OR relationship). If a user belongs to multiple groups, their final permissions are the union of all associated Policies.
2. **Admin Privilege**: Users with `superAdmin` or `admin` types in `MetaUser` bypass all ACL checks.
3. **Inference Protection**: The system mandates that sorting (Sort) criteria must be data visible to the user. If a user is unauthorized to access the sorting column of a row, that row will not appear in the sorted result set, preventing inference of sensitive values through return order.
4. **Performance Guarantee**: Permission filtering is completed at the database engine level, leveraging indexing for acceleration, ensuring high-performance row-level isolation even with large datasets.
