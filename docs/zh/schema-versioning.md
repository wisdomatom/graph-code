# 动态协议更新 (Versioning & Evolution)

GraphCode 支持 **在线 Schema 演进**。你无需修改代码、无需重新编译，更无需重启服务，即可通过 GraphQL 接口动态更新 DSL 定义，并实时生成全套 CRUD 接口。

---

## 1. 核心流程演练

我们将以构建一个“科研论文图谱”系统为例，演示全生命周期的协议演进。

### 第一步：提交 Schema 草稿 (`draftMeta`)
你可以通过 `draftMeta` 提交模型的全量定义或增量更新。

#### 示例 A：全量定义（构建新业务）
```graphql
mutation {
  draftMeta(schema: """
    # Article 代表一篇研究论文
    Article {
        title @type(string) @index(fulltext) @uni @uniNm(primary) @desc("文章标题")
        abstract @type(string) @desc("摘要原文")
        
        # 向量字段：用于 AI 语义检索
        abstractVec @type(float32vector) @vector(dim:128, metric:cosine) @index(hnsw)
        
        # 关联关系
        authors @type([]Author) @inv(articles) @desc("作者列表")
        citedBy @type([]Article) @inv(references) @desc("引用本文的文献")
        references @type([]Article) @inv(citedBy) @desc("本文引用的文献")
    }

    # Author 代表一名研究员
    Author {
        name @type(string) @index(hash) @uni @uniNm(primary) @desc("作者姓名")
        reputation @type(float) @index(float) @desc("学者声望分")
        articles @type([]Article) @inv(authors)
    }
  """)
}
```

#### 示例 B：增量更新（按需扩展字段）
`draftMeta` 具有智能缝合能力。当你只需新增字段时，无需重复提供全量定义。
```graphql
mutation {
  # 仅为 Article 增加“引用数”和“发表期刊”字段
  draftMeta(schema: """
    Article {
        citationCount @type(int) @index(int) @desc("引用总数")
        journal @type(string) @index(hash) @desc("发表期刊")
    }
  """)
}
```

### 第二步：生成 Schema 版本 (`metaVersionGenerate`)
```graphql
mutation {
  metaVersionGenerate { version } # 返回例如 "20250301120450"
}
```

### 第三步：正式发布版本 (`metaVersionPublish`)
```graphql
mutation {
  metaVersionPublish(version: "20250301120450")
}
```

---

## 2. 数据治理与一致性保障

为了确保商业系统的稳健性，GraphCode 在协议演进中遵循以下核心原则：

### 2.1 系统内核保护 (`Meta` 前缀)
所有系统内置的模型（如 `MetaUser`, `MetaPolicy`, `MetaSchema`）均由系统内核强制维护。
*   **命名隔离**：业务模型严禁使用 `Meta` 前缀，确保系统底座稳固。
*   **自动缝合**：版本发布时，系统会自动将内存中的最新内核定义与你的业务扩展模型进行缝合。

### 2.2 严密的类型保护机制
**原则：字段类型 (`@type`) 一旦发布，严禁直接调整。**

*   **契约稳定性保障**：字段类型决定了 API 的底层序列化协议与数据结构映射。**任何已发布的字段类型变更均被视为“破坏性改动 (Breaking Change)”**。在现代分布式架构中，这种变更极易引发上下游依赖方的序列化失败、类型解析错误甚至服务崩溃。因此，GraphCode 在协议层强制锁定已发布的字段类型，以确保系统契约的绝对稳健。
*   **允许变更项**：非结构性约束（如 `@min`/`@max`）、索引策略 (`@index`)、元数据描述 (`@title`/`@desc`) 均属于非破坏性演进，可随时更新生效。

### 2.3 紧急变更出口
若确认本次变更安全（如：新模型、无存量数据），超级管理员可以通过以下步骤强制更新：
1.  调用 `updateMetaProperty` 接口强制修改字段类型。
2.  重新生成版本并发布。

---

## 3. 商业价值

*   **零停机演进**：业务逻辑随时扩展，无需重启服务。
*   **生产级安全**：强制类型保护杜绝协议随意变更引发的线上事故。
*   **治理透明**：全流程版本化，保障 Schema 的可追溯性。
