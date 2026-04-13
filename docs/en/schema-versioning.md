# Dynamic Schema Updates (Versioning & Evolution)

GraphCode supports **Online Schema Evolution**. You can dynamically update DSL definitions via the GraphQL interface and generate a full set of CRUD interfaces in real-time—without modifying code, recompiling, or restarting the service.

---

## 1. Core Workflow Walkthrough

We will use the construction of a "Scientific Publication Graph" system as an example to demonstrate the full lifecycle of schema evolution.

### Step 1: Submit Schema Draft (`draftMeta`)
You can submit full model definitions or incremental updates through `draftMeta`.

#### Example A: Full Definition (Building a New Business)
```graphql
mutation {
  draftMeta(schema: """
    # Article represents a research paper
    Article {
        title @type(string) @index(fulltext) @uni @uniNm(primary) @desc("Article Title")
        abstract @type(string) @desc("Original Abstract")
        
        # Vector Field: Used for AI semantic retrieval
        abstractVec @type(float32vector) @vector(dim:128, metric:cosine) @index(hnsw)
        
        # Relationships
        authors @type([]Author) @inv(articles) @desc("List of Authors")
        citedBy @type([]Article) @inv(references) @desc("Papers citing this article")
        references @type([]Article) @inv(citedBy) @desc("Papers cited by this article")
    }

    # Author represents a researcher
    Author {
        name @type(string) @index(hash) @uni @uniNm(primary) @desc("Author Name")
        reputation @type(float) @index(float) @desc("Scholar Reputation Score")
        articles @type([]Article) @inv(authors)
    }
  """)
}
```

#### Example B: Incremental Update (Expanding Fields on Demand)
`draftMeta` possesses intelligent stitching capabilities. When you only need to add new fields, you don't need to resubmit the full definition.
```graphql
mutation {
  # Add "Citation Count" and "Journal" fields to Article only
  draftMeta(schema: """
    Article {
        citationCount @type(int) @index(int) @desc("Total Citations")
        journal @type(string) @index(hash) @desc("Publishing Journal")
    }
  """)
}
```

### Step 2: Generate Schema Version (`metaVersionGenerate`)
```graphql
mutation {
  metaVersionGenerate { version } # Returns something like "20250301120450"
}
```

### Step 3: Formal Version Publication (`metaVersionPublish`)
```graphql
mutation {
  metaVersionPublish(version: "20250301120450")
}
```

---

## 2. Data Governance & Consistency Guarantees

To ensure the robustness of commercial systems, GraphCode follows these core principles during schema evolution:

### 2.1 System Core Protection (`Meta` Prefix)
All built-in system models (e.g., `MetaUser`, `MetaPolicy`, `MetaSchema`) are strictly maintained by the system core.
*   **Namespace Isolation**: Business models are strictly prohibited from using the `Meta` prefix, ensuring a stable system foundation.
*   **Automatic Stitching**: Upon version publication, the system automatically stitches the latest core definitions in memory with your business extension models.

### 2.2 Strict Type Protection Mechanism
**Principle: Once a field type (`@type`) is published, direct modification is strictly prohibited.**

*   **Contract Stability Guarantee**: Field types determine the underlying serialization protocol and data structure mapping of the API. **Any change to a published field type is considered a "Breaking Change."** In modern distributed architectures, such changes can easily cause serialization failures, type parsing errors, or even service crashes for upstream and downstream dependencies. Therefore, GraphCode enforces a lock on published field types at the protocol layer to ensure absolute robustness of the system contract.
*   **Allowed Changes**: Non-structural constraints (e.g., `@min` / `@max`), indexing strategies (`@index`), and metadata descriptions (`@title` / `@desc`) are non-destructive evolutions and can be updated and applied at any time.

### 2.3 Emergency Change Exit
If a change is confirmed safe (e.g., new model, no existing data), a super administrator can force an update through the following steps:
1.  Call the `updateMetaProperty` interface to force modify the field type.
2.  Regenerate the version and publish.

---

## 3. Commercial Value

*   **Zero-Downtime Evolution**: Business logic expands at any time without service restart.
*   **Production-Grade Security**: Strict type protection prevents online incidents caused by arbitrary protocol changes.
*   **Transparent Governance**: Full-process versioning ensures the traceability of the Schema.
