# 查询能力 (Query)

GraphCode 提供了一套高度标准化的声明式查询接口。无论底层图模型多么复杂，前端都可以通过统一的 `where`（过滤）和 `option`（控制）参数，实现从基础检索到深度链路分析的各种业务需求。

---

## 1. 标量过滤操作符

系统根据字段类型自动生成对应的过滤后缀。所有后缀均以 `_` 开头。

### 1.1 字符串 (String) 过滤
| 操作符 | 示例 | 说明 |
| :--- | :--- | :--- |
| (无) | `name: "Alice"` | 精确匹配。要求开启 `@index(hash)` 或 `exact`。 |
| `_IN` | `status_IN: ["A", "B"]` | 集合匹配，匹配列表中的任意值。 |
| `_REGEX` | `email_REGEX: ".*@gmail.com"` | 正则匹配。要求开启 `@index(trigram)`。 |
| `_ALLOFTEXT` | `content_ALLOFTEXT: "GraphCode Engine"` | 全文检索：匹配包含所有指定单词的记录。要求开启 `@index(fulltext)`。 |
| `_ANYOFTEXT` | `content_ANYOFTEXT: "Graph AI"` | 全文检索：匹配包含任意指定单词的记录。要求开启 `@index(fulltext)`。 |

### 1.2 数值 (Int/Float) 与 时间 (Datetime) 过滤
这些类型共享一套范围比较操作符，要求开启对应的数值或时间索引。

| 操作符 | 说明 | 示例 |
| :--- | :--- | :--- |
| `_GT` / `_GE` | 大于 / 大于等于 | `price_GE: 100` |
| `_LT` / `_LE` | 小于 / 小于等于 | `stock_LT: 10` |
| `_BETWEEN` | 闭区间范围查询 | `age_BETWEEN: {start: 18, end: 35}` |

---

## 2. 逻辑编排：AND, OR, NOT

你可以通过逻辑块对上述操作符进行无限层级的嵌套组合。

- **AND**: 所有条件必须同时满足（默认行为）。
- **OR**: 满足其中之一即可。
- **NOT**: 排除满足条件的记录。

**示例：** 查询“价格在 500 以上的电子产品”或者“所有促销中的商品”。
```graphql
query {
  queryProducts(where: {
    OR: [
      { AND: [{ category: { name: "电子" } }, { price_GT: 500 }] },
      { isPromotion: true }
    ]
  }) { name price }
}
```

---

## 3. 深度关联查询：GraphCode 的核心威力

图数据库的真正优势在于处理复杂的关系链路。GraphCode 将这种能力封装为极简的嵌套对象语法。

### 3.1 跨模型链路检索
**业务场景**：在大型数据中心运维中，我们需要查询位于 `A数据中心` -> `B机房` -> `C机架` -> `D交换机` 下的所有服务器。

这种“五层链路”在传统开发中需要编写复杂的 Join 逻辑或特定的 API。在 GraphCode 中，你只需按关系路径描述即可：

```graphql
query {
  queryServers(where: {
    switch: {
      rack: {
        room: {
          dataCenter: { name: "A数据中心" }
        },
        code: "C机架"
      }
    }
  }) { 
    name 
    ip 
  }
}
```

### 3.2 跨关联对象过滤
**业务场景**：在 HR 系统中，查询属于 `研发部` 下 `AI项目组`，且 `今天没有休假` 的 `后端开发` 同事。

这涉及到对多个关联模型（部门、项目、休假记录）的同步过滤：

```graphql
query {
  queryEmployees(where: {
    dept: { name: "研发部" },
    projects: { name: "AI项目组" },
    role: "Backend",
    NOT: { 
      leaves: { date: "2026-03-15" } # 过滤掉今天有休假记录的员工
    }
  }) { 
    name 
    email 
  }
}
```

---

## 4. 查询结果控制 (Option)

通过 `option` 参数，你可以精确控制返回的数据量、排序以及安全脱敏行为。

- **limit / offset**: 标准分页。
- **sort**: 多字段有序排序（例如：`sort: [{ age: DESC }, { name: ASC }]`）。
- **aclSilent**: **[商业级特性]** 开启后，对于用户无权限访问的字段将静默返回 `null` 而非报错，极大简化前端适配逻辑。

---

## 5. 聚合与统计 (Aggregation)

GraphCode 自动为每个模型生成了强大的聚合查询接口，支持实时计算总数、总和、平均值等统计指标。

### 5.1 基础计数 (Count)
如果你只需要知道符合条件的记录条数，使用 `countModels`。
```graphql
query {
  countServers(where: { status: "Online" }) # 返回一个整数
}
```

### 5.2 综合统计 (Aggregate)
使用 `aggregateModels` 接口可以一次性获取多个维度的统计数据。系统会自动识别数值型字段并提供 `sum`, `avg`, `min`, `max` 能力。

```graphql
query {
  aggregateOrders(where: { date_GE: "2026-01-01" }) {
    count                # 订单总数
    amount {             # 对金额字段进行统计
      sum
      avg
      max
    }
  }
}
```

### 5.3 嵌套关联聚合
在查询一个模型时，你往往需要知道它关联了多少个子对象。GraphCode 为每个列表型关联字段生成了对应的 `FieldNameAggregate` 属性。

**业务场景**：查询所有用户组，并显示每个组下的用户总数。
```graphql
query {
  queryUserGroups {
    name
    # 获取该组下关联用户的统计信息
    usersAggregate {
      count
    }
  }
}
```

---

## 6. 为什么选择 GraphCode 的查询模式？

### 5.1 解决研发资源浪费
传统的 SQL Join 方案是“手工业模式”：
1. 每个新查询需求都需要后端手写代码、定义参数、编写 SQL。
2. 随着业务变更，这些手写接口会迅速“腐烂”，维护成本极高。
3. 不同开发者的接口风格迥异，团队协作摩擦大。

**GraphCode 提供的是“工业自动化模式”**：
- **一套接口，万能组合**：后端只需定义模型（Schema），前端即可自由组合出成千上万种查询，无需后端再改一行代码。
- **天然向后兼容**：增加新字段或新关系后，所有原有查询能力自动升级，无任何重构成本。

### 5.2 极致的一致性
GraphCode 强制全项目使用统一的查询语言。这意味着任何公司的技术栈、任何规模的团队，都能拥有一套**标准、通用、可预测**的 API 契约，这正是构建大型复杂商业系统的基石。
