# Design Package Schema V2.1 Core Candidate

> 状态：V2.1 Core Candidate
> 适用阶段：Design Package 数据合同设计
> 不包含：Plugin 修改、V2.1 migration、Import、Audit 执行器、Export 实现

## 1. V2.1 设计原则

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

遇到未知内容时，应降低 readiness、将相应对象标记为
`reviewStatus=needs-review`，或省略 OPTIONAL 字段，而不是让 Compiler 或
Codex 静默猜测。

### 1.6 可追溯、可覆盖、可审计

- 每个核心对象必须具有 `sourceRefs`、`confidence` 与 `reviewStatus`。
- 关键字段可通过 `provenance` 提供字段级来源和置信度。
- 人工 override 不覆盖历史证据；它以显式记录说明覆盖值、原因和审核人。
- AI、parser 和 importer 只能初始化 `unreviewed` 或 `needs-review`；可信的
  `approved` / `rejected` 只能来自 Human Review Action。
- Audit Governance 与 Audit Result 分离：Package 只引用外部 versioned Audit
  Profile 并记录已批准例外；`audit.json` 是未来导出的执行结果。

### 1.7 V2.1 不是完整设计工具

V2.1 定义数据合同，不承诺：

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
├─ data-contracts.json
├─ components.json
├─ patterns.json
├─ screens.json
├─ interactions.json
├─ decisions.json
├─ implementation-hints.json
├─ code-mapping.json
├─ audit-governance.json
└─ references/
   ├─ index.json
   ├─ images/
   ├─ html/
   └─ notes/
