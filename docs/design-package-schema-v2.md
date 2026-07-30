# Design Package Schema V2（草案）

> 状态：Draft for human review
> 适用阶段：Design Package 数据合同设计
> 不包含：Plugin 修改、V2 migration、Import、Audit 执行器、Export 实现

## 1. V2 设计原则

### 1.1 三类信息必须分离

Design Package 同时服务 Figma Compiler、人工设计验收与 Codex 开发，但三类信息的约束强度不同：

| 类型 | 定义 | 默认行为 | 主要存放位置 |
| --- | --- | --- | --- |
| Design Fact | 可从设计稿、代码、HTML、截图或人工标注中确认的客观事实 | Compiler 和 Codex 必须遵守；如需修改，应先更新事实或人工 override | `foundations.json`、`components.json`、`patterns.json`、`screens.json`、`interactions.json` |
| Design Decision | 已经人工确认的产品、交互或视觉选择 | Codex 不得自行“优化”或推翻；变更必须经过明确评审 | `decisions.json`，由其他对象通过稳定 ID 引用 |
| Implementation Hint | 面向开发的非强制建议 | Codex 可根据现有代码调整，但偏离时必须说明原因 | `implementation-hints.json`，由其他对象通过稳定 ID 引用 |

不建议在每个字段上重复写 `fact`、`decision` 或 `hint`。事实直接保存在事实文件中；Decision 和 Hint 是独立、可引用、可审计的稳定对象。这样能避免同一条信息在多个 Screen 或 Component 中复制和漂移。

### 1.2 JSON Contract 是 source of truth

- Figma `descriptionMarkdown`、Codex README、审计报告等都是可生成产物。
- 生成产物不得反向成为稳定身份或核心数据来源。
- Component 的文档字段应足以确定性生成 `descriptionMarkdown`，但不要求人工维护两份内容。

### 1.3 稳定 ID 与展示名称分离

- `id`：跨版本稳定，用于引用、同步、映射和审计。
- `name`：人类可读，可在不改变身份的情况下调整。
- `figmaName`：符合 Figma 命名要求。
- `codeName`：符合目标代码语言和项目约定。
- 禁止使用数组 index、展示文本、图层名称或当前文件路径作为稳定身份。

建议稳定 ID 使用小写点分层级：

```text
package.campus-warning-mobile
design-system.campus-warning
primitive.color.blue.500
semantic.action.primary
component.button
pattern.feedback-form
screen.pending-tasks
interaction.feedback.submit
decision.feedback-form.presentation
hint.feedback-form.reuse-bottom-sheet
mapping.component.button.react
rule.component.missing-description
source.existing-code.tokens
reference.pending-tasks.desktop
```

### 1.4 语义优先

- Primitive Token 描述原始值。
- Semantic Token 描述用途，并优先 alias Primitive Token。
- Component 优先绑定 Semantic Token。
- Screen 不重复定义 Component 已拥有的颜色、圆角、字号等视觉事实。

### 1.5 确定性与有限自由

每个可生成对象必须明确：

- 稳定身份；
- 类型；
- 引用目标；
- 属性与状态；
- 排列和布局约束；
- 缺失或冲突时的失败策略；
- 哪些是不可变事实、已确认决策和可调整建议。

遇到未知内容应标记 `needs-review`，而不是让 Compiler 或 Codex静默猜测。

### 1.6 可追溯、可覆盖、可审计

- 每个核心对象必须具有 `sourceRefs` 与 `confidence`。
- 关键字段可通过 `provenance` 提供字段级来源和置信度。
- 人工 override 不覆盖历史证据；它以显式记录说明覆盖值、原因和审核人。
- Audit Rule 与 Audit Result 分离：`audit-rules.json` 是规则定义，`audit.json` 是未来导出的执行结果。

### 1.7 V2 不是完整设计工具

V2 定义数据合同，不承诺：

- 任意 Figma 节点树序列化；
- 任意网页到设计系统的自动推断；
- 任意代码框架的直接生成；
- 无人工审核的低置信度事实落地；
- 通用迁移或 Diff Engine。

## 2. 完整目录结构

建议保留题目中的主目录，仅给 `references/` 增加索引文件：

```text
design-package/
├─ manifest.json
├─ foundations.json
├─ components.json
├─ patterns.json
├─ screens.json
├─ interactions.json
├─ decisions.json
├─ implementation-hints.json
├─ code-mapping.json
├─ audit-rules.json
└─ references/
   ├─ index.json
   ├─ images/
   ├─ html/
   └─ notes/
```

调整理由：

1. `references/index.json` 为二进制图片、HTML 快照和说明文件提供稳定 ID、校验值和来源信息。
2. 不建议把 JSON Schema 定义文件放进每个 Design Package。未来若实现机器校验，应在仓库级维护版本化的 `schemas/design-package/v2/`，避免数据包同时携带并修改自己的验证规则。
3. 不在源包中加入 `audit.json`。它是运行 `audit-rules.json` 后产生的结果，应出现在 Export for Codex 中。

## 3. 每个文件职责

| 文件 | 主要职责 | 禁止承载 |
| --- | --- | --- |
| `manifest.json` | 包身份、版本、平台、来源索引、设计系统身份、Screen 清单、兼容性 | 具体 Component、Token 或业务页面内容 |
| `foundations.json` | Primitive/Semantic Token，覆盖 Color、Typography、Spacing、Radius、Effects、Border、Sizing | Component 私有结构和 Screen 布局 |
| `components.json` | Component 的结构、属性、状态、布局、Token 绑定、内容和实现契约 | Screen 特有文案和页面排列 |
| `patterns.json` | 多个 Component 组合形成的可复用布局与行为模式 | 可独立发布的原子 Component 定义 |
| `screens.json` | Screen 结构、状态、Component/Pattern 引用、响应式规则、决策与提示引用 | 重复定义 Component 视觉 Token |
| `interactions.json` | trigger、guard、action、target、loading/success/failure 状态转换 | 具体代码事件处理实现 |
| `decisions.json` | 已人工确认且不允许 Codex 自行推翻的稳定决策 | 可随代码条件调整的建议 |
| `implementation-hints.json` | 可调整的工程建议和偏离说明要求 | 设计事实和不可变产品决策 |
| `code-mapping.json` | Figma/Schema 到现有代码组件、props、events、tokens 的映射 | 设计事实本身 |
| `audit-rules.json` | 审计规则定义、严重级别、作用域和 blocking 策略 | 某次审计的运行结果 |
| `references/index.json` | 参考资产的稳定身份、路径、媒体类型、来源和校验值 | 未登记的散落文件 |

## 4. 公共类型和字段约定

### 4.1 REQUIRED / OPTIONAL 标记

后续字段表使用：

- **R**：REQUIRED。对象缺失该字段即无效。
- **O**：OPTIONAL。仅在有事实或明确需求时提供。
- **C**：CONDITIONAL。满足指定条件时 REQUIRED。

空字符串不等于缺失。未知值应省略可选字段，或将相应 `confidence` 标记为 `needs-review`，不得用虚构值填充。

