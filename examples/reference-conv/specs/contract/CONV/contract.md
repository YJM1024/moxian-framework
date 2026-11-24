# CONV 域契约表

状态：草稿
版本：v0.1
冻结日期：—
owner：产品、设计、前端、后端、测试与验收（见 specs/changes/CHG-CONV-007/spec.md:9）
变更单号：CHG-CONV-006、CHG-CONV-007（草稿未冻结）
域：CONV
存放路径：specs/contract/CONV/contract.md
依据：docs/framework/templates/contract-table.md v1.3；scripts/check-contract.mjs 六类
覆盖：CHG-CONV-006 的 33 条 AC 与 CHG-CONV-007 的 18 条 AC，共 51 条
最后更新：2026-11-25

本表按 `scripts/check-contract.mjs` 校验的六类（数据形状、状态机、错误码、事件与消息、界面几何与选择器、验收入口）建模。模板第 7–11 类（设计令牌、命令行契约、数据分布、租户与授权、发布与签名）本次变更不涉及，未建。表首字段供脚本读取，状态取 `草稿`，待前端、后端、测试三列实现并冻结后再改 `冻结`。

## 五列对应

产品、设计、前端、后端、测试五列各一行，指向本域真实文件与章节；契约项编号与下文六类表一致。

| 列 | 文件 | 章节与行号 | 对应契约项 | 判据锚点 |
|---|---|---|---|---|
| 产品 | `specs/product/P1-CONV/spec.md` | §4.1–§4.6，AC 定义 74–366 行 | CT-CONV-001 至 CT-CONV-451 | 51 条 AC 编号与判据原文 |
| 设计 | `specs/design/P1-CONV/spec.md` | §17 从 758 行起；§17.2.1 尺寸、§17.12 视觉判据 | CT-CONV-301 至 CT-CONV-305 | 面板 280、竖条 40、整栏 320、面板头 44、面板脚 28 |
| 前端 | `specs/frontend/P1-CONV/spec.md` | §17，1010–1448 行；选择器表 1051–1057，AC 表 1022–1039 | CT-CONV-301 至 CT-CONV-305、CT-CONV-440 至 CT-CONV-451 | 五个右栏选择器与 009 的 18 条断言 |
| 后端 | `specs/backend/P1-CONV/spec.md` | §17 从 760 行起；§14 685–723，§17.10 1189–1204，§17.12 1222–1243 | CT-CONV-001 至 CT-CONV-206 | N1–N9 字段、39 个错误码、6 个 WS 事件、009 后端判据 |
| 测试 | `specs/test/P1-CONV/test-plan.md` | AC→TC 映射矩阵 126–183 行；TC-P1-CONV-001..054 | CT-CONV-401 至 CT-CONV-451 | 33 条 pass 与 18 条 missing 的 TC 编号 |

## 类 1 数据形状

字段名为 N1–N9 契约里实际出现的字段，来源均为后端 §17.4 的请求/响应表。`§17.2` 的建表说明不在本表重复，只列接口形状。

