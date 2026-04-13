# 变更能力 (Mutation)

本章介绍如何通过 GraphQL 接口对图数据进行增删改操作。GraphCode 提供了强大的**深度嵌套变更**和**关系编排**语义，支持在单次请求中跨多个模型完成原子化的逻辑操作。

## 1. 业务场景：企业组织架构
为了演示变更能力，我们定义一套包含部门、员工、敏感信息和工位的模型。

### 1.1 DSL 模型定义
```graphql
# 部门模型
Department {
    name @type(string) @index(exact)
    employees @type([]Employee) @inv(dept)
}

# 员工基础信息
Employee {
    name @type(string) @index(exact) @required
    dept @type(Department) @inv(employees)
    desk @type(Desk) @inv(occupant)
    sensitive @type(EmployeeSensitive) @inv(employee)
}

# 员工敏感信息 (用于 ACL 隔离演示)
EmployeeSensitive {
    salary @type(float)
    employee @type(Employee) @inv(sensitive)
}

# 工位模型
Desk {
    code @type(string) @index(exact) @required
    occupant @type(Employee) @inv(desk)
}
```

## 2. 基础变更接口

系统为每个模型自动生成 `create`, `update`, `upsert`, `delete` 四类接口。

### 2.1 批量创建 (Create)
创建接口支持一次性录入多个同类节点。
```graphql
mutation {
  createDepartments(input: [
    { name: "Engineering" },
    { name: "Marketing" }
  ]) {
    nodeCreated # 返回创建的节点总数
    departments { id name } # 返回创建后的详情（含 ID）
  }
}
```

## 3. 深度嵌套变更 (Relational Mutations)

GraphCode 的核心优势在于允许你以“树状”结构描述变更逻辑，系统会自动将其拆解为高性能的图操作。

### 3.1 嵌套创建 (_CREATE)
你可以在创建主对象的同时，同步创建其关联的子对象。
```graphql
mutation {
  createDepartments(input: [{
    name: "Engineering",
    # 在创建部门的同时，创建一名员工及其敏感信息
    employees_CREATE: [{
      name: "Alice",
      sensitive_CREATE: { salary: 15000.0 }
    }]
  }]) {
    nodeCreated
  }
}
```

### 3.2 条件关联 (_CONNECT)
将已有节点建立关联。系统会根据 `where` 条件召回目标节点并连边。
```graphql
mutation {
  updateEmployees(
    where: { name: "Alice" }, 
    update: {
      # 将 Alice 关联到 code 为 D-101 的工位
      desk_CONNECT: { where: { code: "D-101" } }
    }
  ) {
    nodeUpdated
  }
}
```

### 3.3 级联删除与解绑 (_DELETE / _DISCONNECT)
- **`_DISCONNECT`**: 仅切断关系，子节点依然存在。
- **`_DELETE`**: 切断关系的同时，物理删除子节点（级联清理）。
```graphql
mutation {
  updateEmployees(
    where: { name: "Alice" },
    update: {
      # 物理删除 Alice 的敏感信息节点
      sensitive_DELETE: { where: { salary_GT: 0 } }
    }
  ) {
    nodeUpdated
  }
}
```

## 4. 事务与原子性

1. **原子性 (Atomicity)**：一笔 Mutation 请求对应底层一个数据库事务。内部任何一个嵌套操作失败（如唯一性冲突），整笔请求将完全回滚。
2. **确定性校验**：对于单对象引用字段（如 `Employee.desk`），执行 `_CONNECT` 时其 `where` 条件必须且只能匹配到 **1 个** 目标节点，否则系统会抛出错误以防止歧义。
3. **即时可见**：变更提交后，底层索引会同步更新。紧随其后的 Query 请求可以立即查到最新数据。
