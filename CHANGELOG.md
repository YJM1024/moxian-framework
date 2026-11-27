# 变更记录

本文件汇总墨线框架从 v1.0 到 v2.0.0 的版本演进。v1.x 条目取自源仓 `docs/framework/README.md` 的版本说明与 `docs/framework/MOXIAN.md` 附录 D 表 D-2，v2.0.0 条目取自 `docs/framework/v2/CHANGELOG.md` 与本次迁移记录，日期沿用原记录，均为 2026 年。

## v2.0.0（2026-11-27）

框架正文迁入独立仓的版本。规则册从十三章加附录改为九章加附录 A 至附录 D，条目从 285 条收到 158 条：改写 203 条、合并 56 条、保留 23 条、删除 3 条，118 条被吸收后不再单独成条；每条改为规则、判据、执行、层级、依据、适用六字段，执行字段取 `script:` 或 `ai-review:` 两种写法。角色从 8 个收到 7 个并新增调研员，需求点与任务卡的状态统一为草稿、已冻结、实现中、通过四值。原无判据的 24 条门禁全部归位，14 条转脚本、10 条转人工，零旁路；门禁脚本共 18 个。旧号到新位的索引写在总册附录 B，存量变更包继续有效，迁移步骤见 `docs/framework/ADOPTION.md`。

仓结构同期调整：v2 之前的文件整体移入 `docs/framework/archive/v1.7.3/`，主仓归档的十二章副本落在 `docs/framework/archive/v1.7.5/`，v2 正文按主仓原路径放在 `docs/framework/` 下，条文里的 `docs/framework/…` 自引用因此不再需要换算。`VERSION` 升到 `v2.0.0`。v1.7.3 时期随仓的 `scripts/` 与 `examples/` 原样保留，v2 正文不依赖它们。

同日按 `docs/framework/v2/CUT-PLAN.md` 削减文书：v2 过程文档从 17 件收到 12 件，`IMPLEMENT.md` 全文并入 `DESIGN.md` 的「怎么实施」节，七份来源采集表合订为 `sources/SOURCES-RAW.md`，变更包六件并两件，域规则从 244 条降到 110 条，规则字段从六字段收到四字段。撤下的文稿存 `docs/framework/archive/v2-cut-20261127/`。格式类检查移出验收、只在 `--stage pre-commit` 跑，并新增 `check-format.mjs` 与 `check-contract-coverage.mjs` 两份补充检查。

## v1.7.3（2026-11-25）

维护版。推理档位口径按 DEC-34 收窄：`max` 只保留变更级整线签发、P0 级根因裁定、框架版本冻结与独立验收、跨变更架构裁决四类场合，单卡实现、日常验收复核、规格冻结与契约复核、修复复查与文档体系整改改取 `high`；`EFFORT.md` 主表 48 格由 max 19 / high 24 / low 4 / off 1 改为 max 4 / high 39 / low 4 / off 1，P0 出现时可按 MX-E-02 临时升档。`ROLES.md` 表 1 与第 14 节、`GATES.md` MX-G-49、`TASK-MATRIX.md` 变更记录、`MOXIAN.md` 第 4 章与 MX-7-08 同步，两份模板与 DeepSeek 适配层措辞同批修改。章级规则 284 条、角色规则 42 条、门禁规则 68 条与编号均未变，四道门禁实跑全 PASS（结构 120 项、矩阵 66/66、契约 7/7、追溯 684 项）。本轮为维护性口径调整，不单写验收报告。

独立仓同步把推理档位口径涉及的 11 个文档覆盖到 `docs/`，`VERSION` 升到 `v1.7.3`；没有新增验收报告，`docs/accept/` 保持原样。

## v1.7.2（2026-11-25）

v1.7.1 补登版。`GATES.md` 第 3.4.1 节补字段类型一致性、契约表缺格、任务状态机中文状态映射与前端维度契约行四项检查，`MX-G-27` 与 `MX-G-28` 在前端维度按真实字段、状态集合与迁移记录比对；组件 spec 模板 `templates/component-spec.md` 补登为矩阵名册模板；语言门禁补 R2 无量纲豁免、R5 缩写已定义视为引用与 R7 判据映射行不计重复定义三类误报规则；矩阵模板引用覆盖 102/102，提示归零。章级规则 284 条、角色规则 42 条、门禁规则 68 条与编号均未变。四个门禁脚本自检变为 15、29、26 与 17 条，六个脚本合计 112 条；源仓实跑 `check-gates.mjs` 120 项、契约门禁 7/7、矩阵覆盖率 66/66、spec 语言 0 error 与 0 warning、`check-trace.mjs` 684 项，五条主命令退出码均为 0；证据门禁仍报 1497 error 与 8 warning，属存量缺口，按验收报告登记，未改判通过。