| 编号 | 概念 | 实体或端点 | 字段路径 | 类型 | 可空 | 默认值 | 枚举取值或边界 | 来源 |
|---|---|---|---|---|---|---|---|---|
| CT-CONV-001 | 任务创建请求 | `POST /api/sessions/{id}/tasks` | `mode` | string | 否 | `plan` | plan 或 explore | 后端 §17.4.1 N1 请求体 |
| CT-CONV-002 | 任务创建请求 | `POST /api/sessions/{id}/tasks` | `goal` | string | 否 | 空串 | 非空文本 | 后端 §17.4.1 N1 请求体 |
| CT-CONV-003 | 任务创建请求 | `POST /api/sessions/{id}/tasks` | `inputs` | string[] | 否 | `[]` | 字符串数组 | 后端 §17.4.1 N1 请求体 |
| CT-CONV-004 | 任务创建请求 | `POST /api/sessions/{id}/tasks` | `constraints` | string[] | 否 | `[]` | 字符串数组 | 后端 §17.4.1 N1 请求体 |
| CT-CONV-005 | 任务创建请求 | `POST /api/sessions/{id}/tasks` | `tasks` | object[] | 否 | 无 | 非空数组 | 后端 §17.4.1 N1 请求体 |
| CT-CONV-006 | 任务创建请求 | `POST /api/sessions/{id}/tasks` | `clientMutationId` | string | 否 | 空串 | 会话内唯一 | 后端 §17.4.1 N1 请求体 |
| CT-CONV-007 | 任务创建响应 | `POST /api/sessions/{id}/tasks` | `ok` | bool | 否 | `true` | 恒为 true | 后端 §17.4.1 N1 201 响应 |
| CT-CONV-008 | 任务创建响应 | `POST /api/sessions/{id}/tasks` | `batchId` | string | 否 | 无 | batch- 前缀 | 后端 §17.4.1 N1 201 响应 |
| CT-CONV-009 | 任务创建响应 | `POST /api/sessions/{id}/tasks` | `messageId` | string | 否 | 无 | 消息 id | 后端 §17.4.1 N1 201 响应 |
| CT-CONV-010 | 任务创建响应 | `POST /api/sessions/{id}/tasks` | `counts` | object | 否 | 五键整数 | 五键整数 | 后端 §17.4.1 N1 201 响应 |
| CT-CONV-011 | 任务创建响应 | `POST /api/sessions/{id}/tasks` | `idempotent` | bool | 否 | `false` | 布尔 | 后端 §17.4.1 N1 201 响应 |
| CT-CONV-012 | 任务列表响应 | `GET /api/sessions/{id}/tasks` | `total` | number | 否 | `0` | 整数 | 后端 §17.4.1 N2 响应 |
| CT-CONV-013 | 任务列表响应 | `GET /api/sessions/{id}/tasks` | `hasMore` | bool | 否 | `false` | 布尔 | 后端 §17.4.1 N2 响应 |
| CT-CONV-014 | 任务列表响应 | `GET /api/sessions/{id}/tasks` | `nextBefore` | string | 是 | 空串 | 任务 id 或空串 | 后端 §17.4.1 N2 响应 |
| CT-CONV-015 | 任务详情响应 | `GET /api/sessions/{id}/tasks/{taskId}` | `task` | object | 否 | 无 | 任务投影对象 | 后端 §17.4.1 N3 响应 |
| CT-CONV-016 | 任务详情响应 | `GET /api/sessions/{id}/tasks/{taskId}` | `steps` | object[] | 否 | `[]` | 步骤数组 | 后端 §17.4.1 N3 响应 |
| CT-CONV-017 | 任务详情响应 | `GET /api/sessions/{id}/tasks/{taskId}` | `currentStepId` | string | 否 | 空串 | 步骤 id 或空串 | 后端 §17.4.1 N3 响应 |
| CT-CONV-018 | 任务详情响应 | `GET /api/sessions/{id}/tasks/{taskId}` | `traces` | object[] | 否 | `[]` | 轨迹数组 | 后端 §17.4.1 N3 响应 |
| CT-CONV-019 | 任务详情响应 | `GET /api/sessions/{id}/tasks/{taskId}` | `deliverables` | object[] | 否 | `[]` | 交付物数组 | 后端 §17.4.1 N3 响应 |
| CT-CONV-020 | 任务详情响应 | `GET /api/sessions/{id}/tasks/{taskId}` | `context` | object | 否 | 历史计数为零 | 目标、输入、约束与历史计数 | 后端 §17.4.1 N3 响应 |
| CT-CONV-021 | 任务详情响应 | `GET /api/sessions/{id}/tasks/{taskId}` | `budget` | object | 否 | 见 N3 | 预算对象 | 后端 §17.4.1 N3 响应 |
| CT-CONV-022 | 任务取消响应 | `POST /api/sessions/{id}/tasks/{taskId}/cancel` | `cancelled` | string[] | 否 | `[]` | 任务 id 数组 | 后端 §17.4.1 N4 响应 |
| CT-CONV-023 | 任务取消响应 | `POST /api/sessions/{id}/tasks/{taskId}/cancel` | `changed` | bool | 否 | `false` | 布尔 | 后端 §17.4.1 N4 响应 |
| CT-CONV-024 | 任务图响应 | `GET /api/sessions/{id}/tasks/graph` | `nodes` | object[] | 否 | `[]` | 节点数组 | 后端 §17.4.1 N8 响应 |
| CT-CONV-025 | 任务图响应 | `GET /api/sessions/{id}/tasks/graph` | `edges` | object[] | 否 | `[]` | 边数组 | 后端 §17.4.1 N8 响应 |
| CT-CONV-026 | 任务图响应 | `GET /api/sessions/{id}/tasks/graph` | `layers` | object[] | 否 | `[]` | 层数组 | 后端 §17.4.1 N8 响应 |
| CT-CONV-027 | 交付物列表响应 | `GET /api/sessions/{id}/deliverables` | `groups` | object[] | 否 | `[]` | 分组数组 | 后端 §17.4.1 N9 响应 |
| CT-CONV-028 | 交付物列表响应 | `GET /api/sessions/{id}/deliverables` | `files` | object[] | 否 | `[]` | 文件数组 | 后端 §17.4.1 N9 响应 |
| CT-CONV-029 | 交付物列表响应 | `GET /api/sessions/{id}/deliverables` | `fileCount` | number | 否 | `0` | 整数 | 后端 §17.4.1 N9 响应 |

## 类 2 状态机

