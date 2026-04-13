# Shortest Path (Shortest Path)

The Shortest Path function allows for finding the optimal connection path between two nodes in a complex graph network. GraphCode supports **cross-model search** and can calculate the true optimal path based on edge attributes (e.g., cost, latency).

## 1. Business Scenario: IT Link Analysis
In a network topology, a data packet might pass through multiple models like `Server -> Switch -> Router`. We want to find the shortest path from a specific server to the core router.

## 2. DSL Model Preparation
To support shortest path, it is recommended to define `facets` weights on relational edges.

```graphql
Server {
    name @type(string) @index(exact)
    connects @type([]Switch) @facets(cost:int) @inv(servers)
}

Switch {
    name @type(string) @index(exact)
    toRouter @type([]Router) @facets(cost:int) @inv(switches)
}

Router {
    name @type(string) @index(exact)
    switches @type([]Switch) @inv(toRouter)
}
```

## 3. Path Search Syntax (shortestPath)

`shortestPath` is a root query directive.

```graphql
query {
  shortestPath(
    from: ID!           # Starting node UID
    to: ID!             # Ending node UID
    numpaths: Int       # Number of paths to return (default 1)
    weightFacet: String # Name of the edge attribute to use as weight (optional)
    via: ViaInput       # Required: Defines the models and edges allowed to be traversed
  ): ShortestPathResult
}
```

### 3.1 Strongly-Typed Traversal Rules (via)
The `via` object determines the algorithm's search path (boundaries). Field names are formatted as `ModelName_FieldName`:

```graphql
# Scenario: Allow traversal through Server->Switch and Switch->Router
via: {
  Server_connects: {},
  Switch_toRouter: {}
}
```

## 4. Real-World Example: Calculating the Lowest Cost Path

```graphql
query {
  shortestPath(
    from: "0x1", 
    to: "0x3", 
    weightFacet: "cost", # Calculated by accumulating cost values
    via: {
      Server_connects: {},
      Switch_toRouter: {}
    }
  ) {
    totalNode
    nodes { id type } # Model type for all nodes on the path
    paths {
      totalWeight 
      steps {
        fromID
        toID
        predicate # Which field this step follows (e.g., Server.connects)
        facets    # All attributes on the edge for this step (latency, cost, etc.)
      }
    }
  }
}
```

## 5. Result Details

- **totalNode**: Total number of nodes involved in the result.
- **nodes**: Node dictionary. The `type` field corresponds to the DSL model name, useful for frontend rendering.
- **paths**: List of paths. `steps` is an ordered array describing each hop from start to finish.

## 6. Precautions
- **Directionality**: To support reverse search (e.g., Router -> Server), you must explicitly enable reverse edges in `via` (e.g., `Router_switches`).
- **Performance Protection**: It is recommended to always precisely limit traversal paths via `via` to avoid blind searching in large-scale graphs by declaring too many paths.
