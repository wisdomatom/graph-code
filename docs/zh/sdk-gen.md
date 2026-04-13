# 静态 SDK 生成：类型安全与 AI 友好开发

在 GraphQL 开发中，手写查询字符串（Queries）往往面临缺乏语法高亮、自动补全以及类型校验等难题，极易导致线上运行时错误。

GraphCode 推荐配套使用 [**graphql-sdk-gen**](https://github.com/wisdomatom/graphql-sdk-gen) 工具，将动态的 GraphQL 协议转化为强类型的**静态代码库 (SDK)**，从而彻底解决这些痛点。

---

## 1. 为什么需要静态 SDK？

- **杜绝语法错误**：无需在代码中拼凑字符串，通过 IDE 的自动补全即可调用 API，错误在编译期即可发现。
- **前后端协同一致**：后端通过 Schema 演进，前端运行 SDK 生成工具即可获得最新的类型定义，确保契约的一致性。
- **跨平台支持**：支持为 Go、TypeScript (Node.js)、Python 等多种主流语言生成客户端代码，覆盖 Web、移动端及后端微服务场景。

---

## 2. AI 开发友好 (AI-Native)

在 AI 辅助编程（如 Copilot, Gemini）日益普及的今天，静态 SDK 具有独特的价值：

- **强制约束 AI 生成**：AI 在生成调用逻辑时，往往会因为不熟悉具体的字段名而产生幻觉（Hallucination）。有了静态 SDK，AI 可以基于现有的函数签名和结构体定义进行联想，生成**100% 正确且可靠**的代码。
- **上下文压缩**：静态代码库提供了清晰的语义上下文，AI 只需关注业务逻辑的编排，而无需去理解繁琐的原始 GraphQL 语法。

---

## 3. 实战示例：流式代码调用

`graphql-sdk-gen` 采用了**流式选择器 (Selector)** 设计，支持通过链式调用构建深度嵌套的图查询。

### 3.1 Go 语言示例
生成的 Go 代码提供了强类型的字段枚举与递归选择器。

```go
import "your-project/sdk"

// 1. 构建查询对象
query := sdk.NewQueryQueryOrders()

// 2. 设置过滤条件 (Where)
query.Where(sdk.OrderWhere{
    OrderNo: sdk.StringFilter{Eq: "ORD-2026-001"},
    StatusIN: []string{"paid", "shipped"},
})

// 3. 编排返回字段 (Selection Set)
query.Select(func(s *sdk.SelectorOrder) {
    s.Select(sdk.OrderFieldId, sdk.OrderFieldOrderNo, sdk.OrderFieldAmount)
    
    // 递归选择关联节点：客户信息
    s.SelectCustomer(sdk.UserWhere{}, sdk.UserOption{}, func(u *sdk.SelectorUser) {
        u.Select(sdk.UserFieldId, sdk.UserFieldName)
    })
})

// 4. 生成 DQL 兼容的 GraphQL 字符串与变量
gqlString, variables := query.Build()
```

### 3.2 TypeScript 示例
在前端或 Node.js 环境中，SDK 提供了完整的类型推断支持。

```typescript
import * as sdk from './sdk';

const query = new sdk.operation.QueryArticles()
    .where({ 
        journal_IN: ['Science', 'Nature'],
        publishedAt_GE: '2026-01-01T00:00:00Z'
    })
    .select(
        new sdk.selector.ArticleSelector()
            .select(sdk.field.FieldArticle.id, sdk.field.FieldArticle.title)
            // 嵌套查询作者及其机构
            .authors({}, {}, new sdk.selector.AuthorSelector()
                .select(sdk.field.FieldAuthor.name)
            )
    );

const [gql, vars] = query.build();
```

---

## 4. 标准开发流程

### 4.1 导出协议快照 (Introspection)
GraphCode 提供了 `graphcode-gen` 命令行工具（由项目内置的 `cmd/gen` 编译生成）用于导出协议快照。你只需指向你的 DSL 定义文件即可：

```bash
# 使用命令行工具导出协议快照
graphcode-gen -meta ./schema-dsl.txt -introspection
```
执行后，系统会在当前目录下生成最新的 `introspection.json` 文件。该工具非常适合集成到各类 CI/CD 自动化流水线中。

### 4.2 生成代码
获取协议文件后，运行对应语言的生成器。

```bash
# 使用 graphql-sdk-gen 生成 Go SDK
go run main.go --schema ./introspection.json --out ./sdk --pkg sdk
```

### 4.3 业务集成
将生成的代码纳入版本控制（或在 CI 中动态生成），供业务层直接调用。

---

## 5. 最佳实践

1. **流水线集成**：建议将 SDK 生成脚本集成到 CI/CD 流水线中。每当业务模型发生变更并发布新版本时，自动更新全平台的 SDK 代码。
2. **多语言共建**：在复杂的 SaaS 架构中，利用 SDK 统一多端（Web/小程序/后端）的调用标准，降低沟通成本。
3. **AI 增强**：在提供给 AI 代理（Agent）的上下文（Context）中包含 SDK 的核心定义，能显著提升其在自动化测试与逻辑编排上的成功率。
