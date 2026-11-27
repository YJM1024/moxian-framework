# 数据工程与持久化

负责数据模型、约束、身份隔离、读写语义、事务隔离、迁移、回填、查询与索引、容量、生命周期、导入导出、备份和恢复所需数据条件。确认 NULL、默认值、时区、精度和历史数据的含义，避免只考虑新数据。

根据实际变化选用对应条目。现有工程能力足够时直接使用，复用代码栏给出重复缺口应归属的位置。

## 6.1 按业务不变量选择隔离级别和事务边界

用于不同写者可能同时占用最后名额或同时改变余额。

- 工程入口　原生数据库并行会话、实际 COMMIT/ROLLBACK 与约束。
- 可复用代码　协议允许重试时，共用有界事务重试函数，从入口重新读取条件。
- 专业判断　数据与后端角色确定跨行约束及事务外动作。
- 验收　构造冲突交错后不变量仍成立，序列跳号等允许行为与业务约定一致。

采纳自PostgreSQL §13.2 与 Supabase lock-short-transactions。[原文 1](https://www.postgresql.org/docs/18/transaction-iso.html) [原文 2](https://github.com/supabase/agent-skills/blob/c9be0e931b7930f7d02126d04774d904c381e7d7/skills/supabase-postgres-best-practices/SKILL.md)

## 6.2 验证旧新版本并行及切换顺序

用于加列、收紧约束、回填或切换驱动。

- 工程入口　迁移工具、目标数据库、实际旧驱动命名查询、锁超时。
- 可复用代码　跨批次回填需要断点续跑且现成工具缺失时，复用按键分页与进度记录。
- 专业判断　决定旧写者退役时机、空值含义、锁预算及恢复条件。
- 验收　旧新读写、长连接、历史行在支持窗口内符合约定，收紧约束后非法新写被拒。

采纳自PostgreSQL ALTER TABLE 与 Supabase schema-constraints、conn-prepared-statements。[原文 1](https://www.postgresql.org/docs/18/sql-altertable.html) [原文 2](https://github.com/supabase/agent-skills/blob/c9be0e931b7930f7d02126d04774d904c381e7d7/skills/supabase-postgres-best-practices/SKILL.md)

## 6.3 按实际角色、有效策略及连接复用验证隔离

用于多租户、共享连接、角色或视图权限调整。

- 工程入口　数据库角色、策略、真实连接池与事务。
- 可复用代码　各入口共享身份绑定时，在连接或事务入口集中实现和清除。
- 专业判断　数据与安全职责判断可信身份来源、所有者权限、策略组合。
- 验收　两个身份及无身份请求复用连接，提交与回滚后看见各自允许的集合。

采纳自PostgreSQL CREATE POLICY/SET 与 Supabase security-rls-basics、conn-pooling。[原文 1](https://www.postgresql.org/docs/18/sql-createpolicy.html) [原文 2](https://www.postgresql.org/docs/18/sql-set.html) [原文 3](https://github.com/supabase/agent-skills/blob/c9be0e931b7930f7d02126d04774d904c381e7d7/skills/supabase-postgres-best-practices/SKILL.md)

## 6.4 用代表性分布评估查询

用于大表搜索、过滤组合变化、索引调整。

- 工程入口　在合适环境读取真实执行计划、行数与已有查询统计。
- 可复用代码　同一查询长期受性能目标约束时复用基准数据与调用。
- 专业判断　数据角色判断读写代价、数据倾斜及统计窗口。
- 验收　在约定规模和参数分布下正确返回，延迟与写入代价符合实际目标。

采纳自PostgreSQL Using EXPLAIN、索引文档与 Supabase query-partial-indexes、monitor-explain-analyze。[原文 1](https://www.postgresql.org/docs/18/using-explain.html) [原文 2](https://github.com/supabase/agent-skills/blob/c9be0e931b7930f7d02126d04774d904c381e7d7/skills/supabase-postgres-best-practices/SKILL.md)

## 6.5 分开验证交换格式的字段保真及目标消费者的解释方式

用于批量导入、系统对账、电子表格交换。

- 工程入口　现成 CSV parser/writer 与实际消费程序。
- 可复用代码　同一格式多方使用时复用字段映射与合法值转换。
- 专业判断　产品与数据角色约定是否允许改值、时区、空值和文件用途。
- 验收　特殊分隔符及多行值往返正确，目标消费端的实际解释满足约定。

采纳自RFC 4180 §2 与 ASVS 5.0.0-1.2.10。[原文 1](https://www.rfc-editor.org/rfc/rfc4180) [原文 2](https://github.com/OWASP/ASVS/tree/5cf9b032440be53ce345ab3c130fda46ba1ce7a2/5.0/en)
