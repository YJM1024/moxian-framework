# 框架模板目录

版本：v2.1.0，2026-11-27。状态：active。计数：现行 34 份，已废止 8 份（`archive/` 3 份、原地保留 5 份）。

## 1 使用约定

变更 spec 写入 `specs/changes/<CHG-ID>/`，长期 spec 写入 `specs/contract/<域代码>/`，验收报告与复盘写入 `docs/testing/` 与 `docs/plan/`，技术债清单写入 `docs/plan/TECH-DEBT.md`。六份 spec 模板的节标题与 `docs/framework/MOXIAN.md` 第 4 章引用的契约第 2 节逐字一致，序号、空格与标点都不得改动。

每份 spec 首部八个字段固定为：变更号、类型、角色、状态、owner、日期、冻结提交、输入引用；状态只取「草稿」「已冻结」，冻结提交写 7 至 40 位十六进制或在未冻结时留空。`N/A：<理由不少于 8 字>` 只能出现在表 2-1 允许的节，第 1 节不得写 N/A；test.md 第 3、4 节无内容时写「无」。

模板正文只放节标题与表头，填写要求写在每份文件顶部的注释里，注释不进入正文。

## 2 v2.1 新建与重写九份

| 文件 | 用途 | 写者 | 落点 |
|---|---|---|---|
| `spec-product.md` | 产品视角 spec，七节，第 1 节点清单是全集 | 产品 | `specs/changes/<CHG-ID>/product.md` |
| `spec-tech.md` | 技术视角 spec，七节，登记输入与技术债编号 | 架构 | `specs/changes/<CHG-ID>/tech.md` |
| `spec-design.md` | 设计 spec，七节，登记 product.md 的 sha256 | 设计 | `specs/changes/<CHG-ID>/design.md` |
| `spec-frontend.md` | 前端 spec，八节，第 6 节写两项覆盖率 | 架构 | `specs/changes/<CHG-ID>/frontend.md` |
| `spec-backend.md` | 后端 spec，八节，第 6 节写两项覆盖率 | 架构 | `specs/changes/<CHG-ID>/backend.md` |
| `spec-test.md` | 测试 spec，七节，第 6 节执行结果含两项覆盖率 | 测试 | `specs/changes/<CHG-ID>/test.md` |
| `accept.md` | 验收报告，四节，不设行数上限，按功能点分节 | 项目经理 | `docs/testing/ACCEPT-<CHG-ID>-<YYYYMMDD>.md` |
| `RETRO.md` | 复盘，一份，不超过 40 行 | 产品（项目经理可代写） | `docs/plan/RETRO-<YYYYMMDD>-<REQ-ID>.md` |
| `TECH-DEBT.md` | 技术债清单，编号 `DEBT-<NNN>`，架构登记与认领 | 架构 | `docs/plan/TECH-DEBT.md` |

## 3 现行模板（35）

| 文件 | 用途 |
|---|---|
| `spec-product.md` | 产品视角变更的产品 spec |
| `spec-tech.md` | 技术视角变更的技术 spec |
| `spec-design.md` | 设计 spec |
| `spec-frontend.md` | 前端 spec |
| `spec-backend.md` | 后端 spec |
| `spec-test.md` | 测试 spec |
| `accept.md` | 变更验收报告，四节 |
| `RETRO.md` | 复盘，一份，不超过 40 行 |
| `TECH-DEBT.md` | 技术债清单 |
| `a11y-checklist.md` | 可访问性检查清单 |
| `adr.md` | 架构决策记录 |
| `audit-events.md` | 审计事件定义 |
| `cli-contract.md` | 命令行契约 |
| `cli-release-checklist.md` | 命令行发布检查清单 |
| `compliance-disposal-record.md` | 合规处置记录 |
| `component-spec.md` | 组件 spec |
| `dependency-upgrade.md` | 依赖升级清单 |
| `drill-report.md` | 演练报告 |
| `external-dependency.md` | 外部依赖登记 |
| `fp-coverage.md` | 功能点覆盖表 |
| `gray-release.md` | 灰度发布计划 |
| `localization-checklist.md` | 本地化检查清单 |
| `migration-plan.md` | 迁移计划与迁移小节 |
| `offline-sync.md` | 离线与同步方案 |
| `permission-policy-matrix.md` | 权限策略矩阵 |
| `release-signing-checklist.md` | 发布签字清单 |
| `repro.md` | 缺陷复现卡 |
| `runbook.md` | 运行手册 |
| `security-matrix.md` | 安全矩阵 |
| `sharding-plan.md` | 分片方案 |
| `slo.md` | 服务等级目标 |
| `tenant-isolation-checklist.md` | 租户隔离检查清单 |
| `token-change.md` | 令牌变更记录 |
| `visual-baseline.md` | 视觉基线 |

## 4 已废止（8）

| 文件 | 处置 | 原因 |
|---|---|---|
| `archive/accept.md` | 移入 `archive/`，首行标注 v2.0 | v2.0 的七节验收模板，由现行四节 `accept.md` 取代 |
| `archive/delivery.md` | 移入 `archive/`，首行标注 v2.0 | 七节交付报告作废，验收结论并入 `accept.md` |
| `archive/review.md` | 移入 `archive/`，首行标注 v2.0 | v2.1 不设第二人签字与评审门禁，评审问题并入验收报告第 3 节 |
| `change.md` | 原地保留，标注 v2.0 历史 | v2.1 变更包由五份角色 spec 组成，不再有变更总表 |
| `evidence-index.md` | 原地保留，标注 v2.0 历史 | 证据并入验收报告第 2 节测试结果 |
| `task-card.md` | 原地保留，标注 v2.0 历史 | 任务卡与 tasks.md 废止，派单由主会话消息承载 |
| `contract-table.md` | 原地保留，标注 v2.0 历史 | 五列契约表废止，契约由类型定义、接口签名与测试承担 |
| `defect-record.md` | 原地保留，标注 v2.0 历史 | 缺陷根因写入提交信息或 issue，复现写成先失败后转绿的测试 |

## 5 计数口径

现行 34 份 = 沿用 v2.0 的 25 份 + 本次新建或重写 9 份。已废止 8 份 = `archive/` 3 份 + 原地保留 5 份。`archive/` 内文件不参与名册计数之外的任何用途，只在对照 v2.0 历史包时引用，清单见 `archive/README.md`。
