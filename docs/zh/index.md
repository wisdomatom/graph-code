# GraphCode 官方指南

**GraphCode** 是一个高度工程化的图逻辑编排引擎。它超越了传统 GraphQL 层，通过 Schema 驱动的自动化技术，将复杂的图数据库操作转化为声明式的、强类型的 API 契约。

---

## ⭐️ 开源路线图 (Star Support)
<div class="github-star-wrapper">
  <a href="https://github.com/wisdomatom/graph-code" target="_blank" class="github-star-btn">
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.695z"></path></svg>
    <span>Star</span>
    <span class="github-star-count" id="star-count-val">...</span>
  </a>
</div>

我们相信社区的力量。为了回馈开发者，我们设定了以下开源目标：
- **目标**：GitHub Star 数突破 **1,000**
- **行动**：正式向社区开放 **GraphCode 全量核心源代码**
- **当前状态**：[点击这里支持我们](https://github.com/wisdomatom/graph-code)，点亮你的 Star，助力项目早日开源！

---

## 🚀 快速开始
- **核心理念**：[为什么选择 GraphCode？](./philosophy.md)
- **DSL 建模**：[使用 Schema DSL 定义你的图世界](./schema-dsl.md)
- **指令手册**：[Schema DSL 指令全指南](./schema-dsl-reference.md)
- **API 概览**：[声明式 API 契约与标准](./schema-driven-api.md)
- **静态 SDK**：[AI 友好的静态代码库生成](./sdk-gen.md)

## 🛠 核心能力
### 图数据操作
- **查询 (Query)**：[基础过滤、聚合与搜索](./query.md)
- **变更 (Mutation)**：[原子化写入与深度嵌套更新](./mutation.md)
- **关联管理**：[深度嵌套的关系维护](./relations.md)
- **边属性 (Facets)**：[管理关联边上的元数据](./facets.md)

### 高级图算法
- **最短路径**：[带权重的实时路径搜索](./shortest-path.md)
- **AI 向量检索**：[GraphRAG：图与向量的深度融合](./vector-search.md)
- **地理位置搜索**：[基于坐标的空间检索](./geo-search.md)

### 业务与安全
- **动态协议更新**：[无需重启的在线 Schema 演进](./schema-versioning.md)
- **BT 业务编排**：[使用行为树编排复杂业务逻辑](./bt.md)
- **ACL 权限控制**：[精细到字段与行级的数据安全](./acl.md)
- **审计溯源**：[合规审计与变更记录](./audit.md)

---

## 📖 参考标准
- **错误代码规范**：统一的结构化错误返回标准。
- **性能规范**：查询负载保护与自动分页限制。
- **一致性规范**：双向关联的自动完整性维护。