任务状态以后端 §17.3 的 8 个存储态为准，展示态 4 个。状态名用产品 §4.6 的中文展示名，英文存储值放在备注列；原因是设计 spec 与前端 spec 目前都没有任务状态矩阵（`PRD-CONV-009` 未实现），把英文 token 写成契约会给 MX-G-28 制造无对应方的声明。待两列补矩阵后，再把存储值转为契约 token。

| 编号 | 对象 | 状态取值全集 | 从状态 | 到状态 | 触发者 | 条件与副作用 | 非法迁移错误码 | 备注（不上机比对） |
|---|---|---|---|---|---|---|---|---|
| CT-CONV-030 | 任务 | 未开始、排队、进行中、已完成、失败、已取消、已中断、阻塞 | — | — | — | 展示态映射：已完成→已完成，进行中→进行中，未开始→未开始，失败、已取消、已中断→失败，阻塞→未开始（仅旧库兼容） | task_state_conflict | 存储值 pending、queued、running、done、failed、cancelled、interrupted、blocked |
| CT-CONV-031 | 任务 | 未开始、排队 | 未开始 | 排队 | 系统 | 全部入边按 join_mode 满足并取得并发槽；清空等待原因 | task_state_conflict | pending→queued |
| CT-CONV-032 | 任务 | 未开始、已取消 | 未开始 | 已取消 | 用户、系统 | 取消作用于该任务或整链；失败原因写已取消；下游保持未开始 | task_state_conflict | pending→cancelled |
| CT-CONV-033 | 任务 | 排队、进行中 | 排队 | 进行中 | 系统 | 执行器领取；开始时间若为空则写入 | task_state_conflict | queued→running |
| CT-CONV-034 | 任务 | 排队、已取消 | 排队 | 已取消 | 用户、系统 | 同未开始到已取消；不产生步骤启动 | task_state_conflict | queued→cancelled |
| CT-CONV-035 | 任务 | 进行中 | 进行中 | 进行中 | 系统 | 只改等待原因：等待确认或等待资源；不改状态与进度 | task_state_conflict | running→running |
| CT-CONV-036 | 任务 | 进行中、已完成 | 进行中 | 已完成 | 智能体 | 全部步骤完成；进度到满、写完成时间、清空失败原因 | task_state_conflict | running→done |
| CT-CONV-037 | 任务 | 进行中、失败 | 进行中 | 失败 | 智能体、系统 | 执行器报错或步骤失败；写最近一条原因与完成时间 | task_state_conflict | running→failed |
| CT-CONV-038 | 任务 | 进行中、已取消 | 进行中 | 已取消 | 用户、系统 | 取消在 5 秒内生效；未完成步骤回未开始，已完成步骤保留 | task_state_conflict | running→cancelled |
| CT-CONV-039 | 任务 | 失败、排队 | 失败 | 排队 | 用户 | 显式重试；尝试次数加一、步骤重置、清空失败原因、轨迹保留 | task_state_conflict | failed→queued |
| CT-CONV-040 | 任务 | 已取消、排队 | 已取消 | 排队 | 用户 | 显式重试；规则同失败到排队 | task_state_conflict | cancelled→queued |
| CT-CONV-041 | 任务 | 已中断、排队 | 已中断 | 排队 | 用户 | 显式重试；规则同失败到排队 | task_state_conflict | interrupted→queued |

补充：终态任务再次取消返回 200 且 `changed=false`，不构成非法迁移；重试只接受失败、已取消、已中断，其余状态返回 409 `task_state_conflict`。等待原因三种为等待依赖（未开始）、等待确认（进行中）、等待资源（进行中），均无系统超时；依赖连接三种 `all`、`any`、`each` 的启动次数见产品 §4.6 与后端 §17.3.4。

## 类 3 错误码

覆盖后端 §14 总表与 §17.10 新增表的全部小写错误码，按同一 HTTP 逐条列全；`R4_CONFIRM_REQUIRED` 为大写保护性占位，不属于契约码，未列入。