```

调整理由：

1. `references/index.json` 为二进制图片、HTML 快照和说明文件提供稳定 ID、校验值和来源信息。
2. 不建议把 JSON Schema 定义文件放进每个 Design Package。未来若实现机器校验，应在仓库级维护版本化的 `schemas/design-package/v2.1/`，避免数据包同时携带并修改自己的验证规则。
3. `audit-governance.json` 只保存 requested external Audit Profile 和候选
   approved exceptions；可信性由外部 policy 判定，Package 不能复制、改写或
   弱化 blocking rules。
4. 不在源包中加入 `audit.json`。它是按 Audit Profile 执行后产生的结果，
   应出现在 Export for Codex 中。

## 3. 每个文件职责

| 文件 | 主要职责 | 禁止承载 |
| --- | --- | --- |
| `manifest.json` | 包身份、版本、平台、来源索引、设计系统身份、Screen 清单、兼容性、requested readiness | 具体 Component/Token、动态 gate 状态或 Audit Result |
| `foundations.json` | Primitive/Semantic Token，覆盖 Color、Typography、Spacing、Radius、Effects、Border、Sizing | Component 私有结构和 Screen 布局 |
| `data-contracts.json` | UI 消费的数据形状、字段、格式化和 mock；不定义后端 API | endpoint、transport、鉴权或数据库模型 |
| `components.json` | Component 的结构、属性、状态、布局、Token 绑定、内容和实现契约 | Screen 特有文案和页面排列 |
| `patterns.json` | 多个 Component 组合形成的可复用布局与行为模式 | 可独立发布的原子 Component 定义 |
| `screens.json` | Screen 结构、状态、Component/Pattern 引用、响应式规则、决策与提示引用 | 重复定义 Component 视觉 Token |
| `interactions.json` | trigger、guard、action、target、loading/success/failure 状态转换 | 具体代码事件处理实现 |
| `decisions.json` | 已人工确认且不允许 Codex 自行推翻的稳定决策 | 可随代码条件调整的建议 |
| `implementation-hints.json` | 可调整的工程建议和偏离说明要求 | 设计事实和不可变产品决策 |
| `code-mapping.json` | Schema 到各 code target 的 Component、Slot、Token、Data 映射 | 平台中立设计事实或后端 endpoint |
| `audit-governance.json` | requested external Audit Profile 和候选 approved exceptions | Package 自定义/弱化规则或自行建立信任 |
| `references/index.json` | 参考资产的稳定身份、路径、媒体类型、来源和校验值 | 未登记的散落文件 |

## 4. 公共类型和字段约定

### 4.1 REQUIRED / OPTIONAL 标记

后续字段表使用：

- **R**：Schema-valid 所需的最小 REQUIRED。
- **F**：达到 figma-ready 时 REQUIRED。
- **X**：达到 codex-ready 时 REQUIRED。
- **FX**：达到 figma-ready 或 codex-ready 时 REQUIRED。
- **O**：OPTIONAL。仅在有事实或明确需求时提供。
- **C**：CONDITIONAL。满足指定条件时 REQUIRED。

空字符串不等于缺失。未知值应省略 OPTIONAL 字段，并把对象
`reviewStatus` 标记为 `needs-review`；不得用虚构值满足 readiness。

### 4.2 公共对象元数据

所有核心实体（Token、Data Contract、Component、Pattern、Screen、Interaction、Decision、Hint、Mapping、Audit Exception）共享：

| 字段 | 要求 | 类型 | 说明 |
| --- | --- | --- | --- |
| `id` | R | string | 稳定 ID，在所属对象类型内唯一 |
| `name` | FX | string | 人类可读展示名称 |
| `description` | FX | string | 简洁说明对象是什么 |
| `sourceRefs` | R | string[] | 引用 Manifest 中的来源 ID；人工创建也必须引用 `manual` 来源 |
| `confidence` | R | enum | 证据强度：`exact`、`high`、`medium`、`low` |
| `reviewStatus` | R | enum | 人工审核：`unreviewed`、`needs-review`、`approved`、`rejected` |
| `reviewedBy` | C | string | `reviewStatus=approved/rejected` 时 REQUIRED；可信审核主体 |
| `reviewedAt` | C | ISO 8601 | `reviewStatus=approved/rejected` 时 REQUIRED |
| `reviewMethod` | C | enum | `reviewStatus=approved/rejected` 时 REQUIRED；`human-review` 或 `governance-action` |
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
| `defaultLocator` | O | Locator | 来源中常用的默认定位；字段级定位仍由 Provenance 提供 |
| `defaultExtractionMethod` | O | enum | `parsed`、`measured`、`visual-inference`、`code-analysis`、`manual` |
| `notes` | O | string | 来源限制、裁剪范围、认证条件等 |

### 4.4 Confidence

| 值 | 使用条件 | 默认处理 |
| --- | --- | --- |
| `exact` | 直接读取 CSS Variable、Figma Variable、代码常量或人工明确输入 | 可进入确定性生成 |
| `high` | 多个可靠来源一致，只有微小解释空间 | 可生成，但人工验收应可追溯 |
| `medium` | 截图测量、视觉推断或单一非结构化来源 | 生成前建议人工确认 |
| `low` | 弱证据或多种解释均合理 | 不应成为 blocking 设计事实 |

`confidence=exact` 只表示证据可被直接、精确读取，不表示已经经过人工批准。
例如解析到一个 CSS Variable 可以是 `exact + unreviewed`；只有完成审核后才是
`exact + approved`。

### 4.5 Review Status

| 值 | 含义 | Readiness 默认影响 |
| --- | --- | --- |
| `unreviewed` | 尚未进入人工审核 | 允许 draft，不自动进入 figma-ready/codex-ready |
| `needs-review` | 存在冲突、未知或需要人工选择 | 对所需 readiness gate blocking |
| `approved` | 已由授权角色确认 | 可满足对应人工审核 gate |
| `rejected` | 已明确否决，不能消费 | 对所有生成和 Handoff blocking |

#### Review trust boundary

- AI、parser、crawler、importer 或普通转换器不得产生可信的
  `reviewStatus=approved/rejected`。
- 自动生成对象的初始状态只能是 `unreviewed` 或 `needs-review`。
- `approved/rejected` 必须由外部可信 Human Review Action 写入，并同时记录
  `reviewedBy`、`reviewedAt`、`reviewMethod`。
- `reviewMethod=governance-action` 只用于经授权的治理动作；不能由 Package 内容
  自我声明为可信。
- Importer 即使读到 `approved/rejected`，也必须验证对应 Review Action 的可信
  来源；无法验证时按 `needs-review` 处理，并由 Audit 报告降级原因。

对象顶层 `reviewStatus=approved` 不会覆盖字段级 Provenance。只要 readiness
相关字段的 Provenance 仍为 `unreviewed`、`needs-review` 或 `rejected`，对应
readiness gate 必须 blocking。消费者不得只检查对象顶层状态。

### 4.6 Locator、Extraction Method 与 Provenance

Locator 是结构化对象：

| `kind` | `value` 示例 |
| --- | --- |
| `figma-node` | `{ "fileKey": "...", "nodeId": "12:34" }` |
| `css-selector` | `{ "selector": ".primary-button" }` |
| `dom-path` | `{ "path": "main > section:nth-child(2)" }` |
| `image-region` | `{ "assetRef": "reference.button", "x": 20, "y": 10, "width": 120, "height": 44 }` |
| `code-symbol` | `{ "path": "src/Button.tsx", "symbol": "Button" }` |
| `manual-note` | `{ "noteRef": "reference.review-notes", "anchor": "button-radius" }` |

`extractionMethod` 只允许：

- `parsed`
- `measured`
- `visual-inference`
- `code-analysis`
- `manual`

字段级 Provenance 示例：

```json
{
  "path": "/layout/padding/inline",
  "sourceRef": "source.figma.button",
  "locator": {
    "kind": "figma-node",
    "value": {
      "fileKey": "pilot-file-key",
      "nodeId": "12:34"
    }
  },
  "extractionMethod": "parsed",
  "confidence": "exact",
  "reviewStatus": "approved",
  "reviewedBy": "designer@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review",
  "observedValue": {
    "tokenRef": "semantic.spacing.control-inline"
  },
  "override": {
    "value": {
      "tokenRef": "semantic.spacing.control-inline-compact"
    },
    "reason": "人工验收确认移动端使用紧凑间距",
    "reviewedBy": "designer@example.com",
    "reviewedAt": "2026-07-30T10:00:00+08:00",
    "reviewMethod": "human-review"
  }
}
```

规则：

- `path` 使用 JSON Pointer，指向当前对象内字段。
- `locator` 指向来源中的精确位置，不能仅重复 Source URI。
- `extractionMethod` 说明事实是解析、测量、视觉推断、代码分析还是人工输入。
- `observedValue` 保留原始证据。
- 存在 `override` 时，消费者使用 `override.value`。
- 人工 override 不自动提高 `confidence`；审核结果由 `reviewStatus` 表达。
- Provenance 的 review metadata 与对象顶层遵循同一 trust boundary。

## 5. Manifest Schema

### 5.1 顶层字段

| 字段 | 要求 | 类型 | 说明 |
| --- | --- | --- | --- |
| `packageId` | R | string | Design Package 稳定 ID |
| `packageVersion` | R | semver | 数据包内容版本 |
| `schemaVersion` | R | semver | Design Package Schema 版本，V2.1 使用 `2.1.0` |
| `name` | R | string | 数据包名称 |
| `description` | R | string | 范围和目的 |
| `platform` | R | enum[] | `web`、`mobile-web`、`ios`、`android`、`mini-program`、`desktop` |
| `createdAt` | R | ISO 8601 | 首次创建时间 |
| `updatedAt` | R | ISO 8601 | 当前包更新时间 |
| `designSystem` | R | object | 设计系统稳定身份和版本 |
| `sourceReferences` | R | SourceReference[] | 全包来源登记表 |
| `screens` | R | object[] | 仅列出 Screen ID、name 和所在文件，不放 Screen 内容 |
| `dataContracts` | R | object[] | 仅列出 Data Contract ID、kind 和所在文件 |
| `codeTargets` | R | object[] | 一个或多个目标代码环境的稳定身份 |
| `auditGovernance` | R | object | 指向 `audit-governance.json`；Profile 引用只在该文件拥有 |
| `requestedReadiness` | R | object[] | Source 只声明目标 readiness；不保存执行时 gate 结果 |
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
| `codeTargetRefs` | R | 引用 Manifest `codeTargets`，不内嵌单一目标 |
| `features` | R | 显式列出使用的 Schema feature，例如 `semantic-token-alias`、`screen-states` |

Manifest 不包含 Token、Component、Pattern 或 Screen 的具体业务内容。

## 6. Foundations Schema

### 6.1 顶层结构

```json
{
  "schemaVersion": "2.1.0",
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
| `figmaName` | C | string | `figmaRepresentation.kind != none` 时按表示策略提供 |
| `name` | FX | string | 人工可读名称 |
| `description` | FX | string | 语义和使用范围 |
| `category` | R | enum | `color`、`typography`、`spacing`、`radius`、`effect`、`border`、`sizing` |
| `type` | R | enum | `COLOR`、`FLOAT`、`STRING`、`BOOLEAN`、`TYPOGRAPHY`、`SHADOW`、`BORDER` |
| `figmaRepresentation` | F | object | 显式声明 `variable`、`text-style`、`effect-style`、`composite` 或 `none` |
| `value` | C | type-specific | Primitive 必须提供；Semantic 可提供直接值 |
| `alias` | C | string | Semantic 推荐提供；与 `value` 至少有一个且通常互斥 |
| `scope` | O | string[] | Figma Variable scopes 或语义用途 |
| `modes` | O | object | Light/Dark、Density 等 mode 值或 alias |
| `sourceRefs` | R | string[] | 来源 |
| `confidence` | R | enum | 置信度 |
| `reviewStatus` | R | enum | 人工审核状态 |
| `provenance` | O | array | 字段级来源 |
| `deprecated` | O | object | 弃用原因和替代 Token |

`figmaRepresentation` 是 Compiler 的唯一表示策略来源。Compiler 不得根据
`type=TYPOGRAPHY` 自动猜测应该创建 Variables、Text Style 或 composite。

| kind | 必要配置 | 典型用途 |
| --- | --- | --- |
| `variable` | `collectionRef`、`variableType`、可选 `scopes` | Color、Spacing、Radius、Sizing |
| `text-style` | `styleName` | 可发布 Typography Style |
| `effect-style` | `styleName` | Shadow/Blur Style |
| `composite` | `parts` | 由多个 Variable/Style 共同表达的 Typography、Border 等 |
| `none` | 无 | 只服务代码或文档，不创建 Figma 对象 |

Foundation 不再拥有通用单值 `codeName`。每个 code target 的 CSS Variable、TS
key、Swift/Kotlin 名称由 `code-mapping.json.tokenMappings` 分别维护。

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
      "name": "Blue 500",
      "description": "Primary blue primitive.",
      "category": "color",
      "type": "COLOR",
      "figmaRepresentation": {
        "kind": "variable",
        "collectionRef": "collection.foundation.primitives",
        "variableType": "COLOR",
        "scopes": ["ALL_FILLS"]
      },
      "value": "#3D73FF",
      "sourceRefs": ["source.existing-code.tokens"],
      "confidence": "exact",
      "reviewStatus": "approved",
      "reviewedBy": "design-reviewer@example.com",
      "reviewedAt": "2026-07-30T10:00:00+08:00",
      "reviewMethod": "human-review"
    }
  ],
  "semantics": [
    {
      "id": "semantic.action.primary",
      "figmaName": "semantic/action/primary",
      "name": "Primary action",
      "description": "Background color for primary interactive actions.",
      "category": "color",
      "type": "COLOR",
      "figmaRepresentation": {
        "kind": "variable",
        "collectionRef": "collection.foundation.semantic",
        "variableType": "COLOR",
        "scopes": ["ALL_FILLS"]
      },
      "alias": "primitive.color.blue.500",
      "scope": ["FILL_COLOR"],
      "sourceRefs": ["source.manual.design-review"],
      "confidence": "exact",
      "reviewStatus": "approved",
      "reviewedBy": "design-reviewer@example.com",
      "reviewedAt": "2026-07-30T10:00:00+08:00",
      "reviewMethod": "human-review"
    }
  ]
}
```

Component 应绑定 `semantic.action.primary`，而不是直接绑定 `primitive.color.blue.500`。

## 7. Data Contract Schema

`data-contracts.json` 定义 UI 消费的数据形状，不描述 endpoint、HTTP method、
数据库表、鉴权或后端 transport。

### 7.1 顶层结构

```json
{
  "schemaVersion": "2.1.0",
  "contracts": []
}
```

### 7.2 Data Contract 字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定 ID，例如 `data.pending-task` |
| `name`、`description` | FX | 人工可读说明 |
| `kind` | R | `object`、`collection`、`scalar` |
| `fields` | C | `kind=object` 时 REQUIRED |
| `itemRef` | C | `kind=collection` 时 REQUIRED，引用另一个 Data Contract |
| `scalar` | C | `kind=scalar` 时 REQUIRED |
| `formatting` | O | UI 格式化语义，不包含具体框架代码 |
| `example` | O | 单个代表性值 |
| `mock` | O | 可供原型/测试消费的 mock 值 |
| `sourceRefs` | R | 来源 |
| `confidence` | R | 证据强度 |
| `reviewStatus` | R | 人工审核状态 |
| `provenance` | O | 字段级来源 |

### 7.3 Field Contract

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Data Contract 内稳定字段 ID，不依赖展示 label |
| `name` | FX | 数据键名 |
| `description` | FX | UI 语义 |
| `type` | R | `string`、`number`、`boolean`、`date`、`datetime`、`object-ref`、`collection-ref` |
| `required` | R | 键是否必须存在 |
| `nullable` | R | 值是否允许为 null；与 required 分离 |
| `enum` | O | 合法值列表 |
| `itemRef` | C | object-ref/collection-ref 时 REQUIRED |
| `formatting` | O | date、number、label、fallback 等显示规则 |
| `example` | O | 字段示例 |
| `mock` | O | 字段 mock |
| `sourceRefs` | R | 字段来源 |
| `confidence` | R | 字段证据强度 |
| `reviewStatus` | R | 字段审核状态 |

引用语法统一为：

```text
<data-contract-id>#<JSON-Pointer>
```

例如：

```text
data.pending-task#/title
data.pending-task-collection#/items
data.feedback-submission#/status
```

Screen 的 `bindingRef`、Pattern content binding 和 Interaction 的 `dataRef`
必须能解析到 `data-contracts.json` 中存在的 Contract 和合法 JSON Pointer。
禁止使用没有合同定义的裸字符串 `data.*`。

### 7.4 示例

```json
{
  "id": "data.pending-task",
  "name": "Pending task",
  "description": "待处理任务卡片需要消费的 UI 数据。",
  "kind": "object",
  "fields": [
    {
      "id": "field.pending-task.title",
      "name": "title",
      "description": "任务标题。",
      "type": "string",
      "required": true,
      "nullable": false,
      "formatting": {
        "maxLines": 2,
        "overflow": "ellipsis"
      },
      "example": "Complete observation feedback",
      "sourceRefs": ["source.existing-code.pending-task"],
      "confidence": "exact",
      "reviewStatus": "approved",
      "reviewedBy": "design-reviewer@example.com",
      "reviewedAt": "2026-07-30T10:00:00+08:00",
      "reviewMethod": "human-review"
    },
    {
      "id": "field.pending-task.status",
      "name": "status",
      "description": "任务当前状态。",
      "type": "string",
      "required": true,
      "nullable": false,
      "enum": ["pending", "done"],
      "formatting": {
        "labelMap": {
          "pending": "Pending",
          "done": "Done"
        }
      },
      "example": "pending",
      "sourceRefs": ["source.existing-code.pending-task"],
      "confidence": "exact",
      "reviewStatus": "approved",
      "reviewedBy": "design-reviewer@example.com",
      "reviewedAt": "2026-07-30T10:00:00+08:00",
      "reviewMethod": "human-review"
    }
  ],
  "example": {
    "title": "Complete observation feedback",
    "status": "pending"
  },
  "mock": {
    "title": "Review assigned task",
    "status": "done"
  },
  "sourceRefs": [
    "source.existing-code.pending-task",
    "source.manual.design-review"
  ],
  "confidence": "exact",
  "reviewStatus": "approved",
  "reviewedBy": "design-reviewer@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review"
}
```

Collection Contract 通过 `itemRef: "data.pending-task"` 复用对象合同；Scalar
Contract 使用 `scalar` 定义 type、nullable、enum 和 formatting。

## 8. Component Contract

### 8.1 顶层字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定 Component ID |
| `name` | FX | 展示名称 |
| `description` | FX | 一句话说明 |
| `purpose` | FX | 解决什么设计问题 |
| `documentation` | FX | `usage`、`dont`、可选 `notes`；用于生成 `descriptionMarkdown` |
| `figma` | F | Figma 源表示策略；不保存可由 ID/文档派生的输出字段 |
| `anatomy` | FX | 结构角色和嵌套关系 |
| `properties` | FX | Variant、Boolean、Text、Instance Swap 属性 |
| `slots` | FX | 正式 slot/content-region 合同；无 slot 时为空数组 |
| `states` | FX | 状态及其可见、交互和 Token 差异 |
| `layout` | FX | 尺寸、Auto Layout、padding、gap、resizing |
| `tokenBindings` | FX | 节点属性到 Semantic Token 的映射 |
| `contentRules` | FX | 文案长度、允许内容、截断和空值策略 |
| `accessibility` | FX | role、name、keyboard、minimum target 等 |
| `interactionHookRefs` | O | 引用 `interactions.json` |
| `decisionRefs` | O | 引用已确认 Decision |
| `implementationHintRefs` | O | 引用 Hint |
| `implementationContract` | X | 复用、必要行为和禁止实现 |
| `sourceRefs` | R | 来源 |
| `confidence` | R | 置信度 |
| `reviewStatus` | R | 人工审核状态 |
| `provenance` | O | 字段级来源 |

### 8.2 `figma`

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `nodeType` | R | `COMPONENT` 或 `COMPONENT_SET` |
| `name` | R | Figma 展示名称 |
| `variantPropertyOrder` | C | Component Set 必须提供 |

以下字段不属于 Source Contract：

| 字段 | 状态 | 派生来源 |
| --- | --- | --- |
| `figma.stablePluginData` | OUTPUT-ONLY | Component `id` + Compiler 固定 namespace/key 规则 |
| `figma.descriptionMarkdown` | OUTPUT-ONLY | `description`、`purpose`、`documentation`、accessibility |

它们可出现在 Compiler 输出或检查报告中，但不得回写为第二份 source of truth。

### 8.3 `properties`

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

### 8.4 Slot / Content Region Contract

Component 的 `slots` 是正式合同，不是任意嵌套节点树。每个 Slot：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Component 内稳定 Slot ID |
| `role` | R | `leading-content`、`body`、`actions` 等语义角色 |
| `description` | R | Slot 用途 |
| `cardinality` | R | `{ "min": number, "max": number \| "many" }` |
| `allowedContent` | R | 允许的 text/component/pattern 类型和 refs |
| `figmaRepresentation` | R | `instance-swap`、`nested-instance`、`text-property`、`documentation-only` |
| `fallback` | O | Slot 空缺时的明确行为 |

`figmaRepresentation=instance-swap` 必须引用对应 Property；
Slot 只定义平台中立的设计合同。各 code target 的 prop、children、render
function 或 content model 映射全部由 `code-mapping.json.slotMappings` 拥有。

### 8.5 Anatomy

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

### 8.6 States

State 不等于 Variant。State 可以由 Variant、Boolean、Interaction 或外部状态组合产生：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 例如 `state.disabled` |
| `name` | R | 状态名称 |
| `entryCondition` | R | 属性或上下文条件 |
| `representation` | R | `variant`、`property`、`interaction`、`external`、`documentation-only` |
| `requiredIn` | R | `figma`、`code` 的非空子集 |
| `visualChanges` | R | 相对默认状态的 Token/visibility 变化 |
| `behavior` | R | 是否可交互、focus、loading 等 |
| `required` | R | 是否属于发布前必须实现的状态 |

Compiler 不得把所有 State 自动扩张为 Variant 笛卡尔积：

- `variant`：Figma Component Set Variant。
- `property`：Boolean/Text/Instance Swap 等 Component Property。
- `interaction`：通过 Prototype/Interaction 进入。
- `external`：由 Screen、数据或业务状态驱动，不成为 Component Variant。
- `documentation-only`：记录规范，但不创建 Figma 属性。

例如 loading 可以使用 `representation=external` 且 `requiredIn=["code"]`，
因此不会强制 Figma 生成 Loading Variant。

### 8.7 Layout Contract

至少包括：

- `mode`：horizontal/vertical/none；
- `sizing`：hug/fill/fixed/min/max；
- `alignment`；
- `padding` 和 `gap` 的 Semantic Token refs；
- child resizing；
- overflow/wrap；
- 内容增长策略；
- 允许的固定尺寸及原因。

### 8.8 Implementation Contract

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `reusePolicy` | R | 唯一 owner；`must-reuse`、`prefer-reuse`、`may-implement`、`reference-only` |
| `requiredBehavior` | R | 必须保留的行为列表 |
| `forbiddenImplementation` | R | 禁止事项列表 |
| `missingMappingPolicy` | R | `block`、`abstract-first`、`allow-local`、`review-required` |

`components.json.implementationContract.reusePolicy` 是唯一 source of truth。
Component Contract 保持平台中立，不拥有 code component、source path、import
或 Mapping ID。`code-mapping.json` 按 `codeTargetRef` 拥有这些 target-specific
事实，只能通过 `implementationContractRef` 引用实现约束，不得再次声明独立
`reusePolicy`。

语义：

| reusePolicy | Codex 行为 |
| --- | --- |
| `must-reuse` | 必须使用已映射组件；映射缺失或不可用时停止并报告 |
| `prefer-reuse` | 优先复用；无法复用时说明原因并按 `missingMappingPolicy` 处理 |
| `may-implement` | 可创建新实现，但仍必须遵守事实和 Decision |
| `reference-only` | 仅作视觉/行为参考，不要求一对一代码组件 |

## 9. Component Contract 示例 JSON

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
  "slots": [
    {
      "id": "slot.button.leading-content",
      "role": "leading-content",
      "description": "按钮文案前的可选图标内容。",
      "cardinality": {
        "min": 0,
        "max": 1
      },
      "allowedContent": [
        {
          "kind": "component",
          "componentRefs": ["component.icon.placeholder"]
        }
      ],
      "figmaRepresentation": {
        "kind": "instance-swap",
        "propertyRef": "property.button.leading-icon"
      },
      "fallback": "omit"
    }
  ],
  "states": [
    {
      "id": "state.default",
      "name": "Default",
      "entryCondition": {
        "Disabled": false
      },
      "representation": "property",
      "requiredIn": ["figma", "code"],
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
      "representation": "property",
      "requiredIn": ["figma", "code"],
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
  "confidence": "exact",
  "reviewStatus": "approved",
  "reviewedBy": "design-reviewer@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review"
}
```

