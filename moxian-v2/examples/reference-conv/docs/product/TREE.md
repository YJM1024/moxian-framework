# 司墨产品功能树（TREE）参考节选

> 本文件是主仓 `docs/product/TREE.md` 的 P1 会话域节选，路径按 `examples/reference-conv/` 根目录改写，用于验证 `scripts/check-trace.mjs` 的结构判据。行内容取自 2026-11-23 的主仓版本，未新增功能点。
> L3 功能点编号规则见主仓 `docs/product/ID-SPEC.md`；追溯矩阵见同目录 `TRACEABILITY.md`。

## 1. P1 会话与消息

| L3 功能点 | 名称 | 优先级 | 实现状态 | 覆盖状态 | 产品 spec | 变更 | 测试计划 |
|---|---|---|---|---|---|---|---|
| `PRD-CONV-001` | 会话树与主会话 | P0 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-conv-001) | [CHG-CONV-001](../../specs/changes/CHG-CONV-001/spec.md) | [TC-P1-001](../../specs/test/P1-CONV/test-plan.md#tc-p1-001) |
| `PRD-CONV-002` | 会话生命周期 | P0 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-conv-002) | [CHG-CONV-001](../../specs/changes/CHG-CONV-001/spec.md) | [TC-P1-002](../../specs/test/P1-CONV/test-plan.md#tc-p1-002) |
| `PRD-CONV-003` | 会话搜索与未读 | P1 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-conv-003) | [CHG-CONV-001](../../specs/changes/CHG-CONV-001/spec.md) | [TC-P1-003](../../specs/test/P1-CONV/test-plan.md#tc-p1-003) |
| `PRD-CONV-004` | 消息流与渲染 | P0 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-conv-004) | [CHG-CONV-002](../../specs/changes/CHG-CONV-002/spec.md) | [TC-P1-004](../../specs/test/P1-CONV/test-plan.md#tc-p1-004) |
| `PRD-CONV-005` | 发送·流式·断线重连 | P0 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-conv-005) | [CHG-CONV-003](../../specs/changes/CHG-CONV-003/spec.md) | [TC-P1-006](../../specs/test/P1-CONV/test-plan.md#tc-p1-006) |
| `PRD-CONV-006` | Composer 输入与快捷键 | P0 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-conv-006) | [CHG-CONV-003](../../specs/changes/CHG-CONV-003/spec.md) | [TC-P1-007](../../specs/test/P1-CONV/test-plan.md#tc-p1-007) |
| `PRD-CONV-007` | 祖先消息整级加载 | P1 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-conv-007) | [CHG-CONV-002](../../specs/changes/CHG-CONV-002/spec.md) | [TC-P1-005](../../specs/test/P1-CONV/test-plan.md#tc-p1-005) |
| `PRD-CONV-008` | 右栏会话投影 | P1 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-conv-008) | [CHG-CONV-006](../../specs/changes/CHG-CONV-006/spec.md) | [TC-P1-CONV-008](../../specs/test/P1-CONV/test-plan.md#tc-p1-conv-008) |
| `PRD-CONV-009` | 会话内任务与编排 | P1 | `unimplemented` | `gap` | [spec](../../specs/product/P1-CONV/spec.md#prd-conv-009) | [CHG-CONV-007](../../specs/changes/CHG-CONV-007/spec.md) | [TC-P1-CONV-009](../../specs/test/P1-CONV/test-plan.md#tc-p1-conv-009) |
| `PRD-SYNC-001` | WS 连接与重连 | P0 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-sync-001) | [CHG-CONV-004](../../specs/changes/CHG-CONV-004/spec.md) | [TC-P1-008](../../specs/test/P1-CONV/test-plan.md#tc-p1-008) |
| `PRD-SYNC-002` | 多标签 active/ancestor/read cursor | P0 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-sync-002) | [CHG-CONV-004](../../specs/changes/CHG-CONV-004/spec.md) | [TC-P1-009](../../specs/test/P1-CONV/test-plan.md#tc-p1-009) |
| `PRD-SYNC-003` | 发送模式/设置跨标签同步 | P1 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-sync-003) | [CHG-CONV-004](../../specs/changes/CHG-CONV-004/spec.md) | [TC-P1-010](../../specs/test/P1-CONV/test-plan.md#tc-p1-010) |
| `PRD-SYNC-004` | 未读与已读游标 | P1 | `implemented` | `covered` | [spec](../../specs/product/P1-CONV/spec.md#prd-sync-004) | [CHG-CONV-005](../../specs/changes/CHG-CONV-005/spec.md) | [TC-P1-011](../../specs/test/P1-CONV/test-plan.md#tc-p1-011) |
| **合计** | — | 5 个 L2 组 | **1** | **13** | **12** | **0** | **1** |

> 口径：P1 共 13 个 PRD，12 个 `covered`、1 个 `gap`（`PRD-CONV-009`）。上表“实现状态”与“覆盖状态”分轴统计，与主仓 2026-11-23 的 P1 口径一致；本参考节选只保留 P1，不改变主仓的域总数。