| 编号 | 码值 | HTTP | 触发条件 | 响应附加字段 | 是否泄露存在性 | 客户端动作 |
|---|---|---|---|---|---|---|
| CT-CONV-101 | `bad_request` | 400 | 通用参数错误：非法 JSON、空文本、超长文本、非法 pinned、未知 WS 帧 | 无 | 不适用 | 提示可读原因并保留输入 |
| CT-CONV-102 | `forbidden` | 403 | 通用禁止：debug 端点非本机、动作层破坏性操作 | 无 | 不泄露 | 不重试，提示需确认或无权限 |
| CT-CONV-103 | `not_found` | 404 | 通用资源不存在 | 无 | 不泄露 | 刷新列表，不乐观删除 |
| CT-CONV-104 | `conflict` | 409 | 已归档改名或新建子会话、归档父下新建 | 无 | 不适用 | 提示已归档只读并引导恢复 |
| CT-CONV-105 | `body_too_large` | 413 | 请求体超过接口上限或上传体超限 | 无 | 不适用 | 截断或拆分，不原样重试 |
| CT-CONV-106 | `internal` | 500 | 未分类服务端错误 | 无 | 不适用 | 展示错误，可重试 |
| CT-CONV-107 | `unsupported_media_type` | 415 | Content-Type 不受支持 | 无 | 不适用 | 检查 Content-Type |
| CT-CONV-108 | `unavailable` | 503 | 服务依赖不可用 | 无 | 不适用 | 退避重试 |
| CT-CONV-109 | `archive_blocked` | 409 | 有排队或运行中任务，或验收键缺证据 | `blockers[]` | 不适用 | 展示 blockers，解除后重试 |
| CT-CONV-110 | `main_session_protected` | 409 | 对主会话执行归档 | 无 | 不泄露 | 不提供归档入口 |
| CT-CONV-111 | `session_archived` | 409 | 向归档会话发消息 | 无 | 不适用 | 切只读态，先恢复 |
| CT-CONV-112 | `session_not_found` | 404 | 会话 id 不存在；草稿物化竞态 | 无 | 不泄露 | 刷新树并切回主会话 |
| CT-CONV-113 | `invalid_session` | 400 | 会话 id 为空 | 无 | 不适用 | 修正请求 |
| CT-CONV-114 | `invalid_scope` | 400 | scope 不是 all 或空 | 无 | 不适用 | 只用 scope=all 或省略 |
| CT-CONV-115 | `messages_too_many` | 413 | 会话可见消息超过上限 | 无 | 不适用 | 提示分页或拆分 |
| CT-CONV-116 | `edit_disabled` | 400 | 任意消息编辑或修正 | 无 | 不适用 | 隐藏编辑入口，只读展示 |
| CT-CONV-117 | `mutation_in_progress` | 409 | 同一 clientMutationId 首请求未完成 | 无 | 不适用 | 稍后重试，不换 id 重发 |
| CT-CONV-118 | `invalid_task_limit` | 400 | 任务分页参数非整数或越界 | 无 | 不适用 | 钳制或改用默认值 |
| CT-CONV-119 | `invalid_attachment` | 400 | 附件不存在或不属于该会话 | 无 | 不泄露 | 重新上传或移除附件 |
| CT-CONV-120 | `too_many_attachments` | 400 | 附件数量超过上限 | 无 | 不适用 | 删减附件 |
| CT-CONV-121 | `file_too_large` | 413 | 单附件超过上限 | 无 | 不适用 | 压缩或拆分 |
| CT-CONV-122 | `invalid_path` | 400 | 附件路径非法 | 无 | 不适用 | 重新上传 |
| CT-CONV-123 | `upload_not_found` | 404 | 附件 id 或文件不存在 | 无 | 不泄露 | 重新上传 |
| CT-CONV-124 | `invalid_multipart` | 400 | 上传不是合法 multipart/form-data | 无 | 不适用 | 修正上传请求 |
| CT-CONV-125 | `missing_file` | 400 | 上传缺少 file 字段 | 无 | 不适用 | 补齐字段 |
| CT-CONV-126 | `invalid_argument` | 400 | 请求体非法 JSON 或取值非法 | 无 | 不适用 | 修正请求 |
| CT-CONV-127 | `team_not_found` | 404 | 团队 id 不存在 | 无 | 不泄露 | 刷新团队列表 |
| CT-CONV-128 | `invalid_sandbox` | 400 | 权限设置取值非法 | 无 | 不适用 | 回到合法枚举 |
| CT-CONV-129 | `confirmation_required` | 400 | 切 danger-full-access 未带确认 | 无 | 不适用 | 补确认参数 |
| CT-CONV-130 | `bad_decision` | 400 | approval decision 非法 | 无 | 不适用 | 改用 allow_once、allow_session、deny |
| CT-CONV-131 | `task_not_found` | 404 | 任务不存在或与会话不匹配 | 无 | 不泄露 | 退出详情并刷新列表，不提示无权限 |
| CT-CONV-132 | `task_state_conflict` | 409 | 重试、确认、恢复的状态前提不满足 | `currentStatus` | 不适用 | 刷新任务并隐藏不适用入口 |
| CT-CONV-133 | `invalid_task_mode` | 400 | 模式不是 plan 或 explore，或边做边想携带步骤 | 无 | 不适用 | 回退到计划模式 |
| CT-CONV-134 | `invalid_task_status` | 400 | 列表筛选含未知状态值 | 无 | 不适用 | 重置为全部 |
| CT-CONV-135 | `task_batch_too_large` | 400 | 一次创建超过批次上限 | 无 | 不适用 | 拆批提交 |
| CT-CONV-136 | `invalid_task_dependency` | 400 | 依赖不存在、跨批次、自依赖、成环或同一任务入边混合 joinMode | 无 | 不适用 | 提示并阻止提交 |
| CT-CONV-137 | `task_context_too_large` | 413 | 目标、输入或约束合计超过上限 | 无 | 不适用 | 要求删减后重试 |
| CT-CONV-138 | `permission_denied` | 403 | 路径越出工作区、工具不在白名单、未授权网络或子进程 | `path` 或 `tool` | 不泄露 | 展示为工具调用失败，不重试 |
| CT-CONV-139 | `task_executor_unavailable` | 503 | 任务模块已启用但执行器未装配 | 无 | 不适用 | 禁用发起入口并提示稍后重试 |