`documentation` 可确定性生成 OUTPUT-ONLY 的 Figma `descriptionMarkdown`，
例如按“Purpose / Usage / Don’t / Accessibility”顺序渲染。JSON 中的结构化
字段仍是唯一 source of truth。

## 10. Patterns Schema

Pattern 描述多个 Component 的组合约束，不等于可发布 Component。

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定身份 |
| `name`、`description` | FX | 人工可读说明 |
| `purpose` | R | 模式解决的问题 |
| `composition` | R | 带稳定 role 的 Component/Pattern 引用树 |
| `layout` | R | 组合层布局、间距、顺序、响应式规则 |
| `behavior` | R | 多组件协同行为 |
| `states` | R | Pattern 级 loading/empty/error 等 |
| `contentRules` | R | 组合内容约束 |
| `interactionRefs` | R | 交互引用，可为空 |
| `decisionRefs` | R | Decision 引用，可为空 |
| `implementationHintRefs` | R | Hint 引用，可为空 |
| `sourceRefs`、`confidence`、`reviewStatus` | R | 来源、证据强度和审核状态 |

`composition` 中引用 Component，只设置允许的 properties，不复制其 fill、radius 或 typography。

## 11. Screen Contract

### 11.1 顶层字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定 Screen ID |
| `name` | FX | Screen 名称 |
| `description` | FX | Screen 是什么 |
| `purpose` | FX | 用户目标和业务作用 |
| `figma` | F | Frame 类型、名称和平台画布；Plugin Data 为 OUTPUT-ONLY |
| `layout` | FX | Screen 级排列、边距、滚动和区域 |
| `regions` | FX | 一层正式 Region；Screen 不直接拥有任意递归 children |
| `states` | FX | 页面 default/loading/empty/error/disabled/success/timeout 等 |
| `interactionRefs` | O | Screen 相关交互 |
| `responsive` | FX | breakpoint 和布局变化；固定平台也要明确 `fixed` |
| `decisionRefs` | O | Decision 引用 |
| `implementationHintRefs` | O | Hint 引用 |
| `referenceAssetRefs` | O | Reference 引用 |
| `sourceRefs` | R | 来源 |
| `confidence` | R | 置信度 |
| `reviewStatus` | R | 人工审核状态 |
| `provenance` | O | 字段级来源 |

