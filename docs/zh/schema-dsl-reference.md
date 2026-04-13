# Schema DSL 指令参考手册

GraphCode 的 Schema DSL 采用声明式语法，通过 `@指令`（Annotations）定义模型、字段、索引及关系。本文档提供所有支持指令的深度解析。

---

## 1. 基础数据类型 (`@type`)

指令格式：`fieldName @type(T)`。

| 类型 (T) | 说明 | 对应 GraphQL 类型 | 备注 |
| :--- | :--- | :--- | :--- |
| `string` | 字符串 | `String` | - |
| `int` | 64位整数 | `ScalarInt` | 支持从 Float 自动转换 |
| `float` | 64位浮点数 | `Float` | - |
| `bool` | 布尔值 | `Boolean` | - |
| `datetime` | 时间日期 | `ScalarDateTime` | 符合 RFC3339 格式 |
| `float32vector`| AI 向量类型 | `[Float!]` | 用于语义搜索 |
| `geo` | 地理位置 | `Geo` | 存储点或多边形 (GeoJSON) |
| `ModelName` | **对象引用** | 对象实体 | 定义 1:1 或 N:1 关系 |
| `[]ModelName`| **对象列表引用** | 对象实体列表 | **简写语法**，定义 1:N 或 N:N 关系 |

### 💡 简写语法优化
在定义关联列表时，推荐使用简写语法：
- **完整版**：`users @type(object) @list @ref(User)`
- **推荐简写**：`users @type([]User)`

---

## 2. 索引与检索指令 (`@index`)

| 索引类型 | 适用字段类型 | 说明 |
| :--- | :--- | :--- |
| `hash` | `string` | 精确匹配，适用于 ID、状态等。 |
| `exact` | `string` | 精确匹配，支持不等比较与排序。 |
| `term` | `string` | 单词匹配，适用于标题、标签。 |
| `fulltext` | `string` | 全文搜索，支持多语言分词。 |
| `trigram` | `string` | 正则匹配与模糊搜索 (`_REGEX`) 必须开启。 |
| `int` / `float` | `int`, `float` | 数值索引，支持范围查询 (`_GE`, `_LT` 等)。 |
| `hour` / `day` / `month` / `year` | `datetime` | 时间索引粒度。 |
| `hnsw` | `float32vector` | 向量索引，语义搜索必须开启。 |
| `geo` | `geo` | 地理位置索引，支持 `_NEAR`, `_WITHIN` 等空间查询。 |

---

## 3. 约束与校验指令

| 指令 | 说明 | 参数示例 |
| :--- | :--- | :--- |
| `@required` | 必填字段，Mutation 时强制检查。 | - |
| `@uni` / `@unique` | 全局唯一约束。 | - |
| `@uniNm(name)` | 命名唯一约束，相同 name 的字段构成**联合唯一索引**。 | `@uniNm(primary)` |
| `@minL` / `@maxL` | 字符串最小/最大长度校验。 | `@minL(2) @maxL(64)` |
| `@min` / `@max` | 数值最小/最大值校验。 | `@min(0.01) @max(1000)` |
| `@pattern(re)` | 正则表达式校验。 | `@pattern("^1[3-9]\\d{9}$")` |
| `@format(fmt)` | 预定义格式校验。支持：`date`, `date-time`, `email`, `ipv4`, `ipv6`, `regex`。 | `@format(email)` |

---

## 4. 关系编排指令 (核心)

GraphCode 强大的深度嵌套关联能力主要由以下指令驱动。

| 指令 | 说明 | 逻辑含义 |
| :--- | :--- | :--- |
| `@ref(Model)` | 引用模型。 | 定义指向目标模型的边。使用 `@type(Model)` 时可省略。 |
| `@inv(Field)` | **反向关联**。 | **核心指令**。定义双向联动，修改一端，另一端自动同步。 |
| `@invIL` | **反向是列表**。 | 标记反向边为 `[]object` 类型。 |
| `@inline` | 内联存储。 | 在 `_CREATE` 时，将其作为整体嵌套处理。 |
| `@facets(...)` | 边属性。 | 在关联边上存储额外数据（如权重、关联时间）。 |

### 💡 双向关系的自动推导
GraphCode 具有强大的关系推导能力。在定义标准的双向关联时，只需在**其中一方**定义完整，另一方系统会自动补全。

**示例：User 与 UserGroup 的多对多关系**
你只需要这样定义 `User`：
```graphql
User {
    # 定义关联到 UserGroup 的列表，反向字段名为 users，且标记反向也是列表
    userGroups @type([]UserGroup) @inv(users) @invIL
}
```
对于 `UserGroup`，你可以**完全不用**定义 `users` 字段：
```graphql
UserGroup {
    name @type(string) @index(hash)
    # users 字段将由系统根据 User 侧的 @inv(users) 自动补全
}
```

---

## 5. 高级增强指令

| 指令 | 说明 | 示例 |
| :--- | :--- | :--- |
| `@enum(...)` | 定义枚举值，支持指定底层值。 | `@enum(Active(value="A"), Inactive(value="I"))` |
| `@exp(expr)` | **计算字段**。基于表达式引擎实时计算，不落库。 | `total @type(float) @exp("price * quantity")` |
| `@autoCreatedAt` | 自动维护创建时间。 | `createdAt @type(datetime) @index(hour)` |
| `@autoUpdatedAt` | 自动维护更新时间。 | `updatedAt @type(datetime) @index(hour)` |
| `@isScalar` | 将复杂结构强制作为 JSON 标量存储。 | `metadata @type(object) @isScalar` |

---

## 6. AI 向量检索指令 (`@vector`)

**语法**：`@vector(dim:维度, metric:度量)`

- **dim**: 向量维度（如 1536）。
- **metric**: 度量标准，可选 `cosine`, `euclidean`, `dot`。

**示例**：
```
embedding @type(float32vector) @vector(dim:1536, metric:cosine) @index(hnsw)
```
