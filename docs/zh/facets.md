# 边属性 (Facets)

在图数据库中，除了节点（Node）可以拥有属性外，节点之间的“关联边”（Edge）也可以存储元数据。这些元数据被称为 **边属性 (Facets)**。常见的应用场景包括记录服务器连接的延迟、或者是物流路线的运输成本。

## 1. 业务场景：IT 网络拓扑
假设我们要管理一个数据中心网络。节点包含服务器（Server）和交换机（Switch）。我们需要在它们之间的物理连接上记录：
- **latency**: 毫秒级的网络延迟（float）。
- **cost**: 租用该带宽的月度成本（int）。

## 2. DSL 定义

在模型定义中，为关联字段增加 `@facets` 指令。

```graphql
# 服务器模型
Server {
    name @type(string) @index(exact)
    # 服务器连接到交换机，定义 latency 和 cost 两个边属性
    connects @type([]Switch) @facets(latency:float, cost:int) @inv(servers)
}

# 交换机模型
Switch {
    name @type(string) @index(exact)
    servers @type([]Server) @inv(connects)
}
```

## 3. 边属性的写入与更新 (Mutation)

### 3.1 建立关联并赋予属性 (_CONNECT)
在使用 `_CONNECT` 操作符建立关系时，通过 `facet` 参数传入初始元数据。

```graphql
mutation {
  updateServers(
    where: { name: "Server-1" },
    update: {
      connects_CONNECT: {
        where: { name: "Switch-Core" },
        facet: { latency: 0.5, cost: 10 } # 写入边属性
      }
    }
  ) {
    nodeUpdated
  }
}
```

### 3.2 仅更新边属性 (updateFacet)
如果关联已经存在，仅需要调整延迟或成本，使用 `updateFacet`。这执行原子更新，不会创建重复的边，也不会影响节点自身的属性。

```graphql
mutation {
  updateServers(
    where: { name: "Server-1" },
    update: {
      connects_UPDATE: {
        where: { name: "Switch-Core" },
        updateFacet: { latency: 0.3 } # 仅更新延迟，cost 保持不变
      }
    }
  ) {
    nodeUpdated
  }
}
```

## 4. 边属性过滤 (Query)

在查询关联字段时，可以使用 `whereFacet` 参数对“边”进行实时过滤。

### 4.1 基础过滤
场景：寻找从 Server-1 出发，延迟小于 1.0ms 的所有交换机：
```graphql
query {
  queryServers(where: { name: "Server-1" }) {
    name
    # 仅召回符合边属性条件的关联对象
    connects(whereFacet: { latency_LT: 1.0 }) {
      name
    }
  }
}
```
### 4.2 逻辑组合 (AND/OR/NOT)
`whereFacet` 支持与普通 `where` 相同的逻辑嵌套能力：
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

## 5. 核心标准

1. **零残留原则**：当断开关联时，边上的所有 Facets 属性会被同步物理删除。