### 11.2 Region Contract

正式 V2.1 的结构深度固定为：

```text
Screen → Region → Text / Component / Pattern
```

Region 不允许继续嵌套 Region，从而避免无限递归节点树。

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Screen 内唯一稳定 Region ID |
| `role` | R | `header`、`main`、`footer`、`overlay` 等语义角色 |
| `description` | R | Region 用途 |
| `layout` | R | Region 的排列、尺寸、间距和响应式行为 |
| `children` | R | Text/Component/Pattern Child 数组 |
| `decisionRefs` | R | 可为空 |
| `implementationHintRefs` | R | 可为空 |

### 11.3 Region Child Contract

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Screen 内唯一稳定 ID |
| `kind` | R | 只允许 `text`、`component`、`pattern` |
| `componentRef` | C | `kind=component` 时 REQUIRED |
| `patternRef` | C | `kind=pattern` 时 REQUIRED |
| `role` | R | 页面语义角色 |
| `properties` | O | 仅设置 Component 已声明属性 |
| `content` | O | Screen 特有文本或数据绑定 |
| `layout` | O | 仅定义 Screen 中的 placement，不覆盖 Component 内部布局 |
| `visibility` | O | 状态条件 |
| `decisionRefs` | R | 可为空 |
| `implementationHintRefs` | R | 可为空 |

### 11.4 Page States

每个 Screen State：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | `state.default`、`state.loading` 等 |
| `name` | R | 人工可读名称 |
| `required` | R | 是否必须实现 |
| `entryCondition` | R | 进入条件 |
| `childOverrides` | R | 使用 Region + Child 全限定目标的增量覆盖 |
| `patternFallbackRef` | O | 可呈现的 Pattern fallback |
| `approvedFallbackRef` | O | 引用已批准的 Decision fallback |
| `interactionAvailability` | R | 该状态允许的 Interaction refs |
| `fallbackStateRef` | O | 使用 owner + state 的无歧义回退 |

除作为基础呈现的 `state.default` 外，`required=true` 的状态必须至少满足一项：

1. 存在可呈现且非空的 `childOverrides`；
2. 存在 `patternFallbackRef`；
3. 存在 `approvedFallbackRef`，且对应 Decision 为 approved。

只在数组中声明 loading/empty/error 名称不算完成 State Coverage。

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
  "fallbackStateRef": {
    "ownerRef": "screen.pending-tasks",
    "stateId": "state.error"
  },
  "confidence": "low",
  "reviewStatus": "needs-review"
}
```

## 12. Screen Contract 示例 JSON

```json
{
  "id": "screen.pending-tasks",
  "name": "Pending Tasks",
  "description": "展示当前用户需要处理的协作任务。",
  "purpose": "让用户快速理解待处理事项、状态和首要操作。",
  "figma": {
    "nodeType": "FRAME",
    "name": "Pending Tasks",
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
    "regionOrder": ["region.main"]
  },
  "regions": [
    {
      "id": "region.main",
      "role": "main",
      "description": "页面主要任务内容。",
      "layout": {
        "mode": "vertical",
        "width": "fill",
        "gap": {
          "tokenRef": "semantic.spacing.section"
        }
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
        "bindingRef": "data.pending-task#"
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
      "decisionRefs": [],
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
          "targetRef": {
            "regionId": "region.main",
            "childId": "task-card.1"
          },
          "visibility": false
        }
      ],
      "patternFallbackRef": "pattern.feedback.loading",
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
          "targetRef": {
            "regionId": "region.main",
            "childId": "task-card.1"
          },
          "visibility": false
        },
        {
          "targetRef": {
            "regionId": "region.main",
            "childId": "status"
          },
          "visibility": false
        }
      ],
      "patternFallbackRef": "pattern.feedback.empty",
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
      "patternFallbackRef": "pattern.feedback.error",
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
  "confidence": "exact",
  "reviewStatus": "approved",
  "reviewedBy": "design-reviewer@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review"
}
```

Screen 示例只设置 Button 的属性，不重复 Button fill、radius、padding 或 typography。

## 13. Interactions Schema

Interaction 独立于 Screen 和 Component，支持被多个入口引用。

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定身份 |
| `name`、`description` | FX | 人工可读说明 |
| `trigger` | R | 来源对象、事件和可选 payload |
| `guard` | R | 执行条件；无 guard 时使用空数组 |
| `action` | R | 语义动作，例如 `open`、`submit`、`retry` |
| `target` | R | Screen、Pattern、状态或外部目标 |
| `dataRefs` | R | 使用 Data Contract 全限定引用；可为空数组 |
| `transitions` | R | `loading`、`success`、`failure` 到 StateRef 的映射 |
| `sideEffects` | O | analytics、toast 等已确认副作用 |
| `decisionRefs` | R | 可为空 |
| `implementationHintRefs` | R | 可为空 |
| `sourceRefs`、`confidence`、`reviewStatus` | R | 来源、证据强度和人工审核 |

StateRef 必须使用无歧义对象：

```json
{
  "ownerRef": "pattern.feedback-form",
  "stateId": "state.success"
}
```

禁止单独使用 `"state.success"`。`ownerRef` 必须解析到声明该 state 的
Component、Pattern 或 Screen。

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
    "dataRef": "data.feedback-submission#"
  },
  "target": {
    "ref": "pattern.feedback-form"
  },
  "transitions": {
    "loading": {
      "ownerRef": "pattern.feedback-form",
      "stateId": "state.submitting"
    },
    "success": {
      "ownerRef": "pattern.feedback-form",
      "stateId": "state.success"
    },
    "failure": {
      "ownerRef": "pattern.feedback-form",
      "stateId": "state.error"
    }
  },
  "dataRefs": [
    "data.feedback-submission#"
  ],
  "decisionRefs": [
    "decision.feedback-form.submission-feedback"
  ],
  "implementationHintRefs": [
    "hint.feedback-form.use-existing-request-state"
  ],
  "sourceRefs": [
    "source.manual.product-review"
  ],
  "confidence": "exact",
  "reviewStatus": "approved",
  "reviewedBy": "design-reviewer@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review"
}
```

该示例只有在 `data-contracts.json` 已声明
`data.feedback-submission` 且 `#` 可解析到合同根值时才有效；否则 Schema-valid
检查必须报悬空 Data Contract reference。

## 14. Design Decision Schema 与示例

### 14.1 字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定身份 |
| `name`、`description` | FX | 人工可读说明 |
| `scope` | R | 受影响的 Component/Pattern/Screen/Interaction refs |
| `decision` | R | 已确认选择 |
| `rationale` | R | 为什么这样决定 |
| `mustNotChange` | R | Codex 不得自行改变的具体事项 |
| `alternativesRejected` | R | 可为空数组；记录被否决方案和原因 |
| `supersededBy` | O | 被新 Decision 替代时提供 |
| `sourceRefs`、`confidence`、`reviewStatus` | R | 来源、证据强度和审核状态 |

