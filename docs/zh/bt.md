# BT 业务编排 (Behavior Tree)

在复杂的商业系统中，简单的 CRUD 接口往往无法直接支撑业务逻辑。GraphCode 引入了 **BT (Behavior Tree) 业务编排引擎**，允许开发者通过 YAML 声明式地组合指令，实现数据操作与业务流程的极致解耦。

---

## 1. 核心定义组件

一个行为树通过 YAML 文件进行逻辑描述，其核心字段如下：

### 1.1 基础元数据
*   **`name`**: 行为树名称。它是生成的业务接口名的前缀。
*   **`version`**: 业务逻辑版本号。行为树本质是业务逻辑，支持版本迭代。
    *   **实例化机制**：行为树执行时，会先根据当前的 YAML 模板 **实例化** 一棵树。一旦实例化完成，该次执行将完全遵循当时的快照逻辑，不会受到后续版本升级的影响，确保了执行一致性。

### 1.2 黑板定义 (`blackboard`)
黑板定义了数据在节点间传递的 **规则**（基于 `jq` 表达式）。
*   **`jq_input`**: 定义每个节点运行前的 **输入构造**。它从全局黑板或用户信息中提取数据，转化为该节点执行所需的变量。
*   **`jq_output`**: 定义每个节点运行后的 **结果处理**。
    *   **局部提升**：用于将子节点执行产生的局部数据提取到 **全局黑板** 中，以便后续节点引用。
    *   **结果定制**：**关键特性**。行为树生成的接口没有固定返回格式。通过定义根节点（通常 ID 为 `"00001"`）的 `jq_output`，开发者可以精确自定义该业务接口最终返回给前端的数据结构。

### 1.3 根节点定义 (`root`)
*   **`funcIO`**: 行为树的入参 Schema 定义。语法与 [Schema DSL](./schema-dsl.md) 基本一致，但由于是内存对象，**不需要定义 `@index` 等数据库指令**。
*   **`children`**: 定义子节点列表。通过递归嵌套 `children` 参数，构造出任意形状的业务逻辑树。
*   **`doFunc`**: 节点执行的业务核心。支持 **`graphql`**、**`http`**、**`grpc`** 三种类型，足以覆盖绝大多数微服务编排场景。

---

## 2. 运行时上下文 (Runtime Context)

在行为树执行期间，系统维护两级状态：

*   **全局黑板 (`blackboard`)**：整个生命周期内共享。包含用户的原始输入（`__input`）、认证信息（`__auth`）以及由节点回写的自定义变量。
*   **局部黑板 (`localBlackboard`)**：仅当前节点有效。其中 `__output` 存储了当前节点执行器返回的原始结果。

---

## 3. 全生命周期流程：以“创建订单”为例

### 3.1 第一步：定义行为树 (`upsertMetaBT`)
通过 `upsertMetaBT` 接口提交 YAML 定义。

```graphql
mutation{
  upsertMetaBT(input:"""
name: "CreateOrder"
version: "v20250711"
blackboard:
  jq_input:
    "00001-00002": >
      .blackboard.__auth.user.id as $userID |
      {
        userID:$userID
      }
    "00001-00003": >
      .blackboard.__input.input as $input |
      {
        input:{
          uuid: .blackboard.__uuid,
          createdAt: .blackboard.__createdAt,
          status: "unpaid",
          description: $input.remark,
          address_CONNECT: {
            where: {
              id: $input.addressId
            }
          },
          items_CONNECT: {
            where: {
              id: .blackboard.__items_id
            }
          },
          user_CONNECT: {
            where: {id: .blackboard.__auth.user.id}
          }
        }
      }
    "00001-00004": >
      {
        id: .blackboard.__items_id
      }
  jq_output:
    "00001": >
      {
        uuid:.blackboard.__uuid,
        createdAt:.blackboard.__createdAt
      }
    "00001-00001": >
      {
        __uuid:.localBlackboard.__output.systemInfo.uuid,
        __createdAt:.localBlackboard.__output.systemInfo.time_rfc3339
      }
    "00001-00002": >
      {__items_id:.localBlackboard.__output.queryCarts[0].items[].id}
    "00001-00003": >
      {createOrders:.localBlackboard.__output}
root:
  deprecated: false
  tickType: ""
  funcIO: |
    Input{
      addressId @type(string) @required
      paymentMethod @type(string) @required
      remark @type(string) @required
    }
    Output{
      input @type(string) @isScalar
      output @type(string) @isScalar
    }
  children:
    - doFunc:
        type: "graphql"
        graphql: |
          {
            systemInfo{
              uuid
              time_rfc3339
            }
          }
    - doFunc:
        type: "graphql"
        graphql: |
          query($userID:String!){
            queryCarts(where:{
              userID:$userID
            }){
              userID
            	items(where:{selected:true}){
                id
                quantity
                product{
                  id
                  name
                  price
                  stock
                }
              }
            }
          }
    - precheck: ""
      doFunc:
        type: "graphql"
        graphql: |
          mutation($input:OrderCreate!){
            createOrders(input:[$input]){
              nodeCreated
              orders{
                id
              }
            }
          }
    - precheck: ""
      doFunc:
        type: "graphql"
        graphql: |
          mutation($id:String!){
            updateItems(
              where:{
                id:[$id]
              }
              update:{
                cart_DISCONNECT:{}
              }
            ){
              nodeUpdated
            }
          }
    """)
}
```

### 3.2 第二步：发布接口 (`generateAndPublishMetaBTFunc`)
提交定义后，需要调用发布接口来实时生成对应的 GraphQL 函数。

```graphql
mutation {
  generateAndPublishMetaBTFunc
}
```

### 3.3 第三步：使用业务接口
发布后，系统会根据 `Name__Version` 命名规范自动生成新的 API。其返回的 `data` 内容完全由根节点（`00001`）的 `jq_output` 定义：

```graphql
mutation {
  # 格式为：名称__版本号
  CreateOrder__v20250711(
    input: {
      addressId: "0x2a"
      remark: "请在下午配送，注意商品颜色"
    }
  )
}
```

---

## 4. 最佳实践

1.  **最小入参原则**：只让用户传递必须的参数。所有的逻辑判定（如初始化状态、内部关联）应在 BT 内部完成。
2.  **安全隔离**：对于涉及核心资产（如余额、订单）的写入操作，建议关闭模型层面的直接 Mutation 权限，仅通过发布后的 BT 接口进行访问。
3.  **节点解耦**：尽量让每个节点只执行一个操作，复杂的逻辑转换全部在 `jq_input` 中完成。
