# 数据建模指南 (Schema DSL)

GraphCode 的核心开发体验源于 **Schema 驱动设计**。你只需通过声明式的 DSL 定义你的业务领域模型，系统将自动为你构建高性能的图底座、GraphQL API 以及权限校验逻辑。

---

## 1. 定义你的第一个模型

模型由 **模型名** 和一对 **大括号** 组成。模型名推荐使用大驼峰命名（如 `UserGroup`）。

```graphql
# 定义一个简单的用户模型
User {
    username @type(string) @index(hash) @required @uni @uniNm(primary)
    age @type(int) @index(int)
}
```

## 2. 建立图关系 (Relations)

图数据库的灵魂在于关系。GraphCode 支持三种核心建模模式：

### 2.1 一对一 (1:1) 排他性关联
适用于“员工与工位”、“用户与档案”等场景。
```
Employee {
    name @type(string) @index(exact)
    desk @type(Desk) @inv(occupant)
}
Desk {
    code @type(string) @index(exact)
    occupant @type(Employee) @inv(desk)
}
```
> **注意**：GraphCode 会自动维护双向一致性。如果 Bob 抢占了 Alice 的工位，Alice 的 `desk` 字段会自动清空。

### 2.2 一对多 (1:N) 双向关联
最常见的场景，如“部门与员工”、“分类与商品”。
```
Department {
    name @type(string) @index(exact)
    employees @type([]Employee) @inv(dept)
}
Employee {
    name @type(string) @index(exact)
    dept @type(Department) @ref(Department) @inv(employees) @invIL
}
```

### 2.3 多对多 (N:N) 关联
如“用户与角色”、“学生与课程”。只需在两端都使用 `[]` 类型并互设 `@inv` 即可。

---

## 3. 使用接口 (Interface) 进行抽象

接口是 GraphCode 的高级特性，用于 **跨模型强制统一字段** 或实现 **全局唯一约束**。

### 场景：跨设备的全局资产编号唯一
```
# 定义基础接口
BaseAsset @isInterface {
    assetCode @type(string) @uni @uniNm(primary) @index(hash)
}

# 服务器继承 BaseAsset
Server @interface(BaseAsset) {
    cpuCount @type(int)
}

# 交换机继承 BaseAsset
Switch @interface(BaseAsset) {
    portCount @type(int)
}
```
通过这种方式，即便是一个 `Server` 和一个 `Switch`，它们的 `assetCode` 也不能重复。

---

## 4. 模型高级配置

*   **启用审计 (`@mutRecord`)**：在模型名后添加此指令，系统会自动记录该模型的所有变更细节。
*   **计算字段 (`@exp`)**：定义仅供查询使用的实时计算属性。
*   **地理位置 (`@type(geo)`)**：定义具备空间搜索能力的坐标字段（支持点和多边形）。

---

## 5. 深入了解

当你准备好深入了解每个具体指令（如索引类型、校验规则、向量配置）时，请查阅：

👉 **[Schema DSL 指令参考手册](./schema-dsl-reference.md)**