### 4.2 公共对象元数据

所有核心实体（Token、Component、Pattern、Screen、Interaction、Decision、Hint、Mapping、Audit Rule）共享：

| 字段 | 要求 | 类型 | 说明 |
| --- | --- | --- | --- |
| `id` | R | string | 稳定 ID，在所属对象类型内唯一 |
| `name` | R | string | 人类可读展示名称 |
| `description` | R | string | 简洁说明对象是什么 |
| `sourceRefs` | R | string[] | 引用 Manifest 中的来源 ID；人工创建也必须引用 `manual` 来源 |
| `confidence` | R | enum | `exact`、`high`、`medium`、`low`、`needs-review` |
| `provenance` | O | Provenance[] | 字段级来源、置信度和人工 override |
| `tags` | O | string[] | 搜索、分组和审计标签，不参与身份 |
| `extensions` | O | object | 命名空间化扩展；核心消费者可安全忽略 |

### 4.3 Source Reference

Manifest 中统一登记来源：

| 字段 | 要求 | 类型 | 说明 |
| --- | --- | --- | --- |
| `id` | R | string | 例如 `source.existing-code.tokens` |
| `kind` | R | enum | `screenshot`、`html`、`website`、`figma`、`existing-code`、`manual` |
| `uri` | R | string | 相对路径、Figma URL、网页 URL 或仓库路径 |
| `label` | R | string | 人工可读名称 |
| `capturedAt` | C | ISO 8601 | 截图、网页或 HTML 快照必须提供 |
| `revision` | O | string | commit SHA、Figma version、ETag 等 |
| `checksum` | O | string | 本地快照或资产建议提供 SHA-256 |
| `notes` | O | string | 来源限制、裁剪范围、认证条件等 |

### 4.4 Confidence

| 值 | 使用条件 | 默认处理 |
| --- | --- | --- |
| `exact` | 直接读取 CSS Variable、Figma Variable、代码常量或人工明确输入 | 可进入确定性生成 |
| `high` | 多个可靠来源一致，只有微小解释空间 | 可生成，但人工验收应可追溯 |
| `medium` | 截图测量、视觉推断或单一非结构化来源 | 生成前建议人工确认 |
| `low` | 弱证据或多种解释均合理 | 不应成为 blocking 设计事实 |
| `needs-review` | 冲突、缺失、无法判断或等待人工 override | Compiler/Codex 应停止相关范围或明确降级 |

### 4.5 字段级 Provenance 与人工 Override

```json
{
  "path": "/layout/padding/inline",
  "sourceRef": "source.figma.button",
  "confidence": "exact",
  "observedValue": {
    "tokenRef": "semantic.spacing.control-inline"
  },
  "override": {
    "value": {
      "tokenRef": "semantic.spacing.control-inline-compact"
    },
    "reason": "人工验收确认移动端使用紧凑间距",
    "reviewedBy": "designer@example.com",
    "reviewedAt": "2026-07-30T10:00:00+08:00"
  }
}
```

规则：

- `path` 使用 JSON Pointer，指向当前对象内字段。
- `observedValue` 保留原始证据。
- 存在 `override` 时，消费者使用 `override.value`。
- 人工 override 不自动把低置信度来源改成 `exact`；它表示人工确认后的最终值。

## 5. Manifest Schema

### 5.1 顶层字段

| 字段 | 要求 | 类型 | 说明 |
| --- | --- | --- | --- |
| `packageId` | R | string | Design Package 稳定 ID |
| `packageVersion` | R | semver | 数据包内容版本 |
| `schemaVersion` | R | semver | Design Package Schema 版本，V2 初始建议 `2.0.0` |
| `name` | R | string | 数据包名称 |
| `description` | R | string | 范围和目的 |
| `platform` | R | enum[] | `web`、`mobile-web`、`ios`、`android`、`mini-program`、`desktop` |
| `createdAt` | R | ISO 8601 | 首次创建时间 |
| `updatedAt` | R | ISO 8601 | 当前包更新时间 |
| `designSystem` | R | object | 设计系统稳定身份和版本 |
| `sourceReferences` | R | SourceReference[] | 全包来源登记表 |
| `screens` | R | object[] | 仅列出 Screen ID、name 和所在文件，不放 Screen 内容 |
| `compatibility` | R | object | Compiler、Exporter、目标代码栈兼容信息 |
| `entrypoints` | R | object | 各合同文件的相对路径 |
| `locale` | O | string | 默认内容语言，例如 `zh-CN` |
| `status` | R | enum | `draft`、`review`、`approved`、`deprecated` |

### 5.2 `designSystem`

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 例如 `design-system.campus-warning` |
| `name` | R | 展示名称 |
| `version` | R | 设计系统内容版本 |
| `figmaLibraryKey` | O | 已发布 Figma Library 时提供 |
| `codePackage` | O | 对应代码包或工作区名称 |

### 5.3 `compatibility`

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `figmaCompiler` | R | `{ "minVersion": "...", "maxTestedVersion": "..." }` |
| `codexHandoff` | R | Handoff 合同版本 |
| `codeTargets` | R | 例如 React/TypeScript/Vite |
| `features` | R | 显式列出使用的 Schema feature，例如 `semantic-token-alias`、`screen-states` |

Manifest 不包含 Token、Component、Pattern 或 Screen 的具体业务内容。

## 6. Foundations Schema

### 6.1 顶层结构

```json
{
  "schemaVersion": "2.0.0",
  "designSystemId": "design-system.campus-warning",
  "primitives": [],
  "semantics": []
}
```

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `schemaVersion` | R | 与 Manifest 的 major version 兼容 |
| `designSystemId` | R | 引用 Manifest 的设计系统 ID |
| `primitives` | R | Primitive Token 数组 |
| `semantics` | R | Semantic Token 数组 |

### 6.2 Token Contract

| 字段 | 要求 | 类型 | 说明 |
| --- | --- | --- | --- |
| `id` | R | string | 稳定 Token ID |
| `figmaName` | R | string | Figma Variable 展示名，建议 slash 层级 |
| `codeName` | R | string | CSS Variable、TS key 或平台代码名 |
| `name` | R | string | 人工可读名称 |
| `description` | R | string | 语义和使用范围 |
| `category` | R | enum | `color`、`typography`、`spacing`、`radius`、`effect`、`border`、`sizing` |
| `type` | R | enum | `COLOR`、`FLOAT`、`STRING`、`BOOLEAN`、`TYPOGRAPHY`、`SHADOW`、`BORDER` |
| `value` | C | type-specific | Primitive 必须提供；Semantic 可提供直接值 |
| `alias` | C | string | Semantic 推荐提供；与 `value` 至少有一个且通常互斥 |
| `scope` | O | string[] | Figma Variable scopes 或语义用途 |
| `modes` | O | object | Light/Dark、Density 等 mode 值或 alias |
| `sourceRefs` | R | string[] | 来源 |
| `confidence` | R | enum | 置信度 |
| `provenance` | O | array | 字段级来源 |
| `deprecated` | O | object | 弃用原因和替代 Token |

