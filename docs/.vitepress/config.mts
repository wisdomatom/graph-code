import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "GraphCode",
  description: "高度工程化的图逻辑编排引擎",
  lastUpdated: true,
  cleanUrls: true,
  srcDir: '.', // 指定文档源目录
  ignoreDeadLinks: true,
  
  // 多语言配置
  locales: {
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
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