### 14.2 示例

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
  "sourceRefs": [
    "source.manual.product-review"
  ],
  "confidence": "exact",
  "reviewStatus": "approved",
  "reviewedBy": "design-reviewer@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review"
}
```

## 15. Implementation Hint Schema 与示例

### 15.1 字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 稳定身份 |
| `name`、`description` | FX | 人工可读说明 |
| `scope` | R | 作用对象 refs |
| `recommendation` | R | 建议做法 |
| `reason` | R | 工程理由 |
| `priority` | R | `high`、`medium`、`low` |
| `deviationPolicy` | R | 允许偏离的条件和说明要求 |
| `codeContext` | O | 相关框架、目录或现有抽象 |
| `sourceRefs`、`confidence`、`reviewStatus` | R | 来源、证据强度和审核状态 |

### 15.2 示例

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
  "confidence": "high",
  "reviewStatus": "approved",
  "reviewedBy": "design-reviewer@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review"
}
```

## 16. Code Mapping Schema 与示例

### 16.1 顶层结构

```json
{
  "schemaVersion": "2.1.0",
  "codeTargetRefs": [
    "code-target.react-web",
    "code-target.swift-ios"
  ],
  "componentMappings": [],
  "tokenMappings": [],
  "screenMappings": [],
  "slotMappings": [],
  "dataMappings": []
}
```

一个 Design Package 可以面向多个 `codeTargets`。每条 Mapping 必须声明
`codeTargetRef`，不同目标可以拥有不同 Token 名、组件路径和 prop mapping。
Component 与 Slot Contract 不保存任何单一 target 的 Mapping ID。

### 16.2 Component Mapping 字段

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Mapping 稳定 ID |
| `codeTargetRef` | R | 引用 Manifest 中一个 code target |
| `designRef` | R | Component ID |
| `status` | R | `matched`、`partial`、`missing`、`blocked` |
| `implementationContractRef` | R | 引用 Component 的 implementation contract；不复制 reusePolicy |
| `codeComponent` | C | matched/partial 时 REQUIRED |
| `sourcePath` | C | matched/partial 时 REQUIRED |
| `import` | C | import source/name/type |
| `propMapping` | R | Figma/Schema Property 到 code prop/value |
| `eventMapping` | R | Interaction hook 到 code callback |
| `behaviorMapping` | O | loading、disabled、focus 等 |
| `freshness` | R | 路径、import 和 prop mapping 的验证新鲜度 |
| `searchEvidence` | C | status=missing/partial 时记录搜索范围和结果 |
| `sourceRefs`、`confidence`、`reviewStatus` | R | 来源、证据强度和审核状态 |

`slotMappings` 按目标拥有 Slot 的代码表示：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Mapping 稳定 ID |
| `codeTargetRef` | R | 目标代码环境 |
| `designRef` | R | 全限定 Slot ref |
| `status` | R | `matched`、`partial`、`missing`、`blocked` |
| `codeRepresentation` | C | matched/partial 时 REQUIRED；prop、children、render function 或 content model |
| `sourcePath` | C | matched/partial 时 REQUIRED |
| `fieldMapping` | C | Slot cardinality/content 到目标代码字段的映射 |
| `freshness` | R | 与目标 repository revision 对齐的验证信息 |
| `sourceRefs`、`confidence`、review metadata | R | 公共来源与审核合同 |

`freshness`：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `verifiedRevision` | R | commit SHA、package version 或其他目标 revision |
| `verifiedAt` | R | ISO 8601 |
| `verificationStatus` | R | `verified`、`stale`、`unverified`、`failed` |
| `verifiedBy` | O | 工具或审核人 |

Audit 使用该对象判断 `sourcePath`、`import`、prop/event mapping 是否仍有效。
`verificationStatus != verified` 会阻止 codex-ready，除非外部 Audit Profile
允许经过批准的例外。

Token Code Name 由 `tokenMappings` 按目标拥有：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `tokenRef` | R | Foundation Token ID |
| `codeTargetRef` | R | 目标代码环境 |
| `codeName` | R | 该目标的 CSS Variable、TS key、Swift/Kotlin name |
| `sourcePath` | O | 已存在定义的位置 |
| `freshness` | R | 验证信息 |

### 16.3 Data Code Mapping

`dataMappings` 连接 UI Data Contract 与目标仓库中已经存在的 Type、Model、
Selector 或 Adapter。它不向 Data Contract 添加 endpoint、HTTP method 或后端
transport 信息。

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Mapping 稳定 ID |
| `codeTargetRef` | R | 引用 Manifest 中一个 code target |
| `designRef` | R | Data Contract ID |
| `status` | R | `matched`、`partial`、`missing`、`blocked` |
| `codeType` | C | matched/partial 时提供目标语言类型名 |
| `codeSymbol` | C | matched/partial 时提供可定位 symbol；可与 codeType 相同 |
| `sourcePath` | C | matched/partial 时 REQUIRED |
| `import` | O | 目标需要显式 import 时提供 |
| `fieldMapping` | C | matched/partial 时 REQUIRED；Data field 到 code field/select path |
| `adapter` | O | 已存在或已批准的转换函数/selector；不得内嵌后端 endpoint |
| `missingPolicy` | C | status=missing 时 REQUIRED；`block`、`define-local`、`review-required` |
| `freshness` | R | verified revision/time/status |
| `searchEvidence` | C | missing/partial 时记录搜索证据 |
| `sourceRefs`、`confidence`、review metadata | R | 公共来源与可信审核合同 |

已有数据模型时，Codex 不得跳过 verified `dataMapping` 并重新定义重复
TypeScript interface、Swift model 或其他本地模型。没有对应模型时必须使用
`status=missing` 并明确 `missingPolicy`，不能把“没有找到”伪装成新模型授权。

Data Mapping 示例：

```json
{
  "id": "mapping.data.pending-task.react",
  "codeTargetRef": "code-target.react-web",
  "designRef": "data.pending-task",
  "status": "matched",
  "codeType": "PendingTask",
  "codeSymbol": "selectPendingTaskViewModel",
  "sourcePath": "src/features/tasks/model/pendingTask.ts",
  "import": {
    "kind": "named",
    "name": "PendingTask",
    "from": "@/features/tasks/model/pendingTask"
  },
  "fieldMapping": [
    {
      "designField": "title",
      "codeField": "title"
    },
    {
      "designField": "status",
      "codeField": "status"
    }
  ],
  "adapter": {
    "kind": "selector",
    "symbol": "selectPendingTaskViewModel",
    "sourcePath": "src/features/tasks/model/selectors.ts"
  },
  "freshness": {
    "verifiedRevision": "git:abc123",
    "verifiedAt": "2026-07-30T10:00:00+08:00",
    "verificationStatus": "verified",
    "verifiedBy": "manual-code-review"
  },
  "sourceRefs": [
    "source.existing-code.pending-task"
  ],
  "confidence": "exact",
  "reviewStatus": "approved",
  "reviewedBy": "frontend-owner@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review"
}
```

### 16.4 Component Mapping 示例

```json
{
  "id": "mapping.component.button.react",
  "codeTargetRef": "code-target.react-web",
  "designRef": "component.button",
  "status": "matched",
  "implementationContractRef": "component.button#/implementationContract",
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
  "freshness": {
    "verifiedRevision": "git:abc123",
    "verifiedAt": "2026-07-30T10:00:00+08:00",
    "verificationStatus": "verified",
    "verifiedBy": "manual-code-review"
  },
  "sourceRefs": [
    "source.existing-code.button"
  ],
  "confidence": "exact",
  "reviewStatus": "approved",
  "reviewedBy": "frontend-owner@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review"
}
```

无匹配组件示例：

```json
{
  "id": "mapping.component.risk-summary.react",
  "codeTargetRef": "code-target.react-web",
  "designRef": "component.risk-summary",
  "status": "missing",
  "implementationContractRef": "component.risk-summary#/implementationContract",
  "propMapping": [],
  "eventMapping": [],
  "searchEvidence": {
    "searchedPaths": [
      "src/components",
      "src/features"
    ],
    "result": "No matching code component found."
  },
  "freshness": {
    "verifiedRevision": "git:abc123",
    "verifiedAt": "2026-07-30T10:00:00+08:00",
    "verificationStatus": "verified",
    "verifiedBy": "manual-code-review"
  },
  "sourceRefs": [
    "source.existing-code.inventory"
  ],
  "confidence": "high",
  "reviewStatus": "approved",
  "reviewedBy": "frontend-owner@example.com",
  "reviewedAt": "2026-07-30T10:00:00+08:00",
  "reviewMethod": "human-review"
}
```

允许创建、必须先抽象还是必须停止，均由
`component.risk-summary#/implementationContract` 的 `reusePolicy` 和
`missingMappingPolicy` 决定；Mapping 只陈述当前代码匹配事实。

## 17. Audit Governance

完整 Governance Rule 不由每个 Design Package 定义。规则由独立、版本化、只读的
Audit Profile 发布；Package 只能请求 Profile 并携带候选例外。Profile 和例外
是否可信，由 Compiler / Exporter 外部的 Trusted Profile Policy 决定。

### 17.1 `audit-governance.json`

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `schemaVersion` | R | V2.1 使用 `2.1.0` |
| `requestedAuditProfile` | R | Package 请求的外部 Profile ID、version、URI 和 checksum |
| `approvedExceptions` | R | 可为空；只有可信 Governance Action 批准后才有效 |