### 6.3 类型覆盖

- Color：十六进制或标准 RGBA。
- Typography：family、weight、size、lineHeight、letterSpacing。
- Spacing：数值和单位。
- Radius：数值和单位。
- Effects：shadow/blur 的结构化数组。
- Border：width、style、color Token alias。
- Sizing：control height、icon size、content width 等。

示例：

```json
{
  "primitives": [
    {
      "id": "primitive.color.blue.500",
      "figmaName": "primitive/color/blue/500",
      "codeName": "--primitive-color-blue-500",
      "name": "Blue 500",
      "description": "Primary blue primitive.",
      "category": "color",
      "type": "COLOR",
      "value": "#3D73FF",
      "sourceRefs": ["source.existing-code.tokens"],
      "confidence": "exact"
    }
  ],
  "semantics": [
    {
      "id": "semantic.action.primary",
      "figmaName": "semantic/action/primary",
      "codeName": "--color-action-primary",
      "name": "Primary action",
      "description": "Background color for primary interactive actions.",
      "category": "color",
      "type": "COLOR",
      "alias": "primitive.color.blue.500",
      "scope": ["FILL_COLOR"],
      "sourceRefs": ["source.manual.design-review"],
      "confidence": "exact"
    }
  ]
}
```

Component 应绑定 `semantic.action.primary`，而不是直接绑定 `primitive.color.blue.500`。

## 7. Component Contract

### 7.1 顶层字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定 Component ID |
| `name` | R | 展示名称 |
| `description` | R | 一句话说明 |
| `purpose` | R | 解决什么设计问题 |
| `documentation` | R | `usage`、`dont`、可选 `notes`；用于生成 `descriptionMarkdown` |
| `figma` | R | Figma 节点和属性合同 |
| `anatomy` | R | 结构角色和嵌套关系 |
| `properties` | R | Variant、Boolean、Text、Instance Swap 属性 |
| `contentRegions` | O | slot/content region |
| `states` | R | 状态及其可见、交互和 Token 差异 |
| `layout` | R | 尺寸、Auto Layout、padding、gap、resizing |
| `tokenBindings` | R | 节点属性到 Semantic Token 的映射 |
| `contentRules` | R | 文案长度、允许内容、截断和空值策略 |
| `accessibility` | R | role、name、keyboard、minimum target 等 |
| `interactionHookRefs` | O | 引用 `interactions.json` |
| `decisionRefs` | R | 可为空数组；引用已确认 Decision |
| `implementationHintRefs` | R | 可为空数组；引用 Hint |
| `implementationContract` | R | 复用、必要行为和禁止实现 |
| `sourceRefs` | R | 来源 |
| `confidence` | R | 置信度 |
| `provenance` | O | 字段级来源 |

### 7.2 `figma`

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `nodeType` | R | `COMPONENT` 或 `COMPONENT_SET` |
| `name` | R | Figma 展示名称 |
| `stablePluginData` | R | `{ "key": "componentId", "value": "component.button" }` |
| `descriptionMarkdown` | O | 派生缓存；最终以 `documentation` 为准 |
| `variantPropertyOrder` | C | Component Set 必须提供 |

### 7.3 `properties`

每个属性：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Component 内稳定属性 ID |
| `name` | R | Figma/设计展示名 |
| `kind` | R | `variant`、`boolean`、`text`、`instance-swap` |
| `required` | R | 是否必须赋值 |
| `default` | R | 默认值 |
| `values` | C | Variant 必须提供合法值 |
| `target` | R | 影响的 anatomy role 或属性 |
| `description` | R | 属性语义 |

### 7.4 Anatomy

Anatomy 是可寻址的角色树，而不是完整 Figma 节点 dump：

```json
{
  "role": "root",
  "kind": "container",
  "required": true,
  "children": [
    {
      "role": "label",
      "kind": "text",
      "required": true
    },
    {
      "role": "leading-icon",
      "kind": "instance",
      "required": false
    }
  ]
}
```

`role` 在 Component 内稳定，供 Token Binding、Property target、Code Mapping 和 Audit 引用。

### 7.5 States

State 不等于 Variant。State 可以由 Variant、Boolean、Interaction 或外部状态组合产生：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 例如 `state.disabled` |
| `name` | R | 状态名称 |
| `entryCondition` | R | 属性或上下文条件 |
| `visualChanges` | R | 相对默认状态的 Token/visibility 变化 |
| `behavior` | R | 是否可交互、focus、loading 等 |
| `required` | R | 是否属于发布前必须实现的状态 |

### 7.6 Layout Contract

至少包括：

- `mode`：horizontal/vertical/none；
- `sizing`：hug/fill/fixed/min/max；
- `alignment`；
- `padding` 和 `gap` 的 Semantic Token refs；
- child resizing；
- overflow/wrap；
- 内容增长策略；
- 允许的固定尺寸及原因。

### 7.7 Implementation Contract

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `reusePolicy` | R | `must-reuse`、`prefer-reuse`、`may-implement`、`reference-only` |
| `preferredCodeComponent` | O | 人工可读代码组件名 |
| `mappingRef` | O | 指向 `code-mapping.json` |
| `requiredBehavior` | R | 必须保留的行为列表 |
| `forbiddenImplementation` | R | 禁止事项列表 |
| `missingMappingPolicy` | R | `block`、`abstract-first`、`allow-local`、`review-required` |

语义：

| reusePolicy | Codex 行为 |
| --- | --- |
| `must-reuse` | 必须使用已映射组件；映射缺失或不可用时停止并报告 |
| `prefer-reuse` | 优先复用；无法复用时说明原因并按 `missingMappingPolicy` 处理 |
| `may-implement` | 可创建新实现，但仍必须遵守事实和 Decision |
| `reference-only` | 仅作视觉/行为参考，不要求一对一代码组件 |

## 8. Component Contract 示例 JSON

