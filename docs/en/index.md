---
layout: home
hero:
  name: GraphCode
  text: High-Performance Graph Orchestration
  tagline: Schema-Driven, Deeply Nested, AI Vector Search, BT Orchestration, Fine-grained ACL
  actions:
    - theme: brand
      text: 🚀 Get Started
      link: /en/philosophy
    - theme: alt
      text: Directive Reference
      link: /en/schema-dsl-reference

features:
  - icon: 🚀
    title: Schema-Driven
    details: Define your DSL once, and automatically generate full CRUD APIs and complex relational operators.
  - icon: 🔗
    title: Deeply Nested
    details: Supports infinite levels of nested queries and writes, with native integrity and uniqueness maintenance.
  - icon: 🔍
    title: AI Vector Search
    details: Native support for vector retrieval and custom re-ranking formulas for precise GraphRAG contexts.
  - icon: 🌲
    title: BT Orchestration
    details: Orchestrate complex business logic using Behavior Trees in YAML, decoupling data and processes.
  - icon: 🛡️
    title: Fine-grained ACL
    details: Structured permission engine supporting field-level access control and row-level data isolation.
  - icon: ⭐️
    title: Open Source Roadmap
    details: We will release the full core source code to the community once we reach 1,000 GitHub Stars.
---

<div class="github-star-wrapper" style="justify-content: center; width: 100%; margin-top: 2rem;">
  <a href="https://github.com/wisdomatom/graph-code" target="_blank" class="github-star-btn" style="padding: 10px 24px; font-size: 16px;">
    <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.695z"></path></svg>
    <span>Star Us Support Open Source</span>
    <span class="github-star-count" id="star-count-val-en" style="border-left: 1px solid var(--vp-c-divider); margin-left: 12px; padding-left: 12px;">...</span>
  </a>
</div>

<script>
  function updateEnStarCount() {
    fetch('https://api.github.com/repos/wisdomatom/graph-code')
      .then(res => res.json())
      .then(data => {
        const el = document.getElementById('star-count-val-en');
        if (el && data.stargazers_count) el.innerText = data.stargazers_count;
      }).catch(() => {});
  }
  updateEnStarCount();
</script>

## 📖 Documentation
### Getting Started
- [Core Philosophy](./philosophy.md)
- [Schema DSL](./schema-dsl.md)
- [Directive Reference](./schema-dsl-reference.md)

### Capabilities
- [Query](./query.md) | [Mutation](./mutation.md)
- [Shortest Path](./shortest-path.md) | [Vector Search](./vector-search.md)
- [ACL](./acl.md) | [Audit Logging](./audit.md)
