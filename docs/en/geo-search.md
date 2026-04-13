# Geospatial Search (Geo Search)

GraphCode natively supports the storage and search of geospatial data (GeoJSON). The system automatically transforms underlying spatial indexing capabilities into type-safe, structured GraphQL interfaces.

## 1. Schema Definition

Use `@type(geo)` in the DSL to define a geospatial field, and use `@index(geo)` to enable spatial indexing.

```graphql
# Scenario: Physical location in asset management
Location {
    name @type(string) @index(exact)
    loc @type(geo) @index(geo)  # Stores points or polygons
}
```

## 2. Structured Data Entry (Mutation)

The system supports writing **Points** or **Polygons** as structured objects, eliminating the need to manually concatenate JSON strings.

### 2.1 Writing Point Coordinates
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

### 2.2 Writing Polygons
Polygons follow the GeoJSON standard `coordinates` structure (supporting outer rings and inner holes).
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
            { longitude: -122.43, latitude: 37.77 } # Closed by connecting last point to first
          ]
        }]
      }
    }
  }]) {
    nodeCreated
  }
}
```

## 3. Spatial Filtering Queries (Query Where)

For `geo` fields, the system provides a rich set of filtering operators:

| Operator | Description | Input Type |
| :--- | :--- | :--- |
| `_NEAR` | Proximity search (center + distance) | `NearInput` |
| `_WITHIN` | Within a specified polygonal area | `[PolygonAreaInput!]` |
| `_CONTAINS` | Contains a specified point/area | `GeoInput` |
| `_INTERSECTS` | Intersects with a specified polygonal area | `[PolygonAreaInput!]` |

### Example: Proximity Search
Search for locations within 1000 meters of the coordinates `[-122.46, 37.77]`.
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

### Example: Search Within Area
For `_WITHIN` and `_INTERSECTS`, the system is flattened and optimized to directly accept a list of areas:
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

## 4. Retrieve Structured Results (Selection Set)

Geospatial data returned by queries is also fully structured, containing a `type` enum and corresponding coordinate objects.

```graphql
query {
  queryLocations {
    name
    loc {
      type    # Returns "POINT" or "POLYGON"
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

## 5. Precautions
1.  **Coordinate Order**: Strictly follow the GeoJSON standard: **[Longitude, Latitude]**.
2.  **Polymorphism**: The same `geo` field can store both points and polygons; the engine handles indexing automatically.
3.  **Closed Polygons**: When defining an `area`, the last point must be identical to the first point to achieve closure.