```json
{
  "id": "component.button",
  "name": "Button",
  "description": "触发当前上下文中的明确操作。",
  "purpose": "提供具有清晰优先级、尺寸和状态反馈的可访问操作入口。",
  "documentation": {
    "usage": [
      "Primary 用于当前页面最重要的单一操作。",
      "Secondary 用于次要或可逆操作。"
    ],
    "dont": [
      "不要在同一操作组中放置多个同等强调的 Primary Button。",
      "不要在页面内部重新实现一套 Button 视觉样式。"
    ]
  },
  "figma": {
    "nodeType": "COMPONENT_SET",
    "name": "Button",
    "stablePluginData": {
      "key": "componentId",
      "value": "component.button"
    },
    "variantPropertyOrder": ["Type", "Size"]
  },
  "anatomy": {
    "role": "root",
    "kind": "container",
    "required": true,
    "children": [
      {
        "role": "leading-icon",
        "kind": "instance",
        "required": false
      },
      {
        "role": "label",
        "kind": "text",
        "required": true
      }
    ]
  },
  "properties": [
    {
      "id": "property.button.type",
      "name": "Type",
      "kind": "variant",
      "required": true,
      "default": "Primary",
      "values": ["Primary", "Secondary"],
      "target": "root",
      "description": "操作的视觉优先级。"
    },
    {
      "id": "property.button.size",
      "name": "Size",
      "kind": "variant",
      "required": true,
      "default": "MD",
      "values": ["SM", "MD"],
      "target": "root",
      "description": "按钮密度和触控尺寸。"
    },
    {
      "id": "property.button.disabled",
      "name": "Disabled",
      "kind": "boolean",
      "required": true,
      "default": false,
      "target": "root",
      "description": "阻止操作并呈现不可用状态。"
    },
    {
      "id": "property.button.label",
      "name": "Label",
      "kind": "text",
      "required": true,
      "default": "Button",
      "target": "label",
      "description": "使用动词开头的操作名称。"
    },
    {
      "id": "property.button.leading-icon",
      "name": "Leading icon",
      "kind": "instance-swap",
      "required": false,
      "default": "component.icon.placeholder",
      "target": "leading-icon",
      "description": "可选的操作语义图标。"
    }
  ],
  "contentRegions": [],
  "states": [
    {
      "id": "state.default",
      "name": "Default",
      "entryCondition": {
        "Disabled": false
      },
      "visualChanges": [],
      "behavior": {
        "interactive": true,
        "focusable": true
      },
      "required": true
    },
    {
      "id": "state.disabled",
      "name": "Disabled",
      "entryCondition": {
        "Disabled": true
      },
      "visualChanges": [
        {
          "target": "root.opacity",
          "value": 0.5
        }
      ],
      "behavior": {
        "interactive": false,
        "focusable": false
      },
      "required": true
    }
  ],
  "layout": {
    "mode": "horizontal",
    "sizing": {
      "width": "hug",
      "height": "hug",
      "minHeightBySize": {
        "SM": {
          "tokenRef": "semantic.sizing.control.sm"
        },
        "MD": {
          "tokenRef": "semantic.sizing.control.md"
        }
      }
    },
    "alignment": "center",
    "padding": {
      "inline": {
        "tokenRef": "semantic.spacing.control-inline"
      },
      "block": {
        "tokenRef": "semantic.spacing.control-block"
      }
    },
    "gap": {
      "tokenRef": "semantic.spacing.control-gap"
    },
    "wrap": false
  },
  "tokenBindings": [
    {
      "target": "root.fill",
      "when": {
        "Type": "Primary"
      },
      "tokenRef": "semantic.action.primary"
    },
    {
      "target": "root.fill",
      "when": {
        "Type": "Secondary"
      },
      "tokenRef": "semantic.surface.control-secondary"
    },
    {
      "target": "root.cornerRadius",
      "tokenRef": "semantic.radius.control"
    },
    {
      "target": "label.fill",
      "when": {
        "Type": "Secondary"
      },
      "tokenRef": "semantic.text.primary"
    }
  ],
  "contentRules": {
    "label": {
      "required": true,
      "minLength": 1,
      "maxLength": 20,
      "overflow": "hug",
      "guidance": "使用简短、明确、以动词开头的文案。"
    }
  },
  "accessibility": {
    "role": "button",
    "accessibleNameSource": "label",
    "keyboard": ["Enter", "Space"],
    "minimumTargetSizeTokenRef": "semantic.sizing.touch-target.minimum",
    "disabledSemanticsRequired": true
  },
  "interactionHookRefs": ["interaction.button.activate"],
  "decisionRefs": ["decision.actions.single-primary"],
  "implementationHintRefs": ["hint.component.button.use-existing"],
  "implementationContract": {
    "reusePolicy": "must-reuse",
    "preferredCodeComponent": "Button",
    "mappingRef": "mapping.component.button.react",
    "requiredBehavior": [
      "保留 disabled 语义。",
      "保留键盘激活行为。",
      "Variant 必须映射到现有 props。"
    ],
    "forbiddenImplementation": [
      "禁止在 Screen 或业务页面内重新实现 Button CSS。",
      "禁止使用不可访问的 div 代替 button。"
    ],
    "missingMappingPolicy": "block"
  },
  "sourceRefs": [
    "source.figma.button",
    "source.existing-code.button",
    "source.manual.design-review"
  ],
  "confidence": "exact"
}
```

`documentation` 可确定性生成 Figma `descriptionMarkdown`，例如按“Purpose / Usage / Don’t / Accessibility”顺序渲染。JSON 中的结构化字段仍是唯一 source of truth。

## 9. Patterns Schema

