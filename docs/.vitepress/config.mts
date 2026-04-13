import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/graph-code/',
  title: "GraphCode",
  description: "高度工程化的图逻辑编排引擎",
  lastUpdated: true,
  cleanUrls: true,
  srcDir: '.', // 指定文档源目录
  ignoreDeadLinks: true,
  head: [
    ['style', {}, `
      .github-star-wrapper {
        display: inline-flex;
        align-items: center;
        margin: 1rem 0;
      }
      .github-star-btn {
        display: inline-flex;
        align-items: center;
        background-color: var(--vp-c-bg-soft);
        border: 1px solid var(--vp-c-divider);
        border-radius: 6px;
        padding: 4px 12px;
        font-size: 14px;
        font-weight: 600;
        color: var(--vp-c-text-1) !important;
        text-decoration: none !important;
        transition: all 0.2s;
        cursor: pointer;
      }
      .github-star-btn:hover {
        background-color: var(--vp-c-bg-mute);
        border-color: var(--vp-c-text-3);
      }
      .github-star-btn svg {
        margin-right: 6px;
        fill: currentColor;
      }
      .github-star-count {
        margin-left: 8px;
        padding-left: 8px;
        border-left: 1px solid var(--vp-c-divider);
        color: var(--vp-c-text-2);
      }
    `],
    ['script', {}, `
      function updateStarCount() {
        fetch('https://api.github.com/repos/wisdomatom/graph-code')
          .then(res => res.json())
          .then(data => {
            const el = document.getElementById('star-count-val');
            if (el && data.stargazers_count) el.innerText = data.stargazers_count;
          }).catch(() => {});
      }
      document.addEventListener('DOMContentLoaded', updateStarCount);
      // 处理 VitePress 路由切换
      if (typeof window !== 'undefined') {
        const observer = new MutationObserver(updateStarCount);
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
    `]
  ],
  
  // 多语言配置
  locales: {
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        socialLinks: [
          { icon: 'github', link: 'https://github.com/wisdomatom/graph-code' }
        ],
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '指南', link: '/zh/' }
        ],
        sidebar: [
          {
            text: '核心入门',
            items: [
              { text: '核心理念', link: '/zh/philosophy' },
              { text: '介绍', link: '/zh/' },
              { text: 'Schema DSL 基础', link: '/zh/schema-dsl' },
              { text: '动态协议更新', link: '/zh/schema-versioning' },
              { text: 'Schema DSL 指令参考', link: '/zh/schema-dsl-reference' },
              { text: 'GraphQL API 概览', link: '/zh/schema-driven-api' },
              { text: '静态 SDK 生成', link: '/zh/sdk-gen' }
            ]
          },
          {
            text: '基础能力',
            items: [
              { text: 'Query 查询', link: '/zh/query' },
              { text: 'Mutation 变更', link: '/zh/mutation' },
              { text: '关系与一致性', link: '/zh/relations' },
              { text: '边属性 (Facets)', link: '/zh/facets' }
            ]
          },
          {
            text: '高级特性',
            items: [
              { text: '最短路径', link: '/zh/shortest-path' },
              { text: 'AI 向量检索 (GraphRAG)', link: '/zh/vector-search' },
              { text: '地理位置搜索', link: '/zh/geo-search' },
              { text: 'BT 业务编排', link: '/zh/bt' }
            ]
          },
          {
            text: '安全与审计',
            items: [
              { text: 'ACL 权限控制', link: '/zh/acl' },
              { text: '变更审计记录', link: '/zh/audit' }
            ]
          }
        ]
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        socialLinks: [
          { icon: 'github', link: 'https://github.com/wisdomatom/graph-code' }
        ],
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Guide', link: '/en/' }
        ],
        sidebar: [
          {
            text: 'Introduction',
            items: [
              { text: 'Core Philosophy', link: '/en/philosophy' },
              { text: 'Overview', link: '/en/' },
              { text: 'Schema DSL', link: '/en/schema-dsl' },
              { text: 'Dynamic Schema Updates', link: '/en/schema-versioning' },
              { text: 'Schema DSL Directives', link: '/en/schema-dsl-reference' },
              { text: 'GraphQL API Overview', link: '/en/schema-driven-api' },
              { text: 'Static SDK Generation', link: '/en/sdk-gen' }
            ]
          },
          {
            text: 'Core Features',
            items: [
              { text: 'Query', link: '/en/query' },
              { text: 'Mutation', link: '/en/mutation' },
              { text: 'Relationships & Integrity', link: '/en/relations' },
              { text: 'Edge Attributes (Facets)', link: '/en/facets' }
            ]
          },
          {
            text: 'Advanced',
            items: [
              { text: 'Shortest Path', link: '/en/shortest-path' },
              { text: 'AI Vector Search (GraphRAG)', link: '/en/vector-search' },
              { text: 'Geospatial Search', link: '/en/geo-search' },
              { text: 'BT Business Orchestration', link: '/en/bt' }
            ]
          },
          {
            text: 'Security & Audit',
            items: [
              { text: 'ACL Access Control', link: '/en/acl' },
              { text: 'Change Auditing', link: '/en/audit' }
            ]
          }
        ]
      }
    }
  }
})