`requestedAuditProfile`：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | 例如 `audit-profile.design-package.standard` |
| `version` | R | 固定版本，不允许浮动 `latest` |
| `uri` | R | Profile 的权威位置 |
| `checksum` | R | 防止 Package 静默替换规则内容 |

Approved Exception：

| 字段 | 要求 | 说明 |
| --- | --- | --- |
| `id` | R | Exception 稳定 ID |
| `ruleRef` | R | 外部 Profile 中的 Rule ID |
| `scopeRef` | R | 例外的最小对象/字段范围 |
| `rationale` | R | 为什么允许例外 |
| `expiresAt` | O | 到期后自动失效 |
| review metadata | R | 必须是可信 `approved + governance-action` 才生效 |

Package 禁止覆盖 Rule 的 `severity`、`blocking`、`condition` 或 `appliesTo`。
blocking rule 只能通过 Profile 允许的 exception mechanism 豁免，不能在包内降级。

#### Audit Profile trust boundary

- Package 声明的是 requested Profile，不是可信性的 source of truth。
- Audit evaluator 必须从外部 trusted profile registry / allowlist 验证 Profile
  `id`、`version`、`checksum` 三者的精确组合。
- 只匹配 ID、使用浮动版本、checksum 不一致或 registry 中不存在，均视为
  untrusted Profile，并对 figma-ready / codex-ready blocking。
- `uri` 用于定位，不替代 allowlist 验证。
- 当前 Core 不要求数字签名；可信 registry、Review Action 和 Governance Action
  均属于 Package 之外的执行环境。

AI Import 不能自行创建有效 exception。`approvedExceptions` 中的条目必须能关联
可信 Human Review / Governance Action，并包含完整 review metadata；验证失败时
该例外不得应用，原 blocking issue 继续存在。

### 17.2 Governance 示例

```json
{
  "schemaVersion": "2.1.0",
  "requestedAuditProfile": {
    "id": "audit-profile.design-package.standard",
    "version": "2.1.0",
    "uri": "governance://design-package/standard/2.1.0",
    "checksum": "sha256:profile-checksum"
  },
  "approvedExceptions": [
    {
      "id": "exception.pending-tasks.timeout-fallback",
      "ruleRef": "rule.screen.required-state-coverage",
      "scopeRef": "screen.pending-tasks#state.timeout",
      "rationale": "Pilot 范围内复用 approved error state。",
      "expiresAt": "2026-09-30T23:59:59+08:00",
      "reviewStatus": "approved",
      "reviewedBy": "design-governance-review",
      "reviewedAt": "2026-07-30T10:00:00+08:00",
      "reviewMethod": "governance-action"
    }
  ]
}
```

### 17.3 外部 Profile 最小规则能力

Standard Profile 至少应覆盖：

- missing description / stable ID；
- duplicate identity；
- hardcoded color/radius；
- Foundation 缺少 `figmaRepresentation`；
- incomplete variants；
- missing/unqualified Data Contract reference；
- missing state representation / requiredIn；
- missing code mapping 或 stale mapping；
- missing Decision；
- unmapped Token；
- unsafe implementation freedom；
- readiness gate；
- required state coverage；
- `untrusted-review-approval`；
- untrusted audit profile / exception。

`untrusted-review-approval` 检测 AI、parser 或 importer 直接声明
`approved/rejected`，却不存在可验证 Human Review Action 的对象或字段。该问题
对相关 readiness gate blocking，不能由对象顶层 `approved` 或 Package 自己声明
的 exception 消除。

### 17.4 Required State Coverage Audit

外部规则 `rule.screen.required-state-coverage` 至少检查：

1. 对每个 `required=true` 且非 base/default 的 State；
2. `childOverrides` 是否包含至少一个可呈现变化；
3. 或 `patternFallbackRef` 是否解析到可呈现 Pattern；
4. 或 `approvedFallbackRef` 是否解析到 `reviewStatus=approved` 的 Decision；
5. override target 是否能解析到 Region + Child；
6. fallback StateRef 是否使用 owner + state；
7. 目标 readiness 对应的 presentation 是否存在。

只有状态名称、空 override 或未批准 fallback 时，该规则必须 blocking。
Component/Pattern 的 required State 使用同一原则，并结合其 `representation`
与 `requiredIn` 判断应在 Figma、Code 或两者中具备可呈现实现。

## 18. Readiness Profiles

Schema valid、Figma Ready 和 Codex Ready 是三个不同判断：

```text
Schema valid ≠ figma-ready ≠ codex-ready
```

Readiness 是对 Package 当前状态的可审计评估，不通过增加大量 universally
REQUIRED 字段迫使 AI 编造未知事实。

### 18.1 Source Readiness Declaration

```json
{
  "requestedReadiness": [
    {
      "profile": "figma-ready"
    },
    {
      "profile": "codex-ready",
      "codeTargetRef": "code-target.react-web"
    }
  ]
}
```

Source Manifest 只表达 Package 希望被评估到哪个目标。它不得保存：

- `evaluatedAt`；
- gate runtime status；
- blocking issues；
- applied exceptions；
- `auditResultRef` 或 Profile 执行结果。

上述动态事实全部由 OUTPUT-ONLY `audit.json` 拥有。`audit.json` 至少记录
evaluation identity/time、实际可信 Profile identity、每个 gate result、
blocking issues、可信且实际应用的 exceptions，以及对应 `codeTargetRef`。
Source Package 声明 `requestedReadiness` 不代表已通过该 readiness。

### 18.2 Draft

Draft 的 blocking 条件：

- JSON/Schema 无法解析；
- stable ID 重复；
- 引用语法非法；
- 出现 `reviewStatus=rejected` 且对象仍被活动范围引用；
- Package 声明的 Schema feature 与 schemaVersion 不兼容。

Draft 允许：

- OPTIONAL 字段缺失；
- `reviewStatus=unreviewed/needs-review`；
- Code Mapping 缺失或未验证；
- Figma representation 尚未审核；
- 非当前范围的 State 尚未完成。

### 18.3 Figma Ready

除 Schema valid 外，以下任一情况 blocking：

- Figma 消费范围内对象不是 `reviewStatus=approved`；
- Figma readiness-relevant 字段的 Provenance 仍为
  `unreviewed/needs-review/rejected`，即使对象顶层已 approved；
- approved/rejected 缺少可信 Human Review Action；
- Foundation Token 缺失明确 `figmaRepresentation`；
- Compiler 需要的 Component/Property/Slot/Screen Region 合同缺失；
- Figma 使用的引用无法解析；
- `requiredIn` 包含 `figma` 的 State 没有对应 representation 和 coverage；
- Required Screen State 没有可呈现 override/Pattern/approved fallback；
- 外部 Audit Profile 存在未豁免的 Figma blocking issue；
- requested Audit Profile 不在外部 trusted registry/allowlist，或
  id/version/checksum 不匹配；
- Compiler compatibility gate 未通过。

低 confidence 不自动 blocking；若人工已批准，可以进入 Figma Ready，但 Audit
Result 必须保留其证据强度。

### 18.4 Codex Ready

除 Schema valid 外，以下任一情况 blocking：

- 目标流程要求 Figma 人工验收但 `gate.figma-ready` 未 passed；
- Design Decision 未 approved；
- Codex readiness-relevant 字段的 Provenance 仍为
  `unreviewed/needs-review/rejected`，即使对象顶层已 approved；
- approved/rejected 缺少可信 Human Review Action；
- Screen/Interaction 的 Data Contract ref 无法解析；
- Component 缺失 implementation contract；
- 当前 code target 的 Mapping 缺失、stale、unverified 或 failed，且没有批准例外；
- 活动 Data Contract 在目标仓库已有模型但没有 verified Data Mapping；
- 活动 Data Contract 无对应模型时没有 `status=missing` 和明确 missing policy；
- `requiredIn` 包含 `code` 的 State 没有可实现 presentation/fallback；
- Required State Coverage Audit 未通过；
- reusePolicy、missingMappingPolicy 或 forbiddenImplementation 无唯一 owner；
- 外部 Audit Profile 存在未豁免的 Codex blocking issue；
- requested Audit Profile 不受外部 Trusted Profile Policy 信任；
- Handoff 必需文件缺失。

Codex Ready 按 `codeTargetRef` 分别评估。同一个 Package 可以对 React target
codex-ready，同时对 Swift target 保持 draft。

## 19. References Schema

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
| `reviewStatus` | R | 是否经过人工验收；替代布尔 `approved` |

参考资产不等同设计事实。Screen/Component 应通过 `referenceAssetRefs` 引用它，再通过 `provenance` 说明哪些事实来自该资产。

## 20. REQUIRED / OPTIONAL 汇总

### 20.1 Schema-valid 最小 REQUIRED

- `id`
- `sourceRefs`
- `confidence`
- `reviewStatus`
- 对象类型判别字段（例如 Token `type`、Data Contract `kind`）

`name`、`description` 和完整生成合同属于 readiness REQUIRED，而不是为了
Schema-valid 强迫 AI 编造。

### 20.2 Readiness REQUIRED

