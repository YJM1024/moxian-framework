# 归档说明

本目录保存历史版本的框架正文，只读，不参与 v2 的判定。

| 目录 | 来源 | 版本 | 说明 |
|---|---|---|---|
| `v1.7.3/` | 本仓 v2 之前的 `docs/` 全量内容 | v1.7.3 | 平铺布局的原样快照，含当时的 README、正文、模板、适配层、验收记录、`plan/` 与 `process/` |
| `v1.7.5/` | 主仓 `docs/framework/archive/v1.7.5/` | v1.7.5 | 十二章正文副本与 `INDEX.md`，是 v2 改写的直接基线 |

两个目录都按搬迁时的字节原样保留，内部链接按各自当时的布局解释，不做回改。查旧号到新规则位的映射用 `docs/framework/MOXIAN.md` 附录 B，不回正文恢复旧号。

## 归档脚本说明

`scripts/` 子目录保存四个 v2.0 门禁脚本。它们按 v2.0 的 `specs/changes/<CHG-ID>/` 布局读文件，v2.1 不再有这些文件，因此只作历史对照，不参与任何检查、放行或发版。脚本字节未改，直接运行会因找不到 v2.0 对象而报错，这是预期行为。

| 脚本 | 原来检查什么 | v2.1 为什么不再需要 | 现在的手工自检 |
|---|---|---|---|
| `check-gates.mjs` | 变更包必须有 spec.md、tasks.md、test-plan.md、evidence.md，首部字段齐全，Covers 编号符合三段式，任务卡与证据索引对得上（MX-G-08 至 MX-G-13） | 这些文件已从变更包取消，规格由六份角色 spec 承担，验收由一份四节报告承担 | 跑 `node scripts/check-spec-language.mjs` 查 spec 语言与引用，再按 `docs/framework/ROLES.md` 人工核对六份角色 spec 的文件集与首部 |
| `check-contract.mjs` | 五列契约表存在、六个类组与固定列名齐全、契约字段与前后端 spec 一致（MX-G-26 至 MX-G-31） | 五列契约表与契约索引已取消，契约由类型定义、接口签名与测试用例承担 | 跑 `node scripts/check-trace.mjs` 查追溯结构；字段一致性由类型检查与接口测试承担，没有单独脚本 |
| `check-evidence.mjs` | 每条 AC 在证据索引里有行，判定值合法，未验证项带原因码，证据路径存在且未过期（MX-G-38 至 MX-G-40） | 证据索引文件已取消，证据只写进验收报告第 2 节的产物路径 | 按验收报告第 2 节逐条打开产物路径确认可访问；追溯编号用 `node scripts/check-trace.mjs`，没有逐条比对证据的脚本 |
| `check-matrix-coverage.mjs` | TASK-MATRIX 的 48 格主矩阵与 18 格附表每格三个字段非空，规则号、模板名与门禁名都能解析（MX-G-59） | GATES.md 不再有门禁矩阵，任务矩阵不再按格子挂门禁 | 按 `docs/framework/TASK-MATRIX.md` 人工核对任务类型与执行要求；没有矩阵覆盖率脚本 |

需要读脚本原文时按 `docs/framework/archive/scripts/<脚本名>.mjs` 打开；不要把它加回 `scripts/`，也不要接入流水线。