独立仓同步把 `docs/framework/` 的 72 个文件覆盖到 `docs/`，新增 `docs/accept/ACCEPT-MOXIAN-V172-20261125.md` 与 `docs/templates/component-spec.md`，更新 11 份文档、4 个门禁脚本与 `VERSION`；参考输入的前端 spec 同步任务展示态与迁移表。实跑结果为结构门禁 42 项通过、0 项失败、57 条 warning，追溯门禁 188 项、失败 0，契约门禁 7 项通过、0 项失败、2 条提示，语言门禁 0 error、0 warning，矩阵覆盖率 66/66、0 条提示，九条自检全部退出码 0。

v1.7.2 于 2026-11-25 通过独立验收，验收人 `mx-accept-v172`，结论 pass，原因码不适用（pass 不写原因码），前两轮判 partial 的空表静默跳过与行号偏移已消解，报告见 `accept/ACCEPT-MOXIAN-V172-20261125.md`。

## v1.7.1（2026-11-25）

v1.7 维护版。`GATES.md` 第 3.4.1 节新增 `N/A：<类别>：<理由>` 声明规则，适用于前端字段、设计状态与前端状态三类缺失声明，只影响 MX-G-27 与 MX-G-28 的提示级判定，error 级判定不受影响；章级规则 284 条、角色规则 42 条、门禁规则 68 条与编号均未变。四个门禁脚本同步修订：`check-gates.mjs` 接受历史包两段式 Covers 编号，`check-contract.mjs` 实现 N/A 声明，`check-matrix-coverage.mjs` 补 ADR 与复现记录模板名册，`check-spec-language.mjs` 修正 R3 与 R7 判定；四脚本自检分别为 15、18、22 与 10 条，合计 65 条，全部退出码 0。P2 与 P4 的产品 spec 已按 `f478185` 恢复，41 处状态码改写与 40 条 AC 断言位序变化不再存在。源仓实跑结果为 `check-trace.mjs` 684 项、矩阵覆盖率 66/66（2 条提示）、契约门禁 7/7（0 条提示）、`check-gates.mjs` 120 项（0 条提示）、spec 语言 0 error 与 59 warning，退出码均为 0。

独立仓同步把 `docs/framework/` 的 70 个文件全量覆盖到 `docs/`，新增 v1.7.1 验收报告、`docs/process/RUNBOOK.md` 与源仓 `docs/plan/DECISIONS.md`；四个门禁脚本按独立仓布局改写后更新，参考输入同步契约表与 P1-CONV 四列 spec。实跑结果为矩阵覆盖率 66/66（2 条提示）、契约门禁带 `--root examples/reference-conv` 7/7（0 条提示）、`check-gates.mjs` 自检 15 条、`check-spec-language.mjs` 自检 10 条、`check-trace.mjs` 自检 11 条，退出码均为 0；框架仓没有产品输入，追溯、结构与语言三道门禁的裸跑按 README 已知遗留记录。

v1.7.1 于 2026-11-25 通过独立验收，验收人 `mx-accept-v171`，结论 pass，原因码不适用（MX-3-13），前轮 R-MANUAL、R-SPEC、R-SCRIPT 三条已消解，报告见 `accept/ACCEPT-MOXIAN-V171-20261125.md`。

## v1.7（2026-11-25）

v1.6 修订版。`ROLES.md` 补 MX-R-42 术语别名，「验收 Agent」「验收者」「acceptance agent」均指验收角色，流程文档只使用正式名「验收」，角色规则由 41 条增至 42 条；章级规则总数保持 284 条，门禁规则保持 68 条。`docs/framework/` 与 `docs/process/` 的 36 个文件完成术语统一，同时把「变更发起人」「变更提出方」统一为「产品」，absorb 目录与历史验收报告按原文保留。`MOXIAN.md` 表 5-3 的推进人改为「产品」；`GATES.md` 第 8 行增「与历史文档的关系」声明，明确 `docs/process/RUNBOOK.md` 的七个阶段与 `R-1` 至 `R-7` 是 v0.9 之前的旧划分，RUNBOOK 只作历史记录；`RUNBOOK.md` 标 superseded。新增弱网测量脚本 `scripts/measure-net.mjs`，自检 33 项；`docs/domains/testing.md` 第 5 节改为三档测量口径，`templates/offline-sync.md` 升 v1.1。三个门禁脚本补自检计数输出：`check-gates.mjs` 12 条、`check-spec-language.mjs` 8 条、`check-contract.mjs` 14 条。四个域规范升 v1.7。验收报告见 `accept/ACCEPT-MOXIAN-V17-20261125.md`。

