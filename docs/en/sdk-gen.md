# Static SDK Generation: Type Safety & AI-Friendly Development

In GraphQL development, hand-writing query strings often leads to issues like lack of syntax highlighting, autocompletion, and type validation, making it prone to runtime errors.

GraphCode recommends using the [**graphql-sdk-gen**](https://github.com/wisdomatom/graphql-sdk-gen) tool to transform dynamic GraphQL protocols into strongly-typed **Static SDKs**, completely solving these pain points.

---

## 1. Why Need a Static SDK?

- **Eliminate Syntax Errors**: No need to patch strings; call APIs via IDE autocompletion. Errors are discovered during compile time.
- **Frontend-Backend Consistency**: As the backend evolves the schema, the frontend gains updated type definitions immediately by running the generator, ensuring contract consistency.
- **Cross-Platform Support**: Supports generating client code for multiple languages including Go, TypeScript (Node.js), and Python, covering Web, mobile, and backend microservices.

---

## 2. AI-Friendly Development (AI-Native)

With AI-assisted programming (e.g., Copilot, Gemini) becoming prevalent, Static SDKs offer unique value:

- **Constraint on AI Generation**: When generating logic, AI often "hallucinates" field names it isn't familiar with. With a Static SDK, AI can leverage existing function signatures and structure definitions to generate **100% correct and reliable** code.
- **Context Compression**: Static SDKs provide a clear semantic context. AI only needs to focus on business logic orchestration without understanding tedious raw GraphQL syntax.

---

## 3. Real-World Example: Fluent API Calls

`graphql-sdk-gen` utilizes a **Fluent Selector** design, allowing you to build deeply nested graph queries via chainable methods.

### 3.1 Go Example
The generated Go code provides strongly-typed field enums and recursive selectors.

```go
import "your-project/sdk"

// 1. Build the query object
query := sdk.NewQueryQueryOrders()

// 2. Set filtering criteria (Where)
query.Where(sdk.OrderWhere{
    OrderNo: sdk.StringFilter{Eq: "ORD-2026-001"},
    StatusIN: []string{"paid", "shipped"},
})

// 3. Orchestrate return fields (Selection Set)
query.Select(func(s *sdk.SelectorOrder) {
    s.Select(sdk.OrderFieldId, sdk.OrderFieldOrderNo, sdk.OrderFieldAmount)
    
    // Select nested related nodes: Customer Info
    s.SelectCustomer(sdk.UserWhere{}, sdk.UserOption{}, func(u *sdk.SelectorUser) {
        u.Select(sdk.UserFieldId, sdk.UserFieldName)
    })
})

// 4. Build GraphQL string and variables
gqlString, variables := query.Build()
```

### 3.2 TypeScript Example
In frontend or Node.js environments, the SDK provides full type inference support.

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
            // Nested query for authors and their affiliations
            .authors({}, {}, new sdk.selector.AuthorSelector()
                .select(sdk.field.FieldAuthor.name)
            )
    );

const [gql, vars] = query.build();
```

---

## 4. Standard Development Flow

### 4.1 Export Protocol Snapshot (Introspection)
GraphCode provides the `graphcode-gen` CLI tool (compiled from the built-in `cmd/gen`) for exporting protocol snapshots. You only need to point it to your DSL definition file:

```bash
# Export protocol snapshot using the CLI tool
graphcode-gen -meta ./schema-dsl.txt -introspection
```
After execution, the latest `introspection.json` will be generated in the current directory. This tool is ideal for integration into CI/CD pipelines.

### 4.2 Generate Code
Once the protocol file is obtained, run the generator for your target language.

```bash
# Example: Generate Go SDK using graphql-sdk-gen
go run main.go --schema ./introspection.json --out ./sdk --pkg sdk
```

### 4.3 Business Integration
Include the generated code in version control (or generate it dynamically in CI) for direct use by the business logic layer.

---

## 5. Best Practices

1. **Pipeline Integration**: It is recommended to integrate SDK generation into CI/CD pipelines. Automatically update all platform SDKs whenever business models evolve.
2. **Multi-Language Collaboration**: In complex SaaS architectures, use SDKs to unify calling standards across different terminals (Web/App/Backend), reducing communication costs.
3. **AI Enhancement**: Including core SDK definitions in the context provided to AI Agents can significantly improve their success rate in automated testing and logic orchestration.