| 对象 | figma-ready | codex-ready |
| --- | --- |
| Manifest | platform、designSystem、sources、screens、compatibility、auditGovernance、requestedReadiness | 前述字段 + codeTargets + Handoff entrypoints |
| Token | name/description、category/type、value/alias、figmaRepresentation | name/description、value/alias；目标 tokenMapping |
| Data Contract | 被 Screen/Interaction 引用时必须完整解析 | 所有活动 data refs、fields、formatting + verified/missing Data Mapping |
| Component | purpose、documentation、figma、anatomy、properties、slots、State(Figma)、layout、tokenBindings | anatomy、properties、slots、State(Code)、content/accessibility、implementationContract |
| Pattern | composition、layout、Figma required states | composition、behavior、Code required states |
| Screen | figma、layout、regions、Figma required states、responsive | regions、Data binding、Code required states、interactions、responsive |
| Interaction | Figma Prototype 需要的无歧义 StateRef | trigger/guard/action/dataRefs/transitions |
| Decision | 所有影响 Figma 的 Decision approved | 所有活动 Decision approved |
| Mapping | 非必须，除非 Compiler 依赖 Code mapping | 当前 code target 的 Component/Slot/Token/Data mappings + freshness |
| Audit Governance | requested Profile 通过外部 trust policy；Figma blocking issues 清零 | requested Profile 通过外部 trust policy；Codex blocking issues 清零 |

### 20.3 常见 OPTIONAL

- `provenance`：当对象级来源不足以解释关键字段时强烈建议提供。
- `tags`、`extensions`。
- Token `modes`、`deprecated`。
- Component `interactionHookRefs`；不存在 Slot 时 `slots=[]`。
- Interaction `sideEffects`。
- Code Mapping `behaviorMapping`。
- Source `revision`、`checksum`、`notes`。

OPTIONAL 不表示可以随意猜测；只有存在证据或明确需要时才填写。

## 21. Figma / Codex 消费边界

### 21.1 字段消费矩阵

| 字段组 | Figma Compiler | Codex | 人工验收 |
| --- | --- | --- | --- |
| stable `id` / refs | 共享 | 共享 | 共享 |
| name / description / purpose | 共享 | 共享 | 共享 |
| sourceRefs / confidence / reviewStatus / review metadata / provenance | 共享 | 共享 | 人工审核 owner |
| Primitive/Semantic Token value/alias | 共享 | 共享 | 共享 |
| `figmaRepresentation`、figmaName、nodeType、variant order | **Figma-only** | 可忽略 | 可查看 |
| OUTPUT-ONLY Plugin Data / descriptionMarkdown | Compiler 输出 | 可忽略 | 可查看 |
| target-specific codeName、sourcePath、code component/type、prop/event/slot/data mapping | 可忽略 | **Codex-only** | 可查看 |
| Data Contract | 内容生成可消费 | **Codex-only** 强约束 | 共享 |
| Component anatomy / properties / states / layout | 共享 | 共享 | 共享 |
| Component tokenBindings | 共享 | 共享 | 共享 |
| implementationContract | 不影响生成节点 | **Codex-only** | 共享审核 |
| reusePolicy / forbiddenImplementation | 可忽略 | **Codex-only** | 共享审核 |
| Screen Regions / children / states / responsive | 共享 | 共享 | 共享 |
| Decision | 可用于文档和审计 | 共享且强约束 | 共享 |
| Implementation Hint | 可忽略 | **Codex-only** | 共享 |
| requested Audit Profile / exceptions / requested readiness | 按范围 | 按范围 | 外部 trust policy |
| Audit Result / actual readiness / applied exceptions | OUTPUT-ONLY | OUTPUT-ONLY | 外部 evaluator |

### 21.2 只服务 Figma 的字段

- `figma.nodeType`
- `figma.name`
- `figma.variantPropertyOrder`
- `figmaLibraryKey`
- Foundation `figmaRepresentation`
- Figma Variable scope/mode 映射

`figma.stablePluginData` 和 `figma.descriptionMarkdown` 是 OUTPUT-ONLY，不属于
任一 Source Contract 字段。

### 21.3 只服务 Codex 的字段

- `implementationContract`
- Component-owned `reusePolicy`
- `missingMappingPolicy`
- `forbiddenImplementation`
- `code-mapping.json` 的 target-specific codeName、source path、import、
  Component/Slot/Token/Data mapping 与 freshness
- Implementation Hint 及偏离报告要求

### 21.4 两边共享的字段

- 稳定 ID 和引用关系
- Token value/alias/type
- Data Contract 和可解析 data refs
- Component anatomy、properties、states、layout、Token Binding
- Pattern composition
- Screen layout、Regions、children、states、responsive
- Interaction 状态转换
- Design Decision
- Source、Confidence、Review Status、Locator、Extraction Method、Provenance

## 22. Codex Handoff 结构

未来 Export for Codex 至少输出：

