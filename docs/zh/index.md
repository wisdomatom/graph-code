---
layout: home
hero:
  name: GraphCode
  text: 高性能图逻辑编排引擎
  tagline: Schema 驱动、深度嵌套关联、AI 向量检索、BT 编排、细粒度 ACL
  actions:
    - theme: brand
      text: 🚀 快速开始
      link: /zh/philosophy
    - theme: alt
      text: 查看指令手册
      link: /zh/schema-dsl-reference

features:
  - icon: 🚀
    title: Schema 驱动
    details: 只需定义 DSL，自动生成全套 CRUD 接口及复杂的关联操作符，大幅提升开发效率。
  - icon: 🔗
    title: 深度嵌套关联
    details: 支持无限层级的嵌套查询与写入，原生维护图数据的双向一致性与唯一性约束。
  - icon: 🔍
    title: AI 向量检索
    details: 原生支持向量召回与自定义重排公式，为 RAG 架构提供精准的图上下文支持。
  - icon: 🌲
    title: BT 业务编排
    details: 通过行为树 YAML 编排复杂业务逻辑，实现数据操作与业务流程的极致解耦。
  - icon: 🛡️
    title: 细粒度 ACL
    details: 采用结构化权限引擎，支持字段级访问控制与行级数据隔离，确保数据安全合规。
  - icon: ⭐️
    title: 开源路线图
    details: 目标 GitHub Star 突破 1,000 时，我们将向社区正式开放 GraphCode 全量核心源代码。
---

<div class="github-star-wrapper" style="justify-content: center; width: 100%; margin-top: 2rem;">
  <a href="https://github.com/wisdomatom/graph-code" target="_blank" class="github-star-btn" style="padding: 10px 24px; font-size: 16px;">
    <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.695z"></path></svg>
    <span>Star 支持我们 (1k 开源)</span>
    <span class="github-star-count" id="star-count-val-zh" style="border-left: 1px solid var(--vp-c-divider); margin-left: 12px; padding-left: 12px;">...</span>
  </a>
</div>

<script>
  function updateZhStarCount() {
    fetch('https://api.github.com/repos/wisdomatom/graph-code')
      .then(res => res.json())
      .then(data => {
        const el = document.getElementById('star-count-val-zh');
        if (el && data.stargazers_count) el.innerText = data.stargazers_count;
      }).catch(() => {});
  }
  updateZhStarCount();
</script>

## 📖 核心文档
### 入门
- [核心理念](./philosophy.md)
- [DSL 建模](./schema-dsl.md)
- [指令手册](./schema-dsl-reference.md)

### 能力
- [查询 (Query)](./query.md) | [变更 (Mutation)](./mutation.md)
- [最短路径](./shortest-path.md) | [向量检索](./vector-search.md)
- [ACL 权限](./acl.md) | [审计记录](./audit.md)