错误信封固定为 `{"ok":false,"error":"...","code":"..."}`；除 `task_state_conflict` 与 `permission_denied` 外不追加字段，`archive_blocked` 的 `blockers[]` 沿用既有归档门禁。

## 类 4 事件与消息

| 编号 | 事件名 | 触发时机 | 载荷字段 | 顺序依据 | 去重键 | 补偿方式 |
|---|---|---|---|---|---|---|
| CT-CONV-201 | `task.created` | 批内每个任务创建后各发一条 | id、sessionId、batchId、mode、status、displayStatus、title、dependsOn、orderIndex、createdAt | 事件日志 id 单调；批内按 orderIndex 升序 | 事件 id | 重连带 since 回放，之后拉列表对账 |
| CT-CONV-202 | `task.updated` | 状态、等待原因、进度、尝试次数变化 | id、sessionId、batchId、status、displayStatus、waitingReason、progress、attempt、triggerCount、failReason、changed | 事件日志 id 单调 | 事件 id | 同上；以 HTTP 详情覆盖本地快照 |
| CT-CONV-203 | `task.step` | 步骤进入运行中或终态 | id、stepId、stepSeq、status、traceCount、progress、at | 同一任务 stepSeq 严格递增 | id、stepId、stepSeq | 重连后拉任务详情补齐步骤 |
| CT-CONV-204 | `task.trace` | 追加一条轨迹 | id、stepId、traceSeq、category、tool、text、at | 同一任务 traceSeq 严格递增 | id、traceSeq | 重连后按轨迹分页补齐 |
| CT-CONV-205 | `task.report` | 任务进入终态并需要汇报 | 既有汇报字段、displayStatus、failReason | 终态后只发一次 | 事件 id | 重连后拉任务详情与汇报消息 |
| CT-CONV-206 | `task.reminder` | 用户设定时限到点 | id、deadlineAt、at | 事件日志 id 单调；每任务最多一条 | 事件 id | 重连后按 deadlineAt 对账，不重复提醒 |

任务卡片是普通消息行，字段固定为 `role=agent`、`category=task`、`task_id`、`batch_id`、`text`、`status=done`、`internal=0`；批量创建只写一条汇总卡，`task_count` 与列表 `total` 不一致时以列表为准。事件顺序固定为全部 `task.created` 写完后写 `message.created`，最后返回 HTTP 响应。

## 类 5 界面几何与选择器

五个选择器取自前端 §17.2.1 的选择器表，尺寸数值与设计 §17.2.1、§17.13 的像素值一致。`选择器或aria` 列暂留空：设计 spec §0.1 的「产品锚点」表头命中脚本的 `/锚点/` 规则，抽取结果是 `specs/product/P1-CONV/spec.md:56` 这类文件引用而不是 DOM 选择器；脚本要求契约选择器同时是设计列与前端列的子集，两侧交集为空，任何真实选择器都会报不一致。按禁止改门禁判定与禁止改既有 spec 正文的约束，五个选择器原样转写在末列，`选择器或aria` 空置，MX-G-30 只报两侧多出项的 warning；待设计列把选择器表与文件引用表分开后，再把选择器移回该列。元素名写全称，避免与正文里「竖条」「面板」等泛称行的其他像素值混淆。

| 编号 | 元素 | 选择器或aria | 属性 | 数值 | 单位 | 断点 | 容差 | token | 备注（不上机比对） | 选择器转写（不参与脚本比对） |
|---|---|---|---|---|---|---|---|---|---|---|
| CT-CONV-301 | 右栏导航竖条 |  | 宽度 | 40 | px | 全宽档与 760–1023 抽屉 | ±1 | `--rail-strip` | 按钮 32×32、间距 4、顶部内边距 8、图标 18×18 | `nav.insp-rail[aria-label="右栏导航"]` |
| CT-CONV-302 | 右栏面板头 |  | 高度 | 44 | px | 展开态 | ±1 | 无 | 左侧标题 12.5/650、计数 10.5、收起按钮 26×26 | `div.insp-head` |
| CT-CONV-303 | 右栏内容滚动区 |  | 宽度 | 280 | px | 展开态 | ±1 | `--rail-task-panel` | 独立滚动、内边距 12/14 | `div.insp-body#insp-panel[role="region"]` |
| CT-CONV-304 | 右栏面板脚 |  | 高度 | 28 | px | 展开态 | ±1 | 无 | 左说明、右更新时间 HH:MM、文案随标签变化 | `div.insp-foot` |
| CT-CONV-305 | 右栏外壳 |  | 宽度 | 320 | px | 1600、1280、1180、1024–1180 | ±1 | `--rail` | 收起 40、宽度过渡 160ms；1024 以下改用 `--rail-strip` | `aside.inspector` |