Pattern 描述多个 Component 的组合约束，不等于可发布 Component。

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id`、`name`、`description` | R | 稳定身份 |
| `purpose` | R | 模式解决的问题 |
| `composition` | R | 带稳定 role 的 Component/Pattern 引用树 |
| `layout` | R | 组合层布局、间距、顺序、响应式规则 |
| `behavior` | R | 多组件协同行为 |
| `states` | R | Pattern 级 loading/empty/error 等 |
| `contentRules` | R | 组合内容约束 |
| `interactionRefs` | R | 交互引用，可为空 |
| `decisionRefs` | R | Decision 引用，可为空 |
| `implementationHintRefs` | R | Hint 引用，可为空 |
| `sourceRefs`、`confidence` | R | 来源和置信度 |

`composition` 中引用 Component，只设置允许的 properties，不复制其 fill、radius 或 typography。

## 10. Screen Contract

### 10.1 顶层字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定 Screen ID |
| `name` | R | Screen 名称 |
| `description` | R | Screen 是什么 |
| `purpose` | R | 用户目标和业务作用 |
| `figma` | R | Frame 身份、平台画布和 Plugin Data |
| `layout` | R | Screen 级排列、边距、滚动和区域 |
| `children` | R | 带稳定 ID 的 direct child/region 引用 |
| `states` | R | 页面 default/loading/empty/error/disabled/success/timeout 等 |
| `interactionRefs` | R | Screen 相关交互，可为空 |
| `responsive` | R | breakpoint 和布局变化；固定平台也要明确 `fixed` |
| `decisionRefs` | R | Decision 引用，可为空 |
| `implementationHintRefs` | R | Hint 引用，可为空 |
| `referenceAssetRefs` | R | Reference 引用，可为空 |
| `sourceRefs` | R | 来源 |
| `confidence` | R | 置信度 |
| `provenance` | O | 字段级来源 |

### 10.2 Child Contract

每个 direct child：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Screen 内唯一稳定 ID |
| `kind` | R | `text`、`component`、`pattern`、`region` |
| `componentRef` | C | `kind=component` 时 REQUIRED |
| `patternRef` | C | `kind=pattern` 时 REQUIRED |
| `role` | R | 页面语义角色 |
| `properties` | O | 仅设置 Component 已声明属性 |
| `content` | O | Screen 特有文本或数据绑定 |
| `layout` | O | 仅定义 Screen 中的 placement，不覆盖 Component 内部布局 |
| `visibility` | O | 状态条件 |
| `decisionRefs` | R | 可为空 |
| `implementationHintRefs` | R | 可为空 |

### 10.3 Page States

每个 Screen State：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | `state.default`、`state.loading` 等 |
| `name` | R | 人工可读名称 |
| `required` | R | 是否必须实现 |
| `entryCondition` | R | 进入条件 |
| `childOverrides` | R | visibility、content、properties 的增量覆盖 |
| `interactionAvailability` | R | 该状态允许的 Interaction refs |
| `fallback` | O | 未支持状态的明确回退 |

未观察到的状态不应自动编造视觉。可将其标记：

```json
{
  "id": "state.timeout",
  "name": "Timeout",
  "required": false,
  "entryCondition": {
    "request": "timeout"
  },
  "childOverrides": [],
  "interactionAvailability": [],
  "fallback": "state.error",
  "confidence": "needs-review"
}
```

## 11. Screen Contract 示例 JSON

```json
{
  "id": "screen.pending-tasks",
  "name": "Pending Tasks",
  "description": "展示当前用户需要处理的协作任务。",
  "purpose": "让用户快速理解待处理事项、状态和首要操作。",
  "figma": {
    "nodeType": "FRAME",
    "name": "Pending Tasks",
    "stablePluginData": {
      "key": "screenId",
      "value": "screen.pending-tasks"
    },
    "platformPreset": "mobile-375"
  },
  "layout": {
    "mode": "vertical",
    "width": {
      "value": 375,
      "unit": "px"
    },
    "height": "hug",
    "scroll": "vertical",
    "padding": {
      "tokenRef": "semantic.spacing.page"
    },
    "gap": {
      "tokenRef": "semantic.spacing.section"
    },
    "managedChildOrder": [
      "title",
      "description",
      "task-card.1",
      "status",
      "primary-action"
    ]
  },
  "children": [
    {
      "id": "title",
      "kind": "text",
      "role": "page-title",
      "content": {
        "text": "My Tasks",
        "textStyleRef": "semantic.typography.page-title"
      },
      "layout": {
        "width": "fill"
      },
      "decisionRefs": [],
      "implementationHintRefs": []
    },
    {
      "id": "description",
      "kind": "text",
      "role": "page-description",
      "content": {
        "text": "Review and complete the tasks assigned to you.",
        "textStyleRef": "semantic.typography.body"
      },
      "layout": {
        "width": "fill"
      },
      "decisionRefs": [],
      "implementationHintRefs": []
    },
    {
      "id": "task-card.1",
      "kind": "component",
      "componentRef": "component.card",
      "role": "task-summary",
      "properties": {},
      "content": {
        "bindingRef": "data.pending-task.primary"
      },
      "layout": {
        "width": "fill"
      },
      "decisionRefs": [],
      "implementationHintRefs": ["hint.screen.pending-tasks.use-existing-data-shape"]
    },
    {
      "id": "status",
      "kind": "component",
      "componentRef": "component.badge",
      "role": "task-status",
      "properties": {
        "Status": "Pending"
      },
      "layout": {
        "width": "hug"
      },
      "decisionRefs": [],
      "implementationHintRefs": []
    },
    {
      "id": "primary-action",
      "kind": "component",
      "componentRef": "component.button",
      "role": "primary-action",
      "properties": {
        "Type": "Primary",
        "Size": "MD",
        "Label": "Open task"
      },
      "layout": {
        "width": "hug"
      },
      "decisionRefs": ["decision.actions.single-primary"],
      "implementationHintRefs": []
    }
  ],
  "states": [
    {
      "id": "state.default",
      "name": "Default",
      "required": true,
      "entryCondition": {
        "request": "success",
        "items": "non-empty"
      },
      "childOverrides": [],
      "interactionAvailability": [
        "interaction.pending-tasks.open-task"
      ]
    },
    {
      "id": "state.loading",
      "name": "Loading",
      "required": true,
      "entryCondition": {
        "request": "loading"
      },
      "childOverrides": [
        {
          "childId": "task-card.1",
          "visibility": false
        }
      ],
      "interactionAvailability": []
    },
    {
      "id": "state.empty",
      "name": "Empty",
      "required": true,
      "entryCondition": {
        "request": "success",
        "items": "empty"
      },
      "childOverrides": [
        {
          "childId": "task-card.1",
          "visibility": false
        },
        {
          "childId": "status",
          "visibility": false
        }
      ],
      "interactionAvailability": []
    },
    {
      "id": "state.error",
      "name": "Error",
      "required": true,
      "entryCondition": {
        "request": "error"
      },
      "childOverrides": [],
      "interactionAvailability": [
        "interaction.pending-tasks.retry"
      ]
    }
  ],
  "interactionRefs": [
    "interaction.pending-tasks.open-task",
    "interaction.pending-tasks.retry"
  ],
  "responsive": {
    "strategy": "fixed-mobile",
    "baseWidth": 375,
    "breakpoints": [],
    "overflowPolicy": "vertical-scroll"
  },
  "decisionRefs": [
    "decision.pending-tasks.primary-action-placement"
  ],
  "implementationHintRefs": [
    "hint.screen.pending-tasks.reuse-mobile-shell"
  ],
  "referenceAssetRefs": [
    "reference.pending-tasks.approved"
  ],
  "sourceRefs": [
    "source.figma.pending-tasks",
    "source.manual.design-review"
  ],
  "confidence": "exact"
}
```

Screen 示例只设置 Button 的属性，不重复 Button fill、radius、padding 或 typography。

## 12. Interactions Schema

Interaction 独立于 Screen 和 Component，支持被多个入口引用。

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id`、`name`、`description` | R | 稳定身份 |
| `trigger` | R | 来源对象、事件和可选 payload |
| `guard` | R | 执行条件；无 guard 时使用空数组 |
| `action` | R | 语义动作，例如 `open`、`submit`、`retry` |
| `target` | R | Screen、Pattern、状态或外部目标 |
| `transitions` | R | `loading`、`success`、`failure` 等结果 |
| `sideEffects` | O | analytics、toast 等已确认副作用 |
| `decisionRefs` | R | 可为空 |
| `implementationHintRefs` | R | 可为空 |
| `sourceRefs`、`confidence` | R | 来源和置信度 |

示例结构：

```json
{
  "id": "interaction.feedback.submit",
  "name": "Submit feedback",
  "description": "提交事实观察反馈并呈现结果。",
  "trigger": {
    "sourceRef": "pattern.feedback-form",
    "event": "submit"
  },
  "guard": [
    {
      "field": "form.valid",
      "operator": "equals",
      "value": true
    }
  ],
  "action": {
    "type": "submit",
    "target": "data.feedback"
  },
  "target": {
    "ref": "pattern.feedback-form"
  },
  "transitions": {
    "loading": "state.submitting",
    "success": "state.success",
    "failure": "state.error"
  },
  "decisionRefs": [
    "decision.feedback-form.submission-feedback"
  ],
  "implementationHintRefs": [
    "hint.feedback-form.use-existing-request-state"
  ],
  "sourceRefs": [
    "source.manual.product-review"
  ],
  "confidence": "exact"
}
```

