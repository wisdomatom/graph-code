# AI Vector Search (Vector Search / GraphRAG)

This project natively supports vector search capabilities, allowing users to recall and rerank data based on semantic similarity.

## 1. Model Definition (DSL)

Use the `float32vector` type in the DSL and configure it with the `@vector` annotation.

### 1.1 Syntax
```
fieldName @type(float32vector) @vector(dim: Dimensions, metric: MetricStandard) @index(hnsw)
```
- **dim**: Vector dimensions (e.g., 512, 1536).
- **metric**: Metric standard; supports `cosine` (Cosine Similarity), `euclidean` (Euclidean Distance), and `ip` (Inner Product).
- **index**: Must configure `@index(hnsw)` to enable the vector index.

### 1.2 Example
```
Article {
  title @type(string) @index(term)
  content @type(string) @index(fulltext)
  # Define a 1536-dimensional vector field using Cosine similarity
  embedding @type(float32vector) @vector(dim:1536, metric:cosine) @index(hnsw)
}
```

---

## 2. Query and Similarity Recall

### 2.1 `_SIMILAR` Filter
Use the `_SIMILAR` suffix for vector retrieval. You need to pass the target vector and the recall count `topK`.

```graphql
query {
  queryArticles(
    where: {
      embedding_SIMILAR: {
        vector: [0.1, 0.2, 0.3, ...], # Float array
        topK: 10
      }
    }
  ) {
    title
    # Automatically generated virtual fields
    embedding_SCORE    # Similarity score (0~1)
    embedding_DISTANCE # Physical distance
  }
}
```

### 2.2 Custom Scoring Formula (`vector_math`)
Use `vector_math` in `option` to perform weighted reranking on multiple vector scores or metrics.

```graphql
query {
  queryArticles(
    where: {
      embedding_SIMILAR: { vector: $vec, topK: 50 }
    }
    option: {
      # Supports basic arithmetic operations and parentheses
      vector_math: "(embedding_SCORE * 0.8) + (val(citationCount) * 0.2)"
      sort: { VECTOR_TOTAL_SCORE: DESC } # Sort by integrated total score
    }
  ) {
    title
    VECTOR_TOTAL_SCORE
  }
}
```

#### Validation Rules (Security)
To prevent script injection, `vector_math` expressions are subject to strict validation:
1.  **Character Whitelist**: Only letters, numbers, underscores, spaces, and operators `+ - * / . ( )` are allowed.
2.  **Variable Restrictions**: Words must end in `_SCORE` or `_DISTANCE`, or use `val()` to reference system native metrics.
3.  **Balance Check**: Left and right parentheses must be strictly balanced.

---

## 3. Data Entry (Mutation)

In GraphQL Mutations, vector fields accept a standard **float array (`[Float!]`)**. The underlying engine automatically handles the serialization format.

```graphql
mutation {
  createArticles(
    input: [
      {
        title: "AI Revolution",
        embedding: [0.123, 0.456, 0.789, 0.012] # Pass float array directly
      }
    ]
  ) {
    nodeCreated
  }
}
```

---

## 4. Core Advantages
- **Infinite Nesting**: Supports vector search within deeply nested relational queries.
- **Variable Isolation**: Automatically handles variable naming conflicts, supporting simultaneous search across multiple vector fields.
- **On-demand Computation**: Math computation overhead is only incurred when requesting relevant fields or executing reranking.
