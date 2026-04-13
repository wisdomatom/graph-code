# 地理位置搜索 (Geo Search)

GraphCode 原生支持地理位置数据（GeoJSON）的存储与搜索。系统自动将底层的空间索引能力转化为类型安全、结构化的 GraphQL 接口。

## 1. Schema 定义

在 DSL 中使用 `@type(geo)` 定义地理位置字段，并使用 `@index(geo)` 开启空间索引。

```graphql
# 场景：资产管理中的物理位置
Location {
    name @type(string) @index(exact)
    loc @type(geo) @index(geo)  # 存储点或多边形
}
```

## 2. 结构化数据写入 (Mutation)

系统支持以结构化对象的方式写入 **点 (Point)** 或 **多边形 (Polygon)**，无需手动拼接 JSON 字符串。

### 2.1 写入点坐标
```graphql
mutation {
  createLocations(input: [{
    name: "Hamon Tower",
    loc: { 
      point: { longitude: -122.422, latitude: 37.772 } 
    } 
  }]) {
    nodeCreated
  }
}
```

### 2.2 写入多边形
多边形采用 GeoJSON 标准的 `coordinates` 结构（支持外圈与内圈洞）。
```graphql
mutation {
  createLocations(input: [{
    name: "San Francisco Park",
    loc: {
      polygon: {
        coordinates: [{
          area: [
            { longitude: -122.43, latitude: 37.77 },
            { longitude: -122.43, latitude: 37.78 },
            { longitude: -122.41, latitude: 37.78 },
            { longitude: -122.41, latitude: 37.77 },
            { longitude: -122.43, latitude: 37.77 } # 首尾相连闭合
          ]
        }]
      }
    }
  }]) {
    nodeCreated
  }
}
```

## 3. 空间过滤查询 (Query Where)

针对 `geo` 字段，系统提供了丰富的过滤操作符：

| 操作符 | 说明 | 输入类型 |
| :--- | :--- | :--- |
| `_NEAR` | 附近搜索（圆心+距离） | `NearInput` |
| `_WITHIN` | 在指定多边形区域内 | `[PolygonAreaInput!]` |
| `_CONTAINS` | 包含指定点/区域 | `GeoInput` |
| `_INTERSECTS` | 与指定多边形区域相交 | `[PolygonAreaInput!]` |

### 示例：附近搜索
搜索坐标 `[-122.46, 37.77]` 附近 1000 米以内的位置。
```graphql
query {
  queryLocations(where: {
    loc_NEAR: {
      center: { longitude: -122.46, latitude: 37.77 },
      distance: 1000
    }
  }) {
    name
  }
}
```

### 示例：区域内搜索
针对 `_WITHIN` 和 `_INTERSECTS`，系统进行了扁平化优化，直接接受区域列表：
```graphql
query {
  queryLocations(where: {
    loc_WITHIN: [
      {
        area: [
          { longitude: -122.43, latitude: 37.77 },
          { longitude: -122.43, latitude: 37.78 },
          { longitude: -122.41, latitude: 37.78 },
          { longitude: -122.41, latitude: 37.77 },
          { longitude: -122.43, latitude: 37.77 }
        ]
      }
    ]
  }) {
    name
  }
}
```

## 4. 获取结构化结果 (Selection Set)

查询返回的地理位置数据也是完全结构化的，包含 `type` 枚举以及对应的坐标对象。

```graphql
query {
  queryLocations {
    name
    loc {
      type    # 返回 "POINT" 或 "POLYGON"
      point {
        longitude
        latitude
      }
      polygon {
        coordinates {
          area {
            longitude
            latitude
          }
        }
      }
    }
  }
}
```

## 5. 注意事项
1. **坐标顺序**：严格遵循 GeoJSON 标准，即 **[经度 (Longitude), 纬度 (Latitude)]**。
2. **多态性**：同一个 `geo` 字段可以同时存储点和多边形，引擎会自动处理索引。
3. **闭合多边形**：定义 `area` 时，最后一个点必须与第一个点相同以实现闭合。
