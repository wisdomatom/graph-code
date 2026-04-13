# GraphQL API 概览与契约

本项目基于 Schema DSL 自动生成符合 GraphQL 规范的 API 接口。所有接口遵循统一的命名与参数约定。

## 1. 命名规范

对于 DSL 中定义的每一个模型 `Model`，系统会自动生成以下接口：

### 查询类 (Query)
- `queryModels`: 获取模型列表，支持过滤、分页、排序。
- `countModels`: 获取符合条件的记录总数。
- `aggregateModels`: 聚合查询（如求和、平均值、最大/最小值）。

### 变更类 (Mutation)
- `createModels`: 批量创建记录。
- `updateModels`: 批量更新符合条件的记录。
- `upsertModels`: 存在则更新，不存在则创建（**注**：仅当模型拥有 `@uniNm(primary)` 索引时生成）。
- `deleteModels`: 批量删除符合条件的记录。
- `batchUpdateModels`: 批量执行不同的更新操作。

---

## 2. 通用参数结构

### 2.1 过滤器 (`where`)
所有的查询和部分更新/删除接口都接受 `where` 参数。
- **标量过滤**：支持 `name: "xxx"`, `age_GE: 18`, `tags_IN: ["A", "B"]` 等后缀。所有后缀均以 `_` 开头且大写。
- **逻辑组合**：支持 `AND`, `OR`, `NOT` 的无限层级嵌套。
- **关系过滤**：可以跨模型过滤，例如查询“分类名称为‘电子’的所有商品”。

### 2.2 选项 (`option`)
用于控制结果集：
- `limit`: 限制返回数量。
- `offset`: 偏移量。
- `after`: 基于游标的分页。
- `sort`: 排序配置（支持多字段排序）。

---

## 3. 关系操作契约

本项目的一大特色是支持在一次 Mutation 中处理复杂的对象关系。**关系操作符后缀同样以 `_` 开头且大写。**

- **_CONNECT**: 建立已有对象之间的关联（通过 `where` 条件指定目标）。
- **_DISCONNECT**: 解除已有对象之间的关联。
- **_CREATE**: 嵌套创建一个新对象并建立关联。
- **_DELETE**: 级联删除关联对象。

---

## 4. 响应规范

### 变更响应 (Info Object)
所有的 Mutation 接口返回一个 Info 对象，包含：
- `nodeCreated`: 本次操作新增的节点数。
- `nodeUpdated`: 本次操作更新的节点数。
- `nodeDeleted`: 本次操作删除的节点数（仅限 update/delete）。
- `models`: 返回操作后的对象实体列表。

---

## 5. 快速示例 (以商城 Product 为例)

### 查询接口定义
```graphql
queryProducts(
  where: ProductWhere
  option: ProductOption
): [Product!]!
```

### 创建接口定义
```graphql
createProducts(
  input: [ProductCreate!]!
): CreateProductsInfo!
```

后续章节将详细介绍 [查询能力 (Query)](query.md) 和 [变更能力 (Mutation)](mutation.md) 的具体用法。
