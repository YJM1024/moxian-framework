# CHG-CONV-007 · 测试计划（变更级）

状态：draft
Change: CHG-CONV-007
Implements: PRD-CONV-009
Covers: AC-CONV-009-01、AC-CONV-009-02、AC-CONV-009-03、AC-CONV-009-04、AC-CONV-009-05、AC-CONV-009-06、AC-CONV-009-07、AC-CONV-009-08、AC-CONV-009-09、AC-CONV-009-10、AC-CONV-009-11、AC-CONV-009-12、AC-CONV-009-13、AC-CONV-009-14、AC-CONV-009-15、AC-CONV-009-16、AC-CONV-009-17、AC-CONV-009-18

## 1. 用例、AC 与证据

18 条 AC 与 `TC-P1-CONV-037..054` 一一对应，脚本入口为本包要求新建的 `scripts/ac/AC-CONV-009-NN.mjs`。W1-04 只填 TC 明细；W4 建脚本并执行前，结果列保持 `missing`，不写“通过”。

| 用例 | AC | 测试落点 | 层级 | 期望 | 结果 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| TC-P1-CONV-037 | `AC-CONV-009-01` | `scripts/ac/AC-CONV-009-01.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-038 | `AC-CONV-009-02` | `scripts/ac/AC-CONV-009-02.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-039 | `AC-CONV-009-03` | `scripts/ac/AC-CONV-009-03.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-040 | `AC-CONV-009-04` | `scripts/ac/AC-CONV-009-04.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-041 | `AC-CONV-009-05` | `scripts/ac/AC-CONV-009-05.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-042 | `AC-CONV-009-06` | `scripts/ac/AC-CONV-009-06.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-043 | `AC-CONV-009-07` | `scripts/ac/AC-CONV-009-07.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-044 | `AC-CONV-009-08` | `scripts/ac/AC-CONV-009-08.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-045 | `AC-CONV-009-09` | `scripts/ac/AC-CONV-009-09.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-046 | `AC-CONV-009-10` | `scripts/ac/AC-CONV-009-10.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-047 | `AC-CONV-009-11` | `scripts/ac/AC-CONV-009-11.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-048 | `AC-CONV-009-12` | `scripts/ac/AC-CONV-009-12.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-049 | `AC-CONV-009-13` | `scripts/ac/AC-CONV-009-13.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-050 | `AC-CONV-009-14` | `scripts/ac/AC-CONV-009-14.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-051 | `AC-CONV-009-15` | `scripts/ac/AC-CONV-009-15.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-052 | `AC-CONV-009-16` | `scripts/ac/AC-CONV-009-16.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-053 | `AC-CONV-009-17` | `scripts/ac/AC-CONV-009-17.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |
| TC-P1-CONV-054 | `AC-CONV-009-18` | `scripts/ac/AC-CONV-009-18.mjs` | HTTP / 组件 / CDP | 全部断言通过，无 fail 与 skip | missing（脚本未建） | 用例明细待 W1-04 填充 |

## 2. 数据与 mock

夹具：10 个任务批量 `.tmp/chg-conv-007/batch-10.json`、20 条历史会话 `.tmp/chg-conv-007/context.json`、8 节点任务图与失败下游、三种等待语义的依赖链。`P2-TASK` 与 `P4-FILE` 未就绪时按 `spec.md` §8 风险 1 用接口桩，桩数据路径写进证据。

## 3. 层级与接线

HTTP 组覆盖任务消息字段、归属 403/404、交付物 `size`；单元组件组覆盖任务卡片、右栏三标签、厚卡、详情、任务图；CDP 组覆盖 40/320/280 几何、首行 0–8px、三档断点与截图。三组通过 `scripts/run-ac.mjs` 分组执行，CDP 组排队。

## 4. 未覆盖与不跳过声明

任务执行器与生命周期状态机归 `P2-TASK`，交付物落盘与类型识别归 `P4-FILE`，登录与鉴权模型归 P8，均不在本包实现。真实厂商链路不可用时只验证本地取消与状态投影，并在证据中标注环境限制。以上缺项如实记录，不用 skipped 或推断替代通过。
