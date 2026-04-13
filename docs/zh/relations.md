# 关系维护与一致性 (Integrity)

在图数据库中，节点间的“关系”是核心资产。GraphCode 引擎会自动维护关系的双向完整性，并处理复杂的“排他性资源”竞争场景。

## 1. 双向自动同步 (@inv)

在 DSL 中使用 `@inv` 标签定义的字段，其关系是物理对称的。你只需要操作其中一端，另一端会自动更新。

### 业务场景：员工与部门
```graphql
# 部门 -> 员工 (1:N)
Department { employees @type([]Employee) @inv(dept) }
# 员工 -> 部门 (N:1)
Employee { dept @type(Department) @inv(employees) }
```

当你执行 `updateEmployees` 并指定 `dept_CONNECT` 时，系统不仅会建立 `Employee -> Department` 的连接，还会自动将该员工加入到 `Department.employees` 的列表中。

## 2. 1:1 关系的“抢占”特性 (Preemption)

这是 GraphCode 关系引擎最强大的自动化特性。在 1:1 关系（如员工与工位）中，系统会自动处理“断开前任”的逻辑。

### 场景演示：工位争夺
1. **初始状态**：员工 `Alice` 占用了工位 `D-101`。
2. **发生变更**：另一名员工 `Bob` 尝试关联到同一个工位 `D-101`。

```graphql
mutation {
  updateEmployees(
    where: { name: "Bob" },
    update: { desk_CONNECT: { where: { code: "D-101" } } }
  ) { nodeUpdated }
}
```

### 引擎自动执行步骤：
1. **探测 (Detection)**：系统发现 `D-101` 当前已被 `Alice` 占用。
2. **断开前任 (Eviction)**：自动执行 `Alice -[desk]-> D-101` 的物理断开。
3. **建立新欢 (Handover)**：建立 `Bob -[desk]-> D-101` 的新关联。
4. **双向同步 (Sync)**：同步更新 `D-101 -[occupant]-> Bob`。

**最终结果**：`D-101` 的使用者变为 `Bob`，而 `Alice` 的 `desk` 字段自动归零（`null`）。整个过程无需前端手动解绑，从底层强制保障了业务规则的一致性。

## 3. 关系编排操作符参考

| 操作符 | 行为定义 | 典型案例 |
| :--- | :--- | :--- |
| `_CONNECT` | 建立关联 | 给员工分配一个现有工位 |
| `_CREATE` | 嵌套创建并建立关联 | 入职新员工同时创建新工位 |
| `_DISCONNECT` | 仅切断关系 | 员工离职，释放工位 |
| `_DELETE` | 切断关系并物理删除子节点 | 删除部门及下属所有任务 |
| `_REPLACE` | 清空旧列表并关联新创建节点 | 重新定义商品的标签集 |
| `_RECONNECT` | 清空旧列表并关联已有节点 | 重新分配项目组所有成员 |

## 4. 确定性约束与零残留

- **歧义拦截**：对于单对象字段，`where` 条件必须且只能匹配 1 个目标。匹配不到或匹配多个都会导致请求失败。
- **物理清理**：当删除节点时，所有反向关联（`@inv`）及边上的元数据（Facets）会被引擎同步抹除，杜绝产生数据孤立或索引残留。
