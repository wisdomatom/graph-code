# AI 向量检索 (Vector Search / GraphRAG)

本项目原生支持向量检索能力，允许用户基于语义相似度对数据进行召回与重排。

## 1. 模型定义 (DSL)

在 DSL 中使用 `float32vector` 类型并配置 `@vector` 注解。

### 1.1 语法
```
fieldName @type(float32vector) @vector(dim: 维度, metric: 度量标准) @index(hnsw)
```
- **dim**: 向量维度（如 512, 1536）。
- **metric**: 度量标准，支持 `cosine` (余弦相似度)、`euclidean` (欧氏距离)、`ip` (内积)。
- **index**: 必须配置 `@index(hnsw)` 以开启向量索引。

### 1.2 示例
```
Article {
  title @type(string) @index(term)
  content @type(string) @index(fulltext)
  # 定义 1536 维的向量字段，使用余弦相似度
  embedding @type(float32vector) @vector(dim:1536, metric:cosine) @index(hnsw)
}
```

---

## 2. 查询与相似度召回

### 2.1 `_SIMILAR` 过滤器
使用 `_SIMILAR` 后缀进行向量检索。需传入目标向量和召回数量 `topK`。

```graphql
query {
  queryArticles(
    where: {
      embedding_SIMILAR: {
        vector: [0.1, 0.2, 0.3, ...], # 浮点数组
        topK: 10
      }
    }
  ) {
    title
    # 自动生成的虚拟字段
    embedding_SCORE    # 相似度分数 (0~1)
    embedding_DISTANCE # 物理距离
  }
}
```

### 2.2 自定义评分公式 (`vector_math`)
在 `option` 中使用 `vector_math` 对多个向量分数或指标进行加权重排。

```graphql
query {
  queryArticles(
    where: {
      embedding_SIMILAR: { vector: $vec, topK: 50 }
    }
    option: {
      # 支持基本的算术运算和括号
      vector_math: "(embedding_SCORE * 0.8) + (val(citationCount) * 0.2)"
      sort: { VECTOR_TOTAL_SCORE: DESC } # 按综合总分排序
    }
  ) {
    title
    VECTOR_TOTAL_SCORE
  }
}
```

#### 校验规则 (Security)
为了防止脚本注入，`vector_math` 表达式受以下严格校验：
1. **字符白名单**: 仅允许字母、数字、下划线、空格及运算符 `+ - * / . ( )`。
2. **变量限制**: 单词必须以 `_SCORE` 或 `_DISTANCE` 结尾，或者使用 `val()` 引用系统原生指标。
3. **平衡校验**: 左右括号必须严格闭合。

---

## 3. 数据写入 (Mutation)

在 GraphQL Mutation 中，向量字段接受标准的 **浮点数组 (`[Float!]`)**。底层引擎会自动处理底层的序列化格式。

```graphql
mutation {
  createArticles(
    input: [
      {
        title: "AI 革命",
        embedding: [0.123, 0.456, 0.789, 0.012] # 直接传递浮点数组
      }
    ]
  ) {
    nodeCreated
  }
}
```

---

## 4. 核心优势
- **无限嵌套**: 支持在深度嵌套的关联查询中使用向量检索。
- **变量隔离**: 内部自动处理变量命名冲突，支持多向量字段同时检索。
- **按需计算**: 仅在请求相关字段或执行重排时才会产生 Math 计算开销。