```text
codex-handoff/
├─ AGENTS.md
├─ README.md
├─ handoff-manifest.json
├─ tokens.json
├─ data-contracts.json
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

### 22.1 每个文件给 Codex 的作用

| 文件 | Codex 用途 |
| --- | --- |
| `AGENTS.md` | 高层不可违反规则、工作边界、验证要求和决策优先级 |
| `README.md` | 包范围、入口、目标平台、使用顺序、已知限制 |
| `handoff-manifest.json` | 本次导出的 Package、code target、repository revision、Audit 与文件校验身份 |
| `tokens.json` | 代码 Token、alias 和 Semantic 用途 |
| `data-contracts.json` | UI 数据形状、nullable/enum/formatting 和 mock；不暴露后端 API |
| `components.json` | 可复用组件合同、状态、布局、内容和强制实现约束 |
| `patterns.json` | 多组件组合方式，避免页面自行发明布局 |
| `screens.json` | 页面结构、状态、内容和响应式行为 |
| `interactions.json` | trigger/guard/action/result 状态流 |
| `decisions.json` | 不允许 Codex 自行优化的已确认选择 |
| `implementation-hints.json` | 可调整的工程建议和偏离说明 |
| `code-mapping.json` | 当前 target 的 Component、Slot、Token、Data 代码映射与 freshness |
| `audit.json` | 可信 Profile 执行结果、readiness gates、blocking 问题和实际应用的可信例外 |
| `references/` | 经登记的视觉或结构参考，不替代合同 |

### 22.2 `handoff-manifest.json`

Export for Codex 必须为每个 `codeTargetRef` 生成独立 Handoff Manifest：

```json
{
  "packageId": "package.campus-warning-mobile",
  "packageVersion": "2.1.0",
  "schemaVersion": "2.1.0",
  "designSystem": {
    "id": "design-system.campus-warning",
    "version": "3.0.0"
  },
  "codeTargetRef": "code-target.react-web",
  "exportedAt": "2026-07-30T10:00:00+08:00",
  "repository": {
    "revision": "git:abc123"
  },
  "auditProfile": {
    "id": "audit-profile.design-package.standard",
    "version": "2.1.0",
    "checksum": "sha256:profile-checksum"
  },
  "auditResult": {
    "id": "audit.result.package-2026-07-30",
    "checksum": "sha256:audit-result-checksum"
  },
  "readinessResult": {
    "profile": "codex-ready",
    "status": "passed"
  },
  "files": [
    {
      "path": "components.json",
      "checksum": "sha256:components-checksum"
    },
    {
      "path": "code-mapping.json",
      "checksum": "sha256:mapping-checksum"
    }
  ]
}
```

最小 REQUIRED：

- `packageId`、`packageVersion`、`schemaVersion`；
- Design System ID/version；
- 单一 `codeTargetRef`；
- `exportedAt`；
- verified repository revision；
- 实际使用且已信任的 Audit Profile ID/version/checksum；
- Audit Result identity；
- 该 target 的 readiness result。

`files/checksums` 强烈建议提供，用于发现 Handoff 文件在导出后被修改。若当前
repository revision 与 Handoff 的 verified revision 不一致，Codex 必须先检查
Component、Slot、Token 和 Data Mapping freshness，不得静默假定 Mapping 仍有效。

### 22.3 AGENTS.md 边界

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

## 23. 当前 Pilot V1 → V2.1 迁移建议

本节只是迁移设计，不在本轮执行。

### 23.1 可直接保留的稳定身份

| V1 | V2.1 建议 |
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

### 23.2 Token 迁移

1. 保留 V1 `id`、Figma name、value 和 source。
2. 从现有值创建 Primitive Token。
3. 根据用途创建 Semantic Token，并 alias Primitive。
4. 将 Component binding 从 V1 通用 Token 迁移到 Semantic Token。
5. 建立 legacy ID → V2.1 ID 映射，避免静默改名。
6. 为每个 Figma 消费 Token 人工确认 `figmaRepresentation`。
7. Code 名称按 code target 迁移到 `code-mapping.json.tokenMappings`。
8. 所有用途不清晰的 Token 使用低 confidence +
   `reviewStatus=needs-review`，不自动拆分。

### 23.3 Component 迁移

1. 保留 Component stable ID、展示名称、Variant 值。
2. 将 V1 `variantProperties` 转成统一 `properties[kind=variant]`。
3. 从当前 Figma/代码提取 anatomy、layout 和 tokenBindings。
4. 补齐 documentation、slots、State representation/requiredIn、content rules 和 accessibility。
5. 人工确认 reusePolicy、requiredBehavior 和 forbiddenImplementation。
6. 建立带 target/freshness 的 code mapping；reusePolicy 和
   missingMappingPolicy 仍由 Component implementation contract 独占。
7. 不把 Figma 生成节点树直接当作 Component Contract。

### 23.4 Screen 迁移

1. 保留 Screen 和 direct child stable ID。
2. 先建立一层稳定 Region，再将 direct child 放入 Region。
3. 将 `type=INSTANCE` 转为 `kind=component + componentRef`。
4. 将 Variant 请求转为 `properties`。
5. 将 TEXT 转为 `kind=text + content + textStyleRef`。
6. 为 Screen binding 建立 Data Contract，不保留未解析 `data.*`。
7. 补齐 Screen purpose、required State coverage、responsive、Interaction refs。
8. 不复制 Component fill/radius/token。
9. Pilot 实验中产生的 `My Tasks`、Card 增删和 Variant 变化应作为当前事实候选，由人工决定是否进入正式 V2.1，而不是自动视为产品 Decision。

### 23.5 Source / Confidence / Review 补齐

- V1 `source` 字符串迁移为 Manifest `sourceReferences`。
- 为关键字段补齐 Locator 和 Extraction Method。
- 从 CSS Variable 直接读取的值可标记 `exact`。
- 从截图推断的 layout/effect 默认 `medium`。
- 当前无来源字段的 Component 使用 `confidence=low` 和
  `reviewStatus=needs-review`。
- 人工验收过的 Pilot Runtime 行为可作为 `manual` 来源，但不等同正式产品设计决策。

### 23.6 建议迁移顺序

1. Manifest 与 Source Registry。
2. Foundations Primitive/Semantic Token。
3. Data Contract。
4. Component Contract 与多目标 Code Mapping。
5. Pattern。
6. Screen Region 与 Required State Coverage。
7. Interaction 全限定 State/Data refs。
8. Decision 与 Hint 人工评审。
9. Audit Profile 引用、approved exceptions 与 Readiness Gate。
10. Compiler/Exporter 兼容评估。
11. 最后才进行 V2.1 migration 实现。

## 24. 版本和变更规则

- `schemaVersion`：Schema 结构版本。
- `packageVersion`：某个 Design Package 内容版本。
- `designSystem.version`：设计系统内容版本。
- 新增 OPTIONAL 字段通常是 minor 变更。
- 改变 REQUIRED 字段、枚举语义或引用规则是 major 变更。
- 值或文案调整是 package patch/minor，由影响范围决定。
- stable ID 不因展示名称、代码文件路径或 Figma 图层名调整而变化。
- 废弃对象使用 `deprecated` / `supersededBy`，不得静默复用旧 ID 表达新语义。

## 25. 人工评审重点

在进入 V2.1 migration 前，应确认：

1. Fact / Decision / Hint 的文件边界是否足够清晰。
2. Semantic Token 命名是否符合正式产品，而非 Pilot。
3. Readiness-specific REQUIRED 是否足够，且不会迫使 AI 编造。
4. State representation、requiredIn 和 coverage gate 是否足够明确。
5. `must-reuse` 与 `missingMappingPolicy=block` 的适用范围。
6. 未匹配代码组件时是 `abstract-first` 还是 `review-required`。
7. 一层 Screen Region 是否足以支持首批正式页面。
8. Source/Confidence/Review Status 的人工 override 流程和责任人。
9. 外部 Audit Profile、例外审批和 blocking rule 治理责任。
10. Pilot stable IDs 中哪些可以直接成为正式稳定 ID。

本 Core Candidate 冻结 Schema V2.1 的最小 REQUIRED 集、ownership 与 trust
boundary。任何 JSON Schema、迁移或工具实现必须另行规划，不在本文执行。

## 26. V2 → V2.1 人工评审变更摘要

### 新增

- `data-contracts.json` 与可解析 Data Contract reference。
- 独立 `reviewStatus`，与证据强度 `confidence` 分离。
- Foundation `figmaRepresentation`。
- 多 `codeTargets` 和 target-specific Token/Component Mapping。
- Slot / Content Region 正式合同。
- Component State `representation` 与 `requiredIn`。
- 固定深度 `Screen → Region → Text/Component/Pattern`。
- Source/Provenance `locator` 与 `extractionMethod`。
- owner + state 的无歧义 StateRef。
- Code Mapping `freshness` / verification。
- requested external versioned Audit Profile、候选 approved exceptions。
- draft / figma-ready / codex-ready Readiness Profile。
- Required State Coverage Audit。

### 删除

- Foundation Token 的单值 `codeName` ownership。
- Package 自定义完整 `audit-rules.json`。
- Source Contract 中的 `figma.stablePluginData`。
- Source Contract 中的 `figma.descriptionMarkdown`。
- Code Mapping 中重复的 `reusePolicy` 与 `missingPolicy`。
- 裸 `state.success` 和未解析的裸 `data.*` 引用。
- 未定义语义的 `contentRegions`。

### 降级为 Optional 或 Readiness-required

- `name`、`description` 由 universally REQUIRED 调整为 FX readiness-required。
- Figma 表示字段仅在 figma-ready 范围 REQUIRED。
- implementation contract 与 verified code mapping 仅在 codex-ready 范围 REQUIRED。
- Decision/Hint/Reference 数组不再要求用空数组满足 Schema-valid。
- 未知事实允许留在 draft，以低 confidence 和明确 reviewStatus 表达。

### Ownership 调整

- Component `implementationContract.reusePolicy` 是唯一复用策略 owner。
- Code Mapping 只引用 implementation contract，并陈述代码匹配事实。
- Foundation 只拥有设计 Token；各 code target 的 `codeName` 由 Token Mapping 拥有。
- Stable ID 与 documentation 是源；Plugin Data 与 descriptionMarkdown 是
  OUTPUT-ONLY 派生物。
- Governance Rule 由外部 Audit Profile 拥有；Package 只拥有 requested Profile
  与候选 exceptions，信任和实际应用结果由外部 evaluator 拥有。

### 新 Readiness Gate

- Schema valid 只检查最小结构、身份和引用语法。
- figma-ready 检查批准状态、Figma representation、Figma required states、
  required Screen State coverage 和 Compiler compatibility。
- codex-ready 按 code target 检查 Data Contract、approved Decision、
  implementation contract、verified/fresh Mapping、Code required states 和
  Handoff 完整性。
- `confidence=exact` 不再被视为人工批准；readiness 以 `reviewStatus` 和 Audit
  Result 为准。

## 27. V2.1 Core Freeze Summary

- **Review trust ownership**：AI/parser/importer 只产生
  `unreviewed/needs-review`；可信 Human Review Action 独占
  `approved/rejected`，并记录 `reviewedBy/reviewedAt/reviewMethod`。对象级批准
  不覆盖 readiness-relevant 字段的未解决 Provenance。
- **Code target ownership**：Component 和 Slot 保持平台中立；
  Component/Slot/Token 的 target-specific 名称、symbol、path、import 与字段映射
  由 `code-mapping.json` 按 `codeTargetRef` 独占。
- **Data mapping**：`dataMappings` 连接 Data Contract 与已有 Type、Model、
  Selector 或 Adapter；verified reuse 与明确 missing policy 防止 Codex 重复建模。
- **Audit trust boundary**：Package 只能请求 Profile 和携带候选 exception；
  Profile ID/version/checksum 与 Human/Governance Action 的可信性由外部 policy /
  registry 验证。
- **Source/output separation**：Source Manifest 只声明
  `requestedReadiness`；evaluation time、gate result、blocking issue、applied
  exception 与实际 Profile result 只属于 OUTPUT `audit.json`。
- **Handoff reproducibility**：`handoff-manifest.json` 固定 Package、Design
  System、code target、repository revision、可信 Audit、readiness 与文件校验
  身份；revision 漂移时必须先复核 Mapping freshness。

### FROZEN CORE

- 现有 Source 文件边界以及 stable ID / reference / provenance 基础合同。
- Foundation、Data Contract、Component、Pattern、Screen Region、Interaction、
  Decision、Hint 和平台中立 implementation contract。
- Component/Slot/Token/Data 的 per-`codeTargetRef` Mapping ownership。
- review trust、Audit trust、Readiness gate 与 Required State Coverage 规则。

### EXTENSION POINTS

- 命名空间化 `extensions`，核心消费者可安全忽略。
- 外部版本化 Audit Profile 与 Trusted Profile Policy。
- 新 code target 的独立 Mapping 集，不反向修改平台中立 Component/Slot。
- 新 Source locator、Reference asset 和 Implementation Hint；不得改变冻结核心
  字段语义。

### OUTPUT-ONLY

- `audit.json`：实际 Profile、evaluation、gate、blocking issue 与 applied
  exception。
- `handoff-manifest.json`：单 code target 的可复现导出身份与 checksums。
- Figma stable Plugin Data、`descriptionMarkdown` 和 Compiler 派生节点元数据。
- Codex `AGENTS.md`、README、审计报告及其他确定性生成文档。