右栏根节点另带 `data-session`（仅当前会话存在时）、`data-tab`（overview、tasks、deliverables）与 `data-collapsed`；760–1023 时点击标签打开抽屉，不改变宽档收起记忆。角标为 `span.insp-badge[aria-hidden="true"]`，0 不渲染、1–9 显示数字、10 及以上显示 9+。

## 类 6 验收入口

CHG-CONV-006 的 33 条与 CHG-CONV-007 的 18 条 AC 逐条一行。前 33 条在测试计划中为 pass，证据路径指向对应 TC；后 18 条尚未实现，脚本与证据记 `missing`，不写通过。

| 编号 | AC编号 | 判据摘要 | 脚本路径 | 夹具名 | 证据路径 | 判定人 |
|---|---|---|---|---|---|---|
| CT-CONV-401 | `AC-CONV-001-01` | 切换 active 后 500ms 内 data-session-id 为目标 ID，旧会话消息 0 条 | scripts/ac/AC-CONV-001-01.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-001，pass） | 验收 Agent |
| CT-CONV-402 | `AC-CONV-001-02` | 四态占位各 1、数字 0 出现 0 处；Escape 不提交、重启空草稿 0、父链 3 段、循环父链被拒 | scripts/ac/AC-CONV-001-02.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-002，pass） | 验收 Agent |
| CT-CONV-403 | `AC-CONV-001-03` | 归档主会话返回 409 main_session_protected，archived 保持 false | scripts/ac/AC-CONV-001-03.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-003，pass） | 验收 Agent |
| CT-CONV-404 | `AC-CONV-001-04` | 置顶后成为同级第一条，取消恢复原序，跨层不上浮，子会话在父会话之下 | scripts/ac/AC-CONV-001-04.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-004，pass） | 验收 Agent |
| CT-CONV-405 | `AC-CONV-001-05` | 行内数等于该会话 messageCount，底部等于全部会话之和，切换后行内变而底部不变 | scripts/ac/AC-CONV-001-05.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-035，pass） | 验收 Agent |
| CT-CONV-406 | `AC-CONV-002-01` | 新建到恢复四步后列表与中栏同源，归档 disabled 1 个、恢复 0 个，重启字段相等 | scripts/ac/AC-CONV-002-01.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-005，pass） | 验收 Agent |
| CT-CONV-407 | `AC-CONV-002-02` | 四端点 500 后错误节点 1 个、输入值保留、行数差 0、archived 不变，重试计数各 2 | scripts/ac/AC-CONV-002-02.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-006，pass） | 验收 Agent |
| CT-CONV-408 | `AC-CONV-003-01` | 请求含 q 参数 1 次，行集等于响应 id 集，正文搜索 0 次，搜索中与无匹配各 1 个 | scripts/ac/AC-CONV-003-01.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-008，pass） | 验收 Agent |
| CT-CONV-409 | `AC-CONV-003-02` | 搜索失败列表 0 行且错误 1 个，已读会话未读点 0 个 | scripts/ac/AC-CONV-003-02.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-009，pass） | 验收 Agent |
| CT-CONV-410 | `AC-CONV-003-03` | 标题搜索 1 次、正文搜索 0 次，行集等于响应 id 集 | scripts/ac/AC-CONV-003-03.mjs | N/A（会话夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-010，pass） | 验收 Agent |
| CT-CONV-411 | `AC-CONV-004-01` | 用户条目左对齐 4/4、司墨条目右对齐 4/4，底色与 token 一致 | 无独立脚本；TC-P1-CONV-011（组件加人工目视） | N/A（消息夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-011，pass） | 验收 Agent |
| CT-CONV-412 | `AC-CONV-004-02` | 剪贴板降级 1 次、卡片失败错误 1 个、接口 internal 0 条 | scripts/ac/AC-CONV-004-02.mjs | N/A（消息夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-012，pass） | 验收 Agent |
| CT-CONV-413 | `AC-CONV-004-03` | 接口、WS、UI 三处 internal 0，卡片 data-kind=card 至少 1，编辑端点返回禁用 | scripts/ac/AC-CONV-004-03.mjs | N/A（消息夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-013，pass） | 验收 Agent |
| CT-CONV-414 | `AC-CONV-005-01` | 发送后 1 条消息、done 后输入 0，停止后该 messageId 增量 0、其他流大于 0 | scripts/ac/AC-CONV-005-01.mjs | N/A（流式夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-016，pass） | 验收 Agent |
| CT-CONV-415 | `AC-CONV-005-02` | 停止后 10ms 上游 context 关闭、两类 delta 0、落库 0、回 idle 且 retracted 先于 idle | scripts/ac/AC-CONV-005-02.mjs | N/A（假上游夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-017，pass） | 验收 Agent |
| CT-CONV-416 | `AC-CONV-006-01` | 两种模式四组键位映射正确，aria-pressed 与模式一致，localStorage 刷新后不变 | scripts/ac/AC-CONV-006-01.mjs | N/A（输入夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-018，pass） | 验收 Agent |
| CT-CONV-417 | `AC-CONV-006-02` | 输入法组合中发送 0 次，失败后输入不变且错误 1 个，禁用属性 1 个 | scripts/ac/AC-CONV-006-02.mjs | N/A（输入夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-019，pass） | 验收 Agent |
| CT-CONV-418 | `AC-CONV-007-01` | 祖先去重后 12 条、时间逆序 0、条数等于消息数，切会话后祖先 0 条 | scripts/ac/AC-CONV-007-01.mjs | N/A（祖先夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-014，pass） | 验收 Agent |
| CT-CONV-419 | `AC-CONV-007-02` | 413 提示 1 条且重试补齐，403 中性提示 1 条且无失败字样，空上级提示 0 条 | scripts/ac/AC-CONV-007-02.mjs | N/A（祖先夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-015，pass） | 验收 Agent |
| CT-CONV-420 | `AC-CONV-008-01` | 三组节点各 1 个，rev 与待确认计数等于响应，无投影空态 1 个 | scripts/ac/AC-CONV-008-01.mjs | N/A（投影夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-031，pass） | 验收 Agent |
| CT-CONV-421 | `AC-CONV-008-02` | 展开后可见行数等于首屏加补取，messageId 相等，提交重试取消入口 0 个 | scripts/ac/AC-CONV-008-02.mjs | N/A（投影夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-032，pass） | 验收 Agent |
| CT-CONV-422 | `AC-CONV-008-03` | 四态各 1、375 下侧栏与右栏 0×0、scrollWidth 等于 375、Composer 可见 | scripts/ac/AC-CONV-008-03.mjs | N/A（窄屏夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-033，pass） | 验收 Agent |
| CT-CONV-423 | `AC-CONV-008-04` | taskLimit 0 与 51 返回 400 invalid_task_limit、会话不存在 404、304 空体且保留 ETag | scripts/ac/AC-CONV-008-04.mjs | N/A（投影夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-034，pass） | 验收 Agent |
| CT-CONV-424 | `AC-CONV-008-05` | 展开后可见条目等于 total，组头分子分母都等于 total，补取 500 时错误 1 个且条目不变 | scripts/ac/AC-CONV-008-05.mjs | N/A（投影夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-036，pass） | 验收 Agent |
| CT-CONV-425 | `AC-SYNC-001-01` | 连接态 1 个、seq 严格递增且重复 0、since 补发等于断开期帧数、两客户端 seq 集相等 | scripts/ac/AC-SYNC-001-01.mjs | N/A（WS 夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-020，pass） | 验收 Agent |
| CT-CONV-426 | `AC-SYNC-001-02` | 重连中 1 个且 5000ms 内 connected，归档错误帧 1 个且回复 0，残留 1s 内变失败 | scripts/ac/AC-SYNC-001-02.mjs | N/A（WS 夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-021，pass） | 验收 Agent |
| CT-CONV-427 | `AC-SYNC-002-01` | 标签 B 的 active 等于 A，祖先去重 0 条，未读随 at 清 0，回跳 0 次 | scripts/ac/AC-SYNC-002-01.mjs | N/A（双实例夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-022，pass） | 验收 Agent |
| CT-CONV-428 | `AC-SYNC-002-02` | 两种到达序终态相同，重复广播未读增量 0，无通道异常 0 次且切会话仍生效 | scripts/ac/AC-SYNC-002-02.mjs | N/A（双实例夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-023，pass） | 验收 Agent |
| CT-CONV-429 | `AC-SYNC-003-01` | 点击后 aria-pressed 反转、Enter 行为反转、localStorage 为 shift-enter 且刷新不变 | scripts/ac/AC-SYNC-003-01.mjs | N/A（输入夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-024，pass） | 验收 Agent |
| CT-CONV-430 | `AC-SYNC-003-02` | 标签 B 的 aria-pressed 500ms 内等于 A，广播 1 次、构造抛错 0 次且仍持久化 | scripts/ac/AC-SYNC-003-02.mjs | N/A（双实例夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-025，pass） | 验收 Agent |
| CT-CONV-431 | `AC-SYNC-004-01` | 收帧后 B 行未读点 1 个、A 行 0 个；切到 B 后 0 个，刷新后仍 0 | scripts/ac/AC-SYNC-004-01.mjs | N/A（未读夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-026，pass） | 验收 Agent |
| CT-CONV-432 | `AC-SYNC-004-02` | 重启后已读会话点 0 个、未读会话 1 个，写失败保留点 1 个且 toast 1 个 | scripts/ac/AC-SYNC-004-02.mjs | N/A（未读夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-027，pass） | 验收 Agent |
| CT-CONV-433 | `AC-SYNC-004-03` | 未读点由 1 变 0，read_at 不早于消息 createdAt，刷新后点 0 个 | scripts/ac/AC-SYNC-004-03.mjs | N/A（未读夹具） | specs/test/P1-CONV/test-plan.md（TC-P1-CONV-028，pass） | 验收 Agent |
| CT-CONV-434 | `AC-CONV-009-01` | 发起 1 个任务后消息流任务卡 1 张、task_id 1 个，右栏任务计数增 1 | scripts/ac/AC-CONV-009-01.mjs（待建） | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-435 | `AC-CONV-009-02` | 10 个任务只有 1 张汇总卡、标题计数 10、展开 10 条；12 个时默认 10 条加「还有 2 条」入口 | scripts/ac/AC-CONV-009-02.mjs（待建） | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-436 | `AC-CONV-009-03` | 启动上下文历史消息 0 条、目标 1 个、约束至少 1 个 | scripts/ac/AC-CONV-009-03.mjs（待建） | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-437 | `AC-CONV-009-04` | 工具调用成功 1 次，越权请求拒绝 1 次且状态码 403 | scripts/ac/AC-CONV-009-04.mjs（待建） | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-438 | `AC-CONV-009-05` | 8 步按序，第 6 步默认展开且轨迹至少 1 条，第 5 步可回看，第 7 步无展开入口 | scripts/ac/AC-CONV-009-05.mjs | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-439 | `AC-CONV-009-06` | 扁平时间线 14 行、步骤节点 0 个、时间戳单调不减、展开入口 0 个 | scripts/ac/AC-CONV-009-06.mjs | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-440 | `AC-CONV-009-07` | 详情重试、取消、编辑、删除入口 0 个，关闭入口 1 个；四态卡均可点进同一只读详情 | scripts/ac/AC-CONV-009-07.mjs | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-441 | `AC-CONV-009-08` | 收起整栏 40px、展开 320px（面板 280 加竖条 40）、三个图标，任务标签选中 1 个 | scripts/ac/AC-CONV-009-08.mjs | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-442 | `AC-CONV-009-09` | 进行中 0 不渲染角标，2 显示 2，10 与 11 显示 9+，两位数字节点 0 个 | scripts/ac/AC-CONV-009-09.mjs | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-443 | `AC-CONV-009-10` | 刷新后折叠态与刷新前一致，四节标题与计数各 1 个，另一会话默认全开 | scripts/ac/AC-CONV-009-10.mjs | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-444 | `AC-CONV-009-11` | 点「还有 9 个」切到任务标签，目标任务卡成为首行且距滚动口顶部 0–8px | scripts/ac/AC-CONV-009-11.mjs | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-445 | `AC-CONV-009-12` | 四枚筛选分别得到 11、2、1、3 张卡，选中态 1 个，未开始只出现在全部中 | scripts/ac/AC-CONV-009-12.mjs | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-446 | `AC-CONV-009-13` | 8 节点四态之和为 8，失败下游 1 个为未开始且虚线 1 条；21 节点缩放 1.0、最大层 4 加 1 分两行 | scripts/ac/AC-CONV-009-13.mjs | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-447 | `AC-CONV-009-14` | 全部完成启动 1 次、任一完成启动 1 次、每个完成累计 3 次；等待依赖、确认、资源各自计数符合约定 | scripts/ac/AC-CONV-009-14.mjs（待建） | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-448 | `AC-CONV-009-15` | 取消 A 后 B 启动 0 次、状态为未开始、取消确认 1 条 | scripts/ac/AC-CONV-009-15.mjs（待建） | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-449 | `AC-CONV-009-16` | 类型徽标 1 个、来源任务名 1 个、下载文件 1 个且字节数等于响应 size | scripts/ac/AC-CONV-009-16.mjs（待建） | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-450 | `AC-CONV-009-17` | 会话 B 的任务数 0、任务图节点 0、跨会话查询 0 条 | scripts/ac/AC-CONV-009-17.mjs（待建） | 待建（任务夹具） | missing | 待验收 |
| CT-CONV-451 | `AC-CONV-009-18` | 无时限任务运行 30 分钟不取消，有时限任务到点取消 0 个且提醒 1 条 | scripts/ac/AC-CONV-009-18.mjs（待建） | 待建（任务夹具） | missing | 待验收 |

类 6 的 18 条 009 AC 只登记验收入口，不把未建脚本写成通过；证据补齐后按判据逐条更新脚本路径与证据路径，再改表首状态。