独立仓同步把 `docs/framework/` 的 69 个文件全量覆盖到 `docs/`，新增 v1.7 验收报告，并同步 7 个变更包 spec 的首部字段与两份历史验收报告的改动；四个门禁脚本按独立仓布局改写后更新，新增 `measure-net.mjs`。实跑结果为矩阵覆盖率 66/66（7 条提示）、契约门带 `--root examples/reference-conv` 7/7、`check-trace.mjs` 自检 11 条通过，其余脚本自检全部 PASS。

v1.7 于 2026-11-25 通过独立验收，验收人 `mx-accept-v17`，结论 pass，报告见 `accept/ACCEPT-MOXIAN-V17-20261125.md`。

## v1.6（2026-11-25）

框架版本收口，规则总数保持 284 条，角色 41 条，门禁 21 道、68 条门禁规则，十三章与附录 A 至 D 的结构不变。四处口径统一：可观测性字段由五项补为六项，插件市场审核补审核人、申诉受理人与复核人三条人员分离，复核与验收分工统一为复核人出结论、验收签最终判定，审核事件模板升 v1.1 并按三角色改写示例。12 份专项模板随版登记，分别是 repro、adr、visual-baseline、offline-sync、dependency-upgrade、sharding-plan、gray-release、slo、drill-report、external-dependency、security-matrix 与 audit-events；新增性能测量脚本 `measure-perf.mjs`，自检 34 项。25 个任务乘七类口径的覆盖率复判达到 175/175，独立验收判 pass，签字见 `accept/ACCEPT-MOXIAN-V16-20261125.md`。

独立仓同步把 `docs/framework/` 的 68 个文件全量覆盖到 `docs/`，新增 v1.6 验收报告、`STRESS-RERUN-25-20261125.md` 与 12 份模板；七个门禁脚本更新，其中五个按独立仓布局改写 `docs` 路径，并加入 `measure-perf.mjs`。实跑结果为矩阵覆盖率 66/66、门禁引用 96/96，契约门 7/7。

## 独立仓初始化（2026-11-25）

把冻结的 v1.5 从源仓抽取为独立仓库。`docs/framework/` 的 54 个文件复制到 `docs/`，正文未改；七个门禁脚本沿用，其中五个改写 `docs` 路径；补入矩阵引用的七份 process 模板与 ADR 落点占位；附两份验收报告与 P1-CONV 契约参考输入。框架规则、判据与版本号均未改。

## v1.5（2026-11-25）

冻结评审 26 项落实，其中组一 6 项、组二 9 项、组三 9 项、收口 2 项。原因码补 `R-DRILL` 七值，新增安全评审人 MX-R-39 与发布负责人分工；数据迁移写全四种处置；发布与插件门禁接入；运行手册扩为六项，并写入 60 秒观测窗口、命令层与文档校验、证据登记表两列、契约表落地。规则总数保持 276 条，U-14 保留，分支标记 `mx-freeze-15`。

## v1.4（2026-11-24）

第二阶段压测第一组 32 条缺口落实。契约表由八类扩为十一类，补充租户与授权、数据分布、本地化、发布与签名、合规处置及验收判据；新增 19 条规则，改动第 4、5、6、7、9、10、11、12 章与附录 A、B、D 及九张表。U-13 新增，分支标记 `mx-s2-fix-a`。

## v1.3（2026-11-24）

三份复测报告的残余缺口落实。兼容门统一为对外契约字段双向、内部实现允许单向并登记理由；MX-9-25 合并为唯一抽样口径；MX-5-23 的数据 owner 按 `ROLES.md` MX-R-33 指派；MX-6-17 与 MX-8-06 的根因记录改指 defect-record 第 3 节；表 B-3 的兼容门与文档校验门改为引用。无新增未决点，分支标记 `mx-gap-final`。

## v1.2（2026-11-24）

第四批验收必修项落实。六类原因码统一为 `R-*`；证据定为十五字段与六类型；任务卡四值与十八项；契约表字段对齐；根因确认门纳入附录 B；新增 MX-4-18。未实现的四条门禁规则登记为 U-12，分支标记 `mx-fix-b4`。

## v1.1（2026-11-24）

走查报告的 16 条缺口落实。改动第 2、4、5、6、7、8、9、10 章与附录 B、D，新增 6 条规则，修订 10 条条款与两张表；六项冲突裁决见总册 D.4。未决点扩为 U-01 至 U-11，分支标记 `mx-walk-fix`。

## v1.0（2026-11-24）

首次全文合入。第 1 至 13 章与附录 A 至 D 成文；附录 A 补登六个条目，附录 B 对齐六道检查门禁，两份草稿计划移入隔离目录。六条冲突裁决全部落实并拆为七个落点，见表 D-3；U-01、U-03、U-06 关闭，其余保留。分支标记 `mx-merge-book`。