## 13. Design Decision Schema 与示例

### 13.1 字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id`、`name`、`description` | R | 稳定身份 |
| `scope` | R | 受影响的 Component/Pattern/Screen/Interaction refs |
| `decision` | R | 已确认选择 |
| `rationale` | R | 为什么这样决定 |
| `mustNotChange` | R | Codex 不得自行改变的具体事项 |
| `alternativesRejected` | R | 可为空数组；记录被否决方案和原因 |
| `status` | R | `proposed`、`approved`、`superseded` |
| `supersededBy` | C | status 为 superseded 时 REQUIRED |
| `approvedBy` | C | approved 时 REQUIRED |
| `approvedAt` | C | approved 时 REQUIRED |
| `sourceRefs`、`confidence` | R | 来源和置信度 |

### 13.2 示例

```json
{
  "id": "decision.feedback-form.presentation",
  "name": "Feedback form presentation",
  "description": "移动端事实反馈使用 Bottom Sheet 呈现。",
  "scope": [
    "pattern.feedback-form",
    "screen.warning-task-detail"
  ],
  "decision": "从任务详情进入事实反馈时，以 Bottom Sheet 呈现，不跳转到独立页面。",
  "rationale": "保留任务上下文，降低移动端短表单的导航成本。",
  "mustNotChange": [
    "不得自行改成全屏独立路由。",
    "不得将提交动作移出 Bottom Sheet。"
  ],
  "alternativesRejected": [
    {
      "alternative": "独立页面",
      "reason": "增加返回路径和上下文切换。"
    },
    {
      "alternative": "内联展开",
      "reason": "会显著拉长任务详情页面。"
    }
  ],
  "status": "approved",
  "approvedBy": "product-design-review",
  "approvedAt": "2026-07-30T10:00:00+08:00",
  "sourceRefs": [
    "source.manual.product-review"
  ],
  "confidence": "exact"
}
```

## 14. Implementation Hint Schema 与示例

### 14.1 字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id`、`name`、`description` | R | 稳定身份 |
| `scope` | R | 作用对象 refs |
| `recommendation` | R | 建议做法 |
| `reason` | R | 工程理由 |
| `priority` | R | `high`、`medium`、`low` |
| `deviationPolicy` | R | 允许偏离的条件和说明要求 |
| `codeContext` | O | 相关框架、目录或现有抽象 |
| `sourceRefs`、`confidence` | R | 来源和置信度 |

### 14.2 示例

```json
{
  "id": "hint.feedback-form.reuse-bottom-sheet",
  "name": "Reuse existing BottomSheet",
  "description": "优先复用项目已有 BottomSheet 容器。",
  "scope": [
    "pattern.feedback-form"
  ],
  "recommendation": "先检查现有 BottomSheet 的 focus trap、关闭行为和移动端安全区支持，再复用其容器。",
  "reason": "减少重复交互实现并保持全局行为一致。",
  "priority": "high",
  "deviationPolicy": {
    "allowed": true,
    "when": [
      "现有组件不满足已确认的 accessibility contract。",
      "现有组件无法支持本 Decision 要求的呈现方式。"
    ],
    "mustReport": [
      "未复用的具体原因。",
      "新实现与现有组件的差异。",
      "后续是否需要抽象公共组件。"
    ]
  },
  "codeContext": {
    "framework": "React",
    "searchPaths": [
      "src/components",
      "src/features"
    ]
  },
  "sourceRefs": [
    "source.existing-code.components"
  ],
  "confidence": "high"
}
```

## 15. Code Mapping Schema 与示例

### 15.1 顶层结构

```json
{
  "schemaVersion": "2.0.0",
  "target": {
    "id": "code-target.react-web",
    "language": "TypeScript",
    "framework": "React"
  },
  "componentMappings": [],
  "tokenMappings": [],
  "screenMappings": []
}
```

### 15.2 Component Mapping 字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Mapping 稳定 ID |
| `designRef` | R | Component ID |
| `status` | R | `matched`、`partial`、`missing`、`blocked` |
| `reusePolicy` | R | 与 Component implementation contract 一致 |
| `codeComponent` | C | matched/partial 时 REQUIRED |
| `sourcePath` | C | matched/partial 时 REQUIRED |
| `import` | C | import source/name/type |
| `propMapping` | R | Figma/Schema Property 到 code prop/value |
| `eventMapping` | R | Interaction hook 到 code callback |
| `behaviorMapping` | O | loading、disabled、focus 等 |
| `missingPolicy` | C | status=missing 时 REQUIRED |
| `sourceRefs`、`confidence` | R | 来源和置信度 |

### 15.3 示例

```json
{
  "id": "mapping.component.button.react",
  "designRef": "component.button",
  "status": "matched",
  "reusePolicy": "must-reuse",
  "codeComponent": "Button",
  "sourcePath": "src/components/ui/Button.tsx",
  "import": {
    "kind": "named",
    "name": "Button",
    "from": "@/components/ui/Button"
  },
  "propMapping": [
    {
      "designProperty": "Type",
      "codeProp": "variant",
      "values": {
        "Primary": "primary",
        "Secondary": "secondary"
      }
    },
    {
      "designProperty": "Size",
      "codeProp": "size",
      "values": {
        "SM": "sm",
        "MD": "md"
      }
    },
    {
      "designProperty": "Disabled",
      "codeProp": "disabled",
      "values": {
        "true": true,
        "false": false
      }
    },
    {
      "designProperty": "Label",
      "codeProp": "children",
      "transform": "text-content"
    }
  ],
  "eventMapping": [
    {
      "interactionHook": "interaction.button.activate",
      "codeProp": "onClick"
    }
  ],
  "behaviorMapping": {
    "nativeElement": "button",
    "disabledSemantics": "native"
  },
  "sourceRefs": [
    "source.existing-code.button"
  ],
  "confidence": "exact"
}
```

无匹配组件示例：

```json
{
  "id": "mapping.component.risk-summary.react",
  "designRef": "component.risk-summary",
  "status": "missing",
  "reusePolicy": "prefer-reuse",
  "propMapping": [],
  "eventMapping": [],
  "missingPolicy": {
    "action": "abstract-first",
    "allowedToCreate": true,
    "requiredSearchPaths": [
      "src/components",
      "src/features"
    ],
    "approvalRequired": false,
    "reportRequirement": "说明未找到匹配组件，并将可复用结构抽象到公共组件后再用于页面。"
  },
  "sourceRefs": [
    "source.existing-code.inventory"
  ],
  "confidence": "high"
}
```

## 16. Audit Rules Schema 与示例

### 16.1 字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id`、`name`、`description` | R | 稳定规则身份 |
| `severity` | R | `info`、`warning`、`error`、`critical` |
| `scope` | R | 文件类型、对象类型和可选 selector |
| `condition` | R | 可机器执行的检查描述 |
| `message` | R | 失败消息模板 |
| `blocking` | R | 是否阻止 Compiler/Handoff |
| `appliesTo` | R | `figma-compiler`、`codex-handoff`、`both` |
| `remediation` | R | 修复建议 |
| `sourceRefs`、`confidence` | R | 规则来源 |

