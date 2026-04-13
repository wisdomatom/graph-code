# Edge Attributes (Facets)

In a graph database, not only can nodes have attributes, but the "relationships" (Edges) between them can also store metadata. This metadata is referred to as **Edge Attributes (Facets)**. Common application scenarios include recording the latency of a server connection or the transportation cost of a logistics route.

## 1. Business Scenario: IT Network Topology
Assume we are managing a data center network. Nodes include Servers and Switches. We need to record the following on the physical connections between them:
- **latency**: Network latency in milliseconds (float).
- **cost**: Monthly cost of leasing that bandwidth (int).

## 2. DSL Definition

Add the `@facets` directive to the relational field in the model definition.

```graphql
# Server Model
Server {
    name @type(string) @index(exact)
    # Server connects to Switch, defining latency and cost edge attributes
    connects @type([]Switch) @facets(latency:float, cost:int) @inv(servers)
}

# Switch Model
Switch {
    name @type(string) @index(exact)
    servers @type([]Server) @inv(connects)
}
```

## 3. Writing and Updating Edge Attributes (Mutation)

### 3.1 Establish Relationship with Attributes (_CONNECT)
When establishing a relationship using the `_CONNECT` operator, pass initial metadata through the `facet` parameter.

```graphql
mutation {
  updateServers(
    where: { name: "Server-1" },
    update: {
      connects_CONNECT: {
        where: { name: "Switch-Core" },
        facet: { latency: 0.5, cost: 10 } # Writing edge attributes
      }
    }
  ) {
    nodeUpdated
  }
}
```

### 3.2 Update Edge Attributes Only (updateFacet)
If the relationship already exists and you only need to adjust the latency or cost, use `updateFacet`. This performs an atomic update without creating duplicate edges or affecting the node's own attributes.

```graphql
mutation {
  updateServers(
    where: { name: "Server-1" },
    update: {
      connects_UPDATE: {
        where: { name: "Switch-Core" },
        updateFacet: { latency: 0.3 } # Update latency only; cost remains unchanged
      }
    }
  ) {
    nodeUpdated
  }
}
```

## 4. Edge Attribute Filtering (Query)

When querying relational fields, use the `whereFacet` parameter to perform real-time filtering on the "edges."

### 4.1 Basic Filtering
Scenario: Find all switches connected to Server-1 with a latency of less than 1.0ms:
```graphql
query {
  queryServers(where: { name: "Server-1" }) {
    name
    # Recall only relational objects matching edge attribute criteria
    connects(whereFacet: { latency_LT: 1.0 }) {
      name
    }
  }
}
```
### 4.2 Logical Composition (AND/OR/NOT)
`whereFacet` supports the same logical nesting capabilities as a regular `where`:
```graphql
query {
  queryServers(where: { name: "Server-1" }) {
    connects(whereFacet: {
      OR: [
        { latency_LT: 0.1 },
        { AND: [{ cost_LE: 20 }, { latency_LE: 0.5 }] }
      ]
    }) {
      name
    }
  }
}
```

## 5. Core Standards

1.  **Zero Residual Principle**: When an association is severed, all Facets attributes on the edge are physically deleted synchronously.
