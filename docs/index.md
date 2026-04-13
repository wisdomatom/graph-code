---
layout: home
hero:
  name: GraphCode
  text: 高性能图逻辑编排引擎 / High-Performance Graph Orchestration
  tagline: 请选择您的语言 / Please choose your language
  actions:
    - theme: brand
      text: 简体中文 (zh-CN)
      link: /zh/
    - theme: alt
      text: English (en-US)
      link: /en/
---

<script>
// Automatic redirect based on browser language
if (typeof window !== 'undefined') {
  const lang = navigator.language || navigator.userLanguage;
  const path = window.location.pathname;
  if (path === '/graph-code/' || path === '/graph-code/index.html') {
    if (lang.startsWith('zh')) {
      window.location.href = '/graph-code/zh/';
    } else {
      window.location.href = '/graph-code/en/';
    }
  }
}
</script>