### 16.2 建议的最小规则集

- missing description
- missing stable id
- duplicate component identity
- hardcoded color
- hardcoded radius
- incomplete variants
- missing states
- missing mapping
- missing decisions
- missing screen state
- unmapped tokens
- unsafe implementation freedom

### 16.3 示例

```json
{
  "id": "rule.component.hardcoded-color",
  "name": "Component hardcoded color",
  "description": "Component 的受控视觉属性必须绑定 Semantic Color Token。",
  "severity": "error",
  "scope": {
    "file": "components.json",
    "objectType": "component",
    "selector": "/tokenBindings"
  },
  "condition": {
    "operator": "forbid-literal",
    "categories": ["color"],
    "allowedExceptionsPath": "/extensions/auditExceptions"
  },
  "message": "Component {object.id} contains a hardcoded color at {path}.",
  "blocking": true,
  "appliesTo": "both",
  "remediation": "创建或复用 Semantic Color Token，并用 tokenRef 替换字面量。",
  "sourceRefs": [
    "source.manual.schema-governance"
  ],
  "confidence": "exact"
}
```

另一个面向 Codex 自由度的规则：

```json
{
  "id": "rule.component.unsafe-implementation-freedom",
  "name": "Unsafe implementation freedom",
  "description": "可开发 Component 必须声明 reusePolicy 和 missingMappingPolicy。",
  "severity": "critical",
  "scope": {
    "file": "components.json",
    "objectType": "component",
    "selector": "/implementationContract"
  },
  "condition": {
    "operator": "require-fields",
    "fields": [
      "reusePolicy",
      "requiredBehavior",
      "forbiddenImplementation",
      "missingMappingPolicy"
    ]
  },
  "message": "Component {object.id} does not sufficiently constrain implementation freedom.",
  "blocking": true,
  "appliesTo": "codex-handoff",
  "remediation": "补充复用策略、必要行为、禁止事项和映射缺失策略。",
  "sourceRefs": [
    "source.manual.schema-governance"
  ],
  "confidence": "exact"
}
```

## 17. References Schema

`references/index.json` 登记资产，实际文件保存在子目录。

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定 Reference ID |
| `kind` | R | `image`、`figma-node`、`html-snapshot`、`website`、`note` |
| `path` 或 `uri` | R | 至少一个 |
| `label` | R | 人工可读名称 |
| `purpose` | R | 该参考用于判断什么 |
| `sourceRef` | R | 对应 Manifest Source |
| `checksum` | C | 本地文件 REQUIRED |
| `dimensions` | O | 图片或 viewport 尺寸 |
| `crop` | O | 截图裁剪范围 |
| `confidence` | R | 参考本身可靠性 |
| `approved` | R | 是否经过人工验收 |

参考资产不等同设计事实。Screen/Component 应通过 `referenceAssetRefs` 引用它，再通过 `provenance` 说明哪些事实来自该资产。

## 18. REQUIRED / OPTIONAL 汇总

### 18.1 所有核心对象 REQUIRED

- `id`
- `name`
- `description`
- `sourceRefs`
- `confidence`

### 18.2 各文件关键 REQUIRED

| 对象 | REQUIRED |
| --- | --- |
| Manifest | package/schema version、platform、createdAt/updatedAt、designSystem、sources、screens、compatibility、entrypoints、status |
| Token | figmaName、codeName、category、type、value/alias 之一 |
| Component | purpose、documentation、figma、anatomy、properties、states、layout、tokenBindings、contentRules、accessibility、Decision/Hint refs、implementationContract |
| Pattern | purpose、composition、layout、behavior、states、contentRules、Interaction/Decision/Hint refs |
| Screen | purpose、figma、layout、children、states、responsive、Interaction/Decision/Hint/Reference refs |
| Interaction | trigger、guard、action、target、transitions、Decision/Hint refs |
| Decision | scope、decision、rationale、mustNotChange、alternativesRejected、status |
| Hint | scope、recommendation、reason、priority、deviationPolicy |
| Mapping | designRef、status、reusePolicy、propMapping、eventMapping；matched 时必须有代码路径/import |
| Audit Rule | severity、scope、condition、message、blocking、appliesTo、remediation |

### 18.3 常见 OPTIONAL

- `provenance`：当对象级来源不足以解释关键字段时强烈建议提供。
- `tags`、`extensions`。
- Token `modes`、`deprecated`。
- Component `contentRegions`、`interactionHookRefs`。
- Interaction `sideEffects`。
- Code Mapping `behaviorMapping`。
- Source `revision`、`checksum`、`notes`。

OPTIONAL 不表示可以随意猜测；只有存在证据或明确需要时才填写。

## 19. Figma / Codex 消费边界

### 19.1 字段消费矩阵

| 字段组 | Figma Compiler | Codex | 人工验收 |
| --- | --- | --- | --- |
| stable `id` / refs | 共享 | 共享 | 共享 |
| name / description / purpose | 共享 | 共享 | 共享 |
| sourceRefs / confidence / provenance | 共享 | 共享 | 共享 |
| Primitive/Semantic Token value/alias | 共享 | 共享 | 共享 |
| `figmaName`、Figma nodeType、variant order、Plugin Data | **Figma-only** | 可忽略 | 可查看 |
| `codeName`、importPath、code component、prop/event mapping | 可忽略 | **Codex-only** | 可查看 |
| Component anatomy / properties / states / layout | 共享 | 共享 | 共享 |
| Component tokenBindings | 共享 | 共享 | 共享 |
| implementationContract | 不影响生成节点 | **Codex-only** | 共享审核 |
| reusePolicy / forbiddenImplementation | 可忽略 | **Codex-only** | 共享审核 |
| Screen children / states / responsive | 共享 | 共享 | 共享 |
| Decision | 可用于文档和审计 | 共享且强约束 | 共享 |
| Implementation Hint | 可忽略 | **Codex-only** | 共享 |
| Audit Rule `appliesTo` | 按范围 | 按范围 | 共享 |

### 19.2 只服务 Figma 的字段

- `figma.nodeType`
- `figma.name`
- `figma.stablePluginData`
- `figma.variantPropertyOrder`
- `figmaLibraryKey`
- Figma Variable scope/mode 映射

### 19.3 只服务 Codex 的字段

- `implementationContract`
- `preferredCodeComponent`
- `reusePolicy`
- `missingMappingPolicy`
- `forbiddenImplementation`
- `code-mapping.json` 的 source path、import、prop/event mapping
- Implementation Hint 及偏离报告要求

### 19.4 两边共享的字段

- 稳定 ID 和引用关系
- Token value/alias/type
- Component anatomy、properties、states、layout、Token Binding
- Pattern composition
- Screen layout、children、states、responsive
- Interaction 状态转换
- Design Decision
- Source、Confidence、Provenance

