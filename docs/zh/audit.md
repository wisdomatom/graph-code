# 变更审计 (Audit / MutRecord)

本项目通过内置审计机制实现对业务数据变更的全程追溯。该机制不仅记录“谁在何时做了什么”，还通过**增量存储**技术精准捕获字段级的变化。

---

## 1. 核心特性

- **按需开启**：仅在 DSL 中标记了 `@mutRecord` 的模型才会触发审计，兼顾性能与合规。
- **增量存储 (Delta-Only)**：系统自动对比变更前后的快照，仅存储发生变动的字段（`recordRemoveFieldEqual` 逻辑），极大节省存储空间并简化 Diff 分析。
- **关联追溯**：支持记录 `_CONNECT`、`_DISCONNECT` 等关系型操作，并自动记录关联对象的 UIDs。
- **用户识别**：自动记录当前操作的 `Operator`（执行者）以及 `OriOperator`（原始操作者，用于代操作场景）。
- **实时通知**：审计记录的产生会同步触发 `notify` 事件，支持下游系统进行实时处理（如发送邮件、同步数仓）。

---

## 2. 启用审计

在模型定义上添加 `@mutRecord` 注解。

```graphql
# 商城案例：订单模型开启审计
Order @mutRecord {
    orderNo @type(string) @index(exact)
    status @type(string) @enum(pending, paid, shipped)
    amount @type(float)
    customer @type(object) @ref(MetaUser)
}
```

---

## 3. 审计模型结构 (`MetaMutRecord`)

系统内置了 `MetaMutRecord` 模型来存储审计数据：

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `at` | `datetime` | 操作发生的时间戳 |
| `op` | `string` | 操作类型：`_CREATE`, `_UPDATE`, `_DELETE`, `_CONNECT`, `_DISCONNECT` 等 |
| `schema` | `string` | 被操作的模型名称 |
| `objId` | `string` | 被操作实体的唯一标识 (UID) |
| `operator` | `string` | 当前执行操作的用户名 |
| `source` | `json` | 变更**前**的增量快照（仅包含发生变化的字段） |
| `target` | `json` | 变更**后**的增量快照（仅包含发生变化的字段） |
| `field` | `[string]` | 本次变更涉及的所有字段名列表 |

---

## 4. 案例演示：订单状态变更

假设 `admin` 用户将订单 `0x123` 的状态从 `paid` 修改为 `shipped`。

### 4.1 执行变更
```graphql
mutation {
  updateOrders(where: { id: "0x123" }, update: { status: "shipped" }) {
    nodeUpdated
  }
}
```

### 4.2 查询审计记录
审计记录存储在系统模型中，通常由具有 `admin` 权限的用户查询。

```graphql
query {
  queryMetaMutRecords(where: { objId: "0x123" }) {
    at
    op
    operator
    source # 返回 JSON 字符串: {"status": "paid"}
    target # 返回 JSON 字符串: {"status": "shipped"}
    field  # 返回 ["status"]
  }
}
```

### 4.3 增量存储逻辑说明
如果订单还有其他 50 个字段未发生变化，`source` 和 `target` 中将**完全不包含**这些字段。这种设计使得开发者可以一眼看出“到底改了哪里”。

---

## 5. 关联审计 (Connect / Disconnect)

对于关联字段的操作，审计记录会捕获关联关系的建立与断开。

- **`_CONNECT`**：`target` 中会包含新关联对象的 UID 或 Display 标识。
- **`_DISCONNECT`**：`source` 中会包含断开关联对象的 UID 或 Display 标识。

---

## 6. 开发建议

1. **静默变更**：对于系统自动触发的辅助字段更新（如 `updatedAt`），如果不想产生审计记录，可在 `MetaProperty` 配置中关闭该字段的审计敏感度。
2. **大数据量优化**：由于审计日志随业务量增长较快，建议定期将 `MetaMutRecord` 的历史数据导出至冷存储。
3. **查询鉴权**：`MetaMutRecord` 包含敏感操作历史，务必在 `UpsertACL` 中严格限制其查询权限，仅开放给审计员或系统管理员。
