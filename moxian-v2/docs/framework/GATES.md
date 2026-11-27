# 自检脚本（GATES）

- 版本：v2.1.0
- 定位：框架不设门禁。本文件只登记可选的脚本自检工具，脚本结果不构成放行条件，也不阻断交付。

## 1 放行口径

放行只看两件事：本次变更的功能点都已实现，全量测试（单元、集成、端到端，含存量用例）全部通过。单元与集成覆盖率各不低于 95%，以覆盖率报告为准。文档齐备与否不参与放行判定，也没有 G-01 至 G-14 之类的检查项。

各角色对自己产物自证：产物落盘、证据路径可打开，即由 owner 置「已完成」。项目经理在 `docs/process/FLOW-POINTS.md` 落台账状态，收口时汇总一份四节验收报告 `docs/testing/ACCEPT-<CHG-ID>-<YYYYMMDD>.md`。没有验收角色，没有第二人签字，没有 SIGN 表。

## 2 保留的脚本

本仓 `scripts/` 只保留五个工具，均可单独运行，`--self-test` 自检不读写真实仓库。

| 脚本 | 检查什么 | 自检命令 |
|---|---|---|
| `check-spec-language.mjs` | spec 语言：术语、状态词、可观察验收断言、引用来源 | `node scripts/check-spec-language.mjs --self-test` |
| `check-trace.mjs` | 产品 PRD 的追溯结构：编号、引用路径、上游引用、用例编号 | `node scripts/check-trace.mjs --self-test` |
| `check-incremental-coverage.mjs` | 增量覆盖率报告的读取与阈值判断 | `node scripts/check-incremental-coverage.mjs --self-test` |
| `measure-perf.mjs` | 接口延迟分位数测量 | `node scripts/measure-perf.mjs --self-test` |
| `measure-net.mjs` | 网络延迟、抖动、丢包与带宽测量 | `node scripts/measure-net.mjs --self-test` |

退出码 0 表示脚本自身跑通且样例符合预期；非 0 是工具发现，交给 owner 判断，不作为发版阻断。

## 3 已归档的脚本

四个 v2.0 门禁脚本检查的对象已被 v2.1 取消，移到 `docs/framework/archive/scripts/` 保留，不再运行。

| 脚本 | 归档原因 |
|---|---|
| `check-gates.mjs` | 检查 spec.md、tasks.md、test-plan.md、evidence.md、五列契约索引与任务卡，这些对象都已废止 |
| `check-contract.mjs` | 检查五列契约表与契约索引，v2.1 由角色 spec 的类型、接口签名与测试承担契约 |
| `check-evidence.mjs` | 检查证据索引、判定人与任务卡关联，v2.1 证据只写进验收报告第 2 节的产物路径 |
| `check-matrix-coverage.mjs` | 检查 GATES.md 的门禁矩阵与 MX-G-59，v2.1 不设门禁矩阵 |

## 4 与历史文档的关系

`MX-G-*`、`G-01` 至 `G-14`、C1 至 C10、S1 至 S19 只出现在 `docs/framework/archive/` 与 v2.0 历史记录里，不再出现在现行规则册。查历史引用时按归档原文读，不把旧编号当现行检查项。