## 20. Codex Handoff 结构

未来 Export for Codex 至少输出：

```text
codex-handoff/
├─ AGENTS.md
├─ README.md
├─ tokens.json
├─ components.json
├─ patterns.json
├─ screens.json
├─ interactions.json
├─ decisions.json
├─ implementation-hints.json
├─ code-mapping.json
├─ audit.json
└─ references/
```

### 20.1 每个文件给 Codex 的作用

| 文件 | Codex 用途 |
| --- | --- |
| `AGENTS.md` | 高层不可违反规则、工作边界、验证要求和决策优先级 |
| `README.md` | 包范围、入口、目标平台、使用顺序、已知限制 |
| `tokens.json` | 代码 Token、alias 和 Semantic 用途 |
| `components.json` | 可复用组件合同、状态、布局、内容和强制实现约束 |
| `patterns.json` | 多组件组合方式，避免页面自行发明布局 |
| `screens.json` | 页面结构、状态、内容和响应式行为 |
| `interactions.json` | trigger/guard/action/result 状态流 |
| `decisions.json` | 不允许 Codex 自行优化的已确认选择 |
| `implementation-hints.json` | 可调整的工程建议和偏离说明 |
| `code-mapping.json` | 现有组件、路径、import、props 和 events 的直接映射 |
| `audit.json` | Export 前审计结果、blocking 问题和已批准例外 |
| `references/` | 经登记的视觉或结构参考，不替代合同 |

### 20.2 AGENTS.md 边界

AGENTS.md 只保存：

- 任务范围；
- Fact / Decision / Hint 的优先级和偏离规则；
- 隐私、安全、无障碍等高层约束；
- 必须执行的验证；
- 禁止修改的区域；
- Handoff 文件读取顺序。

AGENTS.md 不复制：

- 全量 Token；
- Component Anatomy；
- 每个 Screen child；
- 全量 Interaction；
- Code Mapping 明细。

这些知识保留在结构化 JSON 中，避免 AGENTS.md 过长和重复。

## 21. 当前 Pilot V1 → V2 迁移建议

本节只是迁移设计，不在本轮执行。

### 21.1 可直接保留的稳定身份

| V1 | V2 建议 |
| --- | --- |
| `color.brand.primary` | 保留为 legacy alias 或迁移映射；新增 `primitive.*` 与 `semantic.action.primary` |
| `color.text.primary` | 映射为 `semantic.text.primary` |
| `color.bg.surface` | 映射为 `semantic.surface.default` |
| `spacing.md` | 根据实际用途拆分 Primitive 与 Semantic alias |
| `radius.md` | 映射为 Primitive，再由 `semantic.radius.control/card` alias |
| `component.button` | 稳定 ID 原样保留 |
| `component.badge` | 稳定 ID 原样保留 |
| `component.card` | 稳定 ID 原样保留 |
| `screen.pending-tasks-pilot` | 若正式化，明确是否保留或映射到非 pilot ID |
| Screen child IDs | 原样保留，除非人工确认正式命名 |

### 21.2 Token 迁移

1. 保留 V1 `id`、Figma name、value 和 source。
2. 从现有值创建 Primitive Token。
3. 根据用途创建 Semantic Token，并 alias Primitive。
4. 将 Component binding 从 V1 通用 Token 迁移到 Semantic Token。
5. 建立 legacy ID → V2 ID 映射，避免静默改名。
6. 所有用途不清晰的 Token 标记 `needs-review`，不自动拆分。

### 21.3 Component 迁移

1. 保留 Component stable ID、展示名称、Variant 值。
2. 将 V1 `variantProperties` 转成统一 `properties[kind=variant]`。
3. 从当前 Figma/代码提取 anatomy、layout 和 tokenBindings。
4. 补齐 documentation、states、content rules 和 accessibility。
5. 人工确认 reusePolicy、requiredBehavior 和 forbiddenImplementation。
6. 建立 code mapping；没有匹配组件时明确 missingPolicy。
7. 不把 Figma 生成节点树直接当作 Component Contract。

### 21.4 Screen 迁移

1. 保留 Screen 和 direct child stable ID。
2. 将 `type=INSTANCE` 转为 `kind=component + componentRef`。
3. 将 Variant 请求转为 `properties`。
4. 将 TEXT 转为 `kind=text + content + textStyleRef`。
5. 补齐 Screen purpose、states、responsive、Interaction refs。
6. 不复制 Component fill/radius/token。
7. Pilot 实验中产生的 `My Tasks`、Card 增删和 Variant 变化应作为当前事实候选，由人工决定是否进入正式 V2，而不是自动视为产品 Decision。

### 21.5 Source / Confidence 补齐

- V1 `source` 字符串迁移为 Manifest `sourceReferences`。
- 从 CSS Variable 直接读取的值可标记 `exact`。
- 从截图推断的 layout/effect 默认 `medium`。
- 当前无来源字段的 Component 结构先标记 `needs-review`。
- 人工验收过的 Pilot Runtime 行为可作为 `manual` 来源，但不等同正式产品设计决策。

### 21.6 建议迁移顺序

1. Manifest 与 Source Registry。
2. Foundations Primitive/Semantic Token。
3. Component Contract 与 Code Mapping。
4. Pattern。
5. Screen 与 Page States。
6. Interaction。
7. Decision 与 Hint 人工评审。
8. Audit Rules。
9. Compiler/Exporter 兼容评估。
10. 最后才进行 V2 migration 实现。

## 22. 版本和变更规则

- `schemaVersion`：Schema 结构版本。
- `packageVersion`：某个 Design Package 内容版本。
- `designSystem.version`：设计系统内容版本。
- 新增 OPTIONAL 字段通常是 minor 变更。
- 改变 REQUIRED 字段、枚举语义或引用规则是 major 变更。
- 值或文案调整是 package patch/minor，由影响范围决定。
- stable ID 不因展示名称、代码文件路径或 Figma 图层名调整而变化。
- 废弃对象使用 `deprecated` / `supersededBy`，不得静默复用旧 ID 表达新语义。

## 23. 人工评审重点

在进入 V2 migration 前，应确认：

1. Fact / Decision / Hint 的文件边界是否足够清晰。
2. Semantic Token 命名是否符合正式产品，而非 Pilot。
3. Component Contract 的 REQUIRED 字段是否过多或仍不足。
4. State 应放在 Component、Pattern、Screen 还是 Interaction 的边界。
5. `must-reuse` 与 `missingMappingPolicy=block` 的适用范围。
6. 未匹配代码组件时是 `abstract-first` 还是 `review-required`。
7. Screen managed child 是否只需要 direct child，或正式 V2 需要 region 层。
8. Source/Confidence 的人工 override 流程和责任人。
9. 哪些 Audit Rule 应 blocking。
10. Pilot stable IDs 中哪些可以直接成为正式稳定 ID。

本草案通过人工评审后，下一步应先冻结 Schema V2 的最小 REQUIRED 集，再单独规划 JSON Schema、迁移和工具实现。
