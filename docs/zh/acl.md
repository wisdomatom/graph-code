# ACL 权限控制 (Access Control List)

本项目采用 **Schema 驱动的结构化权限引擎**，支持对数据模型进行细粒度的“字段级访问控制”与“行级数据隔离”。权限规则直接以图节点形式存储，支持动态更新与实时生效。

---

## 1. 核心概念

- **模型级规则 (Schema Rule)**：定义用户对某一特定模型（如 `Employee`）是否具备查询（Query）或修改（Mutation）权限，支持细化到具体字段。
- **行级过滤器 (Schema Filter)**：通过动态表达式（`where` 条件）限制用户能看到的具体数据子集。支持 `$user` 变量注入当前登录用户 ID。
- **策略 (Policy)**：规则的集合，作为权限分配的最小单元。
- **用户组 (UserGroup)**：将一组 Policy 关联到多个用户，实现基于角色的访问控制 (RBAC)。

---

## 2. 业务案例：多级薪资管理

本案例演示如何通过权限配置实现以下逻辑：
1. **老板 (boss)**：查看所有员工基础信息及所有人的薪资。
2. **主管 (executive)**：查看所有员工基础信息，查看除其他主管外的所有员工薪资。
3. **普通员工 (member)**：查看所有员工基础信息，但仅能查看自己的薪资。

### 2.1 定义业务模型

首先定义员工基础信息模型及关联的敏感薪资模型。

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

### 2.2 配置用户组与策略

通过系统内置的 `Meta` 接口进行权限编排。

#### 第一步：创建用户组
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

#### 第二步：定义权限策略 (Policy)

核心逻辑在于 `schemaFilters` 中的 `where` 表达式。

```graphql
mutation {
  upsertMetaPolicys(input: [
    # 老板策略：全量读写
    {
      name: "policy-employee-boss",
      userGroups_CONNECT: { where: { name: "boss" } },
      schemaRules: [
        { schemaName: "Employee", allQuery: true, allMutation: true },
        { schemaName: "EmployeeSensitive", allQuery: true, allMutation: true }
      ]
    },
    # 主管策略：行级过滤限制
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
    # 普通员工策略：仅查看个人薪资
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

## 3. 权限校验表现

### 3.1 行级隔离与变量注入
在 `schemaFilters` 中，系统会自动将字符串 `"$user"` 替换为当前请求上下文中的用户名。
- 当 `member@email.com` 登录并查询 `queryEmployeeSensitives` 时，底层引擎会自动注入 `where: { employee: { user: { name: "member@email.com" } } }`，确保其无法窥探他人隐私。

### 3.2 字段权限与拦截
如果 Policy 中未配置 `allQuery: true`，且 `fields` 列表中未包含某字段，则该字段在 GraphQL 查询中将触发权限错误。

### 3.3 静默脱敏模式 (aclSilent)
在查询 `option` 中开启 `aclSilent: true` 后，无权限的字段将直接返回 `null` 而非抛出错误。这对于需要渲染复杂表格但部分单元格无权查看的场景非常有用。

```graphql
query {
  queryEmployeeSensitives(option: { aclSilent: true }) {
    salary # 无权查看时返回 null
    employee { name }
  }
}
```

## 4. 快速验证与数据准备

为验证上述 Policy 是否生效，可使用管理员权限执行以下数据初始化。

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

使用不同用户身份（通过传递 `Authorization` Token 或在测试环境模拟 Context）登录并执行以下查询：

```graphql
query {
  queryEmployeeSensitives {
    salary
    employee { name }
  }
}
```

- **以 `boss@email.com` 登录**：返回 3 条记录，可见所有人的薪资。
- **以 `executive@email.com` 登录**：返回除其他主管外的记录（在此案例中可见 boss 和 member 的薪资）。
- **以 `member@email.com` 登录**：仅返回 1 条记录（即其自身的薪资）。

---

## 5. 核心管理标准

1. **叠加原则**：权限是累加的（OR 关系）。如果用户属于多个组，其最终权限是所有关联 Policy 的并集。
2. **管理员特权**：具有 `superAdmin` 或 `admin` 类型的 `MetaUser` 将绕过所有 ACL 检查。
3. **推理防护**：系统强制要求排序（Sort）基准必须是用户可见的数据。若用户无权访问某行的排序列，该行将不再出现在排序后的结果集中，以防止通过返回顺序推测敏感数值。
4. **性能保障**：权限过滤在数据库引擎层完成，利用索引进行加速，确保即使在大数据量下依然保持高性能的行级隔离。
