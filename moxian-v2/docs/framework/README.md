# 墨线框架入口

框架版本以根目录 `VERSION` 为准，当前为 `v2.1.0`。本页回答四个问题：每个文件管什么，一次变更怎么走，脚本怎么用，出问题怎么回滚。

## 1 目录与职责

框架顶层九个文件，各自只有一个职责，条文只在 `MOXIAN.md` 写一次。

| 文件 | 职责 | 什么时候读 |
|---|---|---|
| `MOXIAN.md` | 九章规则册，现行 147 条，另有 20 条废止条保留原编号；讲流程点、角色、规格分层、测试、验收与回滚 | 需要规则与验收标准时 |
| `TASK-MATRIX.md` | 八类任务与执行要求 | 任务开工前判类型 |
| `ROLES.md` | 七个角色的可写范围、禁止事项与交接要求 | 派单、交接、自证前 |
| `EFFORT.md` | 四档投入与取档规则 | 派单写档位时 |
| `GATES.md` | 自检脚本索引；框架不设门禁 | 想跑脚本自检时 |
| `ADOPTION.md` | 存量项目迁移到 v2.1 的步骤 | 接入既有项目时 |
| `VERSION` | 当前版本号，一行 | 任何引用版本的地方 |
| `v2/CHANGELOG.md` | 版本变更记录与差异摘要 | 升级、回滚、对外说明时 |
| `README.md` | 本页，入口与导航 | 第一次进入框架时 |

子目录八个：`v2/` 放设计、施工、日志、回滚与来源（35 份）；`adapters/` 放适配层（2 份）；`domains/` 放各域增量（4 份）；`templates/` 放模板（44 份）；`archive/` 放历史版本与归档脚本（100 份）；`appendix/` 放附录（4 份）；`absorb/` 放吸收记录（4 份）；`accept/` 放历史验收记录（24 份）。

## 2 九章与七个角色

九章依次为目的与范围、术语与编号、角色与授权、流程点链、规格分层、规则格式、测试与证据、验收与发布、异常与回滚。现行 147 条，编号形如 `MXV2-4-25`；废止条保留原编号，正文写明失效原因与替代条，不复用空号。

七个角色是产品、设计、架构、前端、后端、测试、项目经理。六个执行者对各自产物自证，产物落盘且证据路径可打开即置「已完成」；项目经理维护 `docs/process/FLOW-POINTS.md`，收口时汇总验收报告，不写 spec、代码与测试，也不做第二人复核。没有验收角色，没有 SIGN 表。

## 3 一次变更怎么走

1. 分配变更号，在 `specs/changes/<CHG-ID>/` 下按角色写 spec：产品写 `product.md`、`design.md`、`frontend.md`、`backend.md`、`test.md`，架构另写 `tech.md`。`proposal.md`、`spec.md`、`tasks.md`、`test-plan.md`、`evidence.md`、`closure.md` 不再进包。
2. 流程点按需求、设计、架构、开发、测试五类成链，状态取未开始、进行中、已完成、阻塞、已取消，记在 `specs/changes/<CHG-ID>/flow-points.md`。
3. 开发前由设计 owner 自检并冻结，冻结提交写进各 spec 首部。
4. 实现与测试阶段跑全量测试，单元与集成覆盖率各不低于 95%，以覆盖率报告为准。
5. 收口由项目经理写一份四节验收报告 `docs/testing/ACCEPT-<CHG-ID>-<YYYYMMDD>.md`：变更集、测试结果产物路径与一行 pass/fail、问题与处置、结论两条。复盘由产品写、项目经理可代写，一份 `docs/plan/RETRO-<YYYYMMDD>-<REQ-ID>.md`，不超过 40 行。

## 4 脚本怎么用

框架不设门禁，`scripts/` 只保留五个自检工具：`check-spec-language.mjs`、`check-trace.mjs`、`check-incremental-coverage.mjs`、`measure-perf.mjs`、`measure-net.mjs`。每个都能单独运行，加 `--self-test` 用内置夹具自检。退出码非 0 时由 owner 判断，不阻断发版。

v2.0 的四个门禁脚本已移到 `docs/framework/archive/scripts/`，不参与现行检查，原因见 `GATES.md` 第 3 节。

## 5 怎么回滚

回滚分四类，先看改动处在哪一层。未提交的单文件改动用 `git restore -- <文件>`；已提交未推送用 `git revert <提交号>`；已推送同样用 `git revert`，不改写历史。运行时开关引起的故障先关开关，再回滚代码。禁止 `git reset --hard`、`git clean -fdx` 与 `git push --force`。回滚后跑一次复验命令，把原因、影响面与恢复时间写进异常记录。

## 6 版本与维护

版本号只有 `VERSION` 一处，变更记录只有 `v2/CHANGELOG.md` 一处，条数口径只有 `MOXIAN.md` 一处。旧版 v1.7.5 的副本在 `archive/v1.7.5/`，只读；v1.7.3 在 `archive/v1.7.3/`。查旧号到新位的索引时按归档原文读，不在现行正文恢复旧号。
