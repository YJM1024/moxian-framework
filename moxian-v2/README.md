# 墨线框架 v2.0.0

墨线是一套面向单机、多智能体协作的规格驱动开发框架。它用中文文档定义流程、角色与判据，把契约、追溯、覆盖率与证据要求写成可检查的条目，供设计、前端、后端与验收角色在同一个代码仓里分头推进需求。v2.0.0 于 2026-11-27 从主仓 simo 的 `docs/framework/` 整体迁入。思墨保留项目门禁，框架正文现由本目录维护。

[返回仓库首页](../README.md)

## 本目录的内容

本目录收录规则册、矩阵、角色、档位、门禁、模板、域增量、适配层，以及 v2 的设计、调研、验收与回滚记录。接入方按自己的项目建立变更包与证据，再引用墨线的条文和判据。

条文中的 `docs/framework/…` 从本 README 所在目录起算。正文入口见[框架导航](docs/framework/README.md)。

## 目录结构

```
moxian-v2/
├─ README.md              本页
├─ VERSION                当前版本号
├─ CHANGELOG.md           v1.0 至 v2.0.0 的版本演进
├─ docs/framework/
│  ├─ MOXIAN.md           总册，九章 158 条规则，附录 A 至 D
│  ├─ TASK-MATRIX.md      八类任务乘六个阶段，66 格
│  ├─ ROLES.md            七个角色的可写范围、禁止事项与交接
│  ├─ EFFORT.md           四档投入与 48 格档位表
│  ├─ GATES.md            门禁条目、规则归位与人工判据
│  ├─ ADOPTION.md         存量项目迁移到 v2 的步骤与判据
│  ├─ ABSORB-RECONCILE.md 吸收对账
│  ├─ README.md           框架入口与导航
│  ├─ VERSION             正文携带的版本号，与本目录 VERSION 一致
│  ├─ domains/            产品设计、前端、后端、测试四个域的增量规则
│  ├─ templates/          31 份产物模板
│  ├─ adapters/           适配层
│  ├─ appendix/           附录 A 模板索引、B 旧号索引、C 修订登记、D 未决项
│  ├─ v2/                 设计、施工、验收、日志、回滚、调研与来源
│  ├─ accept/             历史验收记录
│  ├─ absorb/             吸收记录
│  └─ archive/            历史版本副本，只读
├─ scripts/               v1.7.3 时期的门禁脚本，见“已知边界”
└─ examples/              v1.7.3 时期的参考输入与验收记录
```

`docs/framework/archive/` 下有三份历史副本：`v1.7.3/` 是本仓 v2 之前的全部文档，`v1.7.5/` 是主仓归档的十二章正文副本与索引，`v2-cut-20261127/` 是 2026-11-27 文书削减时撤下的 v2 过程文稿（`IMPLEMENT.md` 与七份来源采集表，去向见 `docs/framework/v2/CUT-PLAN.md`）。三者都按搬迁时的字节原样保留。

## 怎么用

第一次进入先读 `docs/framework/README.md`，它回答每个文件管什么、门禁怎么跑、出问题怎么回滚。之后按五步推进。

1. 判任务类型：读 `docs/framework/TASK-MATRIX.md` 第 3 节，在八类任务中定档，得到该类型的动作、模板与门禁清单；档位按 `docs/framework/EFFORT.md` 取。
2. 建变更包：按 `docs/framework/MOXIAN.md` 第 4 章与第 5 章拆点链、写派单卡，owner 按 `docs/framework/ROLES.md`。
3. 写判据：每个需求点在开工前冻结验收判据，判据写不出脚本形式时按 `docs/framework/GATES.md` 的人工判据四要素记录。
4. 跑门禁：按 `docs/framework/GATES.md` 第 2 节的三个时机执行，汇总入口是接入仓的 `node scripts/verify-all.mjs --stage pre|point|exit`。
5. 验收与回滚：按 `MOXIAN.md` 第 8 章签收，按第 9 章回滚与复盘。

已有项目迁到 v2 时先读 `docs/framework/ADOPTION.md`，它给出迁移步骤、判据与回退方式。旧规则号到新规则位的映射在 `MOXIAN.md` 附录 B，查历史引用用索引，不在正文恢复旧号。

## v2 与 v1.7.5 的关系

v2.0.0 是对 v1.7.5 的结构性重写，不是增量修订。规则册从十三章加附录改为九章加附录 A 至 D，条目从 285 条收到 158 条，改写 203 条、合并 56 条、保留 23 条、删除 3 条，被合并吸收的 118 条不再单独成条。

| 维度 | v1.7.5 | v2.0.0 |
|---|---|---|
| 章数 | 13 章加附录 | 9 章加附录 A 至 D |
| 条数 | 285 条 | 158 条，另附录 D 6 条 |
| 规则编号 | 旧式章号加序号 | 三段式 `MXV2-<章>-<序号>` |
| 规则字段 | 判据与执行混写 | 规则、判据、执行、依据四个字段，层级与适用范围写入执行行 |
| 角色 | 8 个 | 7 个，新增调研员 |
| 状态 | 需求点五档与任务卡五状态并存 | 统一四值：草稿、已冻结、实现中、通过 |
| 门禁 | 名册与逐条判据混排 | 名册保留，判定条件集中到 `GATES.md` |
| 原无判据门禁 | 24 条待建 | 14 条转脚本、10 条转人工，零旁路 |
| 验收层级 | 三层 | 三层不变 |

处理细节写在 `docs/framework/v2/CHANGELOG.md`，迁移步骤写在 `docs/framework/ADOPTION.md`，v1.7.5 原文在 `docs/framework/archive/v1.7.5/`。冻结的验收编号不改名，历史变更包继续有效，未开工任务按新册受理。

## 版本与变更记录

本目录的 [VERSION](VERSION) 记录墨线发布版本，正文随附同值的 [docs/framework/VERSION](docs/framework/VERSION)。[版本记录](CHANGELOG.md) 汇总 v1.0 至 v2.0.0 的演进，[v2 变更记录](docs/framework/v2/CHANGELOG.md) 记录结构性变更与差异摘要。

## 已知边界

`scripts/` 与 `examples/` 是 v1.7.3 的历史脚本与样例，沿用当时平铺的 `docs/` 布局。v2 的二十个脚本（十八道门禁、`check-format.mjs` 格式体检与 `check-contract-coverage.mjs` 合同覆盖补充检查）由接入仓思墨维护。

格式类检查在 v2 里只在 `--stage pre-commit` 跑，`--stage exit` 不判格式，出口判据只剩内容与证据；改动前可先用 `check-format.mjs` 做一次性体检，它只出问题清单，不作为验收打回理由。

`docs/framework/archive/` 下的三份历史副本只读，不参与 v2 的判定，内部链接按各自当时的布局解释。

许可见仓库根目录的 [MIT 许可证](../LICENSE)。
