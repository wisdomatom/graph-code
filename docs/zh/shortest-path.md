# 最短路径 (Shortest Path)

最短路径功能允许在复杂的图网络中寻找两个节点之间的最优连接路径。GraphCode 支持**跨模型搜索**，并能根据边属性（如成本、延迟）计算真正的最优路径。

## 1. 业务场景：IT 链路分析
在一个网络拓扑中，数据包可能经过 `Server -> Switch -> Router` 多个模型。我们希望找到从某台服务器到核心路由器的最短路径。

## 2. DSL 模型准备
要支持最短路径，建议在关联边上定义 `facets` 权重。

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

## 3. 路径搜索语法 (shortestPath)

`shortestPath` 是一个根查询指令。

```graphql
query {
  shortestPath(
    from: ID!           # 起点 UID
    to: ID!             # 终点 UID
    numpaths: Int       # 返回路径数量 (默认 1)
    weightFacet: String # 指定权重的边属性名 (可选)
    via: ViaInput       # 必填：定义允许经过的模型边
  ): ShortestPathResult
}
```

### 3.1 强类型遍历规则 (via)
`via` 对象决定了算法的搜索路径（边界）。字段名为 `模型名_字段名`：

```graphql
# 场景：允许经过 Server->Switch 和 Switch->Router
via: {
  Server_connects: {},
  Switch_toRouter: {}
}
```

## 4. 实战示例：计算最低成本路径

```graphql
query {
  shortestPath(
    from: "0x1", 
    to: "0x3", 
    weightFacet: "cost", # 按成本累加值计算
    via: {
      Server_connects: {},
      Switch_toRouter: {}
    }
  ) {
    totalNode
    nodes { id type } # 包含路径上所有节点的模型类型
    paths {
      totalWeight 
      steps {
        fromID
        toID
        predicate # 这一步走的是哪个字段 (如 Server.connects)
        facets    # 这一步边上的所有属性 (latency, cost 等)
      }
    }
  }
}
```

## 5. 返回结果详解

- **totalNode**: 结果涉及的节点总数。
- **nodes**: 节点字典。`type` 字段对应 DSL 模型名，用于前端渲染。
- **paths**: 路径列表。`steps` 是有序数组，描述了从起点到终点的每一跳。

## 6. 注意事项
- **双向性**：若需支持反向搜索（如 Router -> Server），必须在 `via` 中显式开启反向边（如 `Router_switches`）。
- **性能保护**：建议始终通过 `via` 精确限定遍历路径，避免声明太多路径，导致在大规模图中执行盲目搜索。
