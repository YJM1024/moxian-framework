# 归档自检脚本

这里放 v2.0 时期的门禁脚本，只作历史对照，不参与 v2.1 的任何检查与放行。

| 脚本 | 原用途 | 为什么归档 |
|---|---|---|
| `check-gates.mjs` | 检查变更包文件、首部字段、五列契约索引、任务卡与 Covers | v2.1 不再有 spec.md、tasks.md、test-plan.md、evidence.md、五列契约索引与任务卡 |
| `check-contract.mjs` | 检查五列契约表与契约索引 | v2.1 契约由角色 spec 的类型、接口签名与测试承担 |
| `check-evidence.mjs` | 检查证据索引、判定人、任务卡关联与复跑记录 | v2.1 证据只写进验收报告第 2 节的产物路径 |
| `check-matrix-coverage.mjs` | 检查 GATES.md 的门禁矩阵与 MX-G-59 | v2.1 不设门禁矩阵 |

运行方式只作存档参考：`node docs/framework/archive/scripts/<脚本>.mjs --self-test`。这些脚本按 v2.0 的 `specs/changes/<CHG-ID>/spec.md` 布局读文件，对 v2.1 的六份角色 spec 不适用。
