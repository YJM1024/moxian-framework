# 墨线框架 v1.6

墨线是一套面向单机、多智能体协作的规格驱动开发框架。它用中文文档定义流程、角色与判据，用可执行脚本把契约、追溯、覆盖率与证据要求变成门禁，适合在一个代码仓内由设计、前端、后端与验收角色分头推进需求。

本仓是框架 v1.6 的独立抽取，同步于 2026-11-25。源仓 `docs/framework/` 的 68 个文件按原样复制到 `docs/`，七个门禁脚本与一个性能测量脚本沿用，其中五个门禁脚本按新布局改写 `docs` 路径，另附两份验收报告与契约门禁的参考输入。仓库已在本地初始化并完成两次提交，没有配置远端，也没有推送。

## 四层结构

| 层 | 位置 | 作用 |
|---|---|---|
| 总册 | `docs/MOXIAN.md` | 流程主线、规则名册、版本表与附录，共十三章、284 条规则 |
| 矩阵 | `docs/TASK-MATRIX.md` | 八类任务乘六个阶段的动作、模板与门禁对照，共 66 格 |
| 域 | `docs/domains/` | 产品设计、前端、后端、测试四个域的实施规则 |
| 模板 | `docs/templates/` | 变更包、任务卡、证据、契约表与 12 份专项模板，共 29 份产物模板 |

`docs/ROLES.md`、`docs/EFFORT.md`、`docs/GATES.md`、`docs/ADOPTION.md`、`docs/ABSORB-RECONCILE.md` 是配套册，`docs/adapters/`、`docs/absorb/`、`docs/accept/` 是适配说明、吸收对账与历史验收记录。规则身份以总册与 `GATES.md` 为准，配套册不另立规则；角色规则 41 条登记在 `ROLES.md`，门禁 21 道、68 条门禁规则登记在 `GATES.md`。

## 三道入口

1. 判任务类型：读 `docs/TASK-MATRIX.md` 第 3 节，在八类任务中定档，得到该类型的动作、模板与门禁清单。
2. 走流程：按 `docs/MOXIAN.md` 第 5 章至第 11 章推进变更包与长期 spec，角色、评审与交接按 `docs/ROLES.md`。
3. 跑门禁：按 `docs/GATES.md` 第 2 节的四个时机执行，结构、语言、契约、追溯、增量覆盖、证据与矩阵覆盖率各有对应脚本。

接入方通常先用矩阵定档，再在变更包里登记契约与验收判据，最后按门禁脚本逐项取证。三条入口的顺序不能颠倒，因为矩阵决定适用哪些门禁，门禁又反过来约束变更包要写哪些字段。

## 怎么用

脚本只依赖 Node.js，本仓验证使用 v24.21.0，不需要安装依赖。

矩阵覆盖率门禁直接读 `docs/`：

```powershell
node scripts/check-matrix-coverage.mjs
```

契约一致性门禁默认扫描仓库根的 `specs/`。本仓不带产品 spec，随仓提供了一份 P1-CONV 参考输入，放在 `examples/reference-conv/`，用 `--root` 指向它：

```powershell
node scripts/check-contract.mjs --root examples/reference-conv
```

其余五个门禁脚本面向接入本框架的项目仓，读取该项目仓的 `specs/`、`docs/product/` 与 `docs/testing/`，在框架仓内单独运行没有输入，只用于自检；性能脚本只测 HTTP(S) 端点，自检在本机临时端口完成，不访问外部网络：

```powershell
node scripts/check-gates.mjs --self-test
node scripts/check-trace.mjs --self-test
node scripts/check-spec-language.mjs --self-test
node scripts/check-contract.mjs --self-test
node scripts/check-incremental-coverage.mjs --self-test
node scripts/check-evidence.mjs --self-test
node scripts/check-matrix-coverage.mjs --self-test
node scripts/measure-perf.mjs --self-test
```

## 仓库结构

```
moxian-framework/
├─ README.md
├─ VERSION
├─ CHANGELOG.md
├─ LICENSE
├─ .gitignore
├─ docs/
│  ├─ MOXIAN.md
│  ├─ TASK-MATRIX.md
│  ├─ GATES.md
│  ├─ ROLES.md
│  ├─ EFFORT.md
│  ├─ ADOPTION.md
│  ├─ ABSORB-RECONCILE.md
│  ├─ README.md
│  ├─ domains/
│  ├─ templates/
│  ├─ adapters/
│  ├─ absorb/
│  ├─ accept/
│  └─ plan/
├─ scripts/
└─ examples/
   ├─ index.md
   └─ reference-conv/
```

`.tmp/` 在脚本自检与门禁运行时生成，已被忽略。

## 路径约定

`docs/` 内的正文按源仓原样保留，仍然写 `docs/framework/…`。在本仓读取时按去掉 `framework/` 一层来映射，例如 `docs/framework/MOXIAN.md` 对应 `docs/MOXIAN.md`。这样处理是为了不改动冻结文本，代价是正文里的链接需要读者按此规则转换；528 处引用分布在 70 个文件里。

脚本侧的路径已经改到新布局：`docs/framework/…` 改为 `docs/…`，`docs/process/templates/…` 改为 `docs/templates/…`。新增的 `measure-perf.mjs` 不含 `docs` 路径常量，只把注释里的出处改为 `docs/MOXIAN.md`；脚本之间没有相对 import，因此没有模块说明符需要改写。

## 与源仓的差异

- `docs/MOXIAN.md`、`docs/TASK-MATRIX.md` 等 68 个文件按字节复制，正文未改；其中 12 份专项模板、两份验收报告与 `STRESS-RERUN-25-20261125.md` 为 v1.6 新增。
- 源仓 `docs/process/templates/` 下被矩阵引用的 7 份模板并入 `docs/templates/`，分别是 proposal、spec、design、tasks、test-plan、evidence 与 RETRO。不并入时矩阵门禁会因模板文件缺失而达不到 66/66。
- 新建 `docs/plan/DECISIONS.md`，作为 ADR 的落点占位。矩阵门禁要求该文件存在，内容不参与判定。
- 五个门禁脚本的 `docs` 路径常量、提示文案与矩阵自检夹具改到新布局，`check-trace.mjs` 与 `check-spec-language.mjs` 没有 `docs` 路径可改，`measure-perf.mjs` 只改注释出处；判定逻辑均未改。
- `examples/` 下两份报告取自 `docs/framework/accept/`，未改一字；`examples/reference-conv/specs/` 是从源仓复制的 P1-CONV 最小输入集。
- `LICENSE` 从源仓根目录原样复制，为 MIT 许可，著作权人 YJM1024。源仓已有许可证，因此没有新建待定许可文件。

## 版本与许可

`VERSION` 为 `v1.6`，对应 2026-11-25 的版本收口与独立验收，版本演进见 `CHANGELOG.md`；独立验收结论为 pass，报告见 `docs/accept/ACCEPT-MOXIAN-V16-20261125.md`。许可沿用源仓的 MIT 许可，见 `LICENSE`；如需更换许可方式，应先取得著作权人确认。

## 已知遗留

- `docs/` 正文中的 528 处 `docs/framework/…` 自引用未做批量替换，阅读时需按上一节映射。
- 契约门禁不带 `--root` 时扫描不到 `specs/contract`，只报一条 MX-G-26 错误，结果为 0 项通过、1 项未通过；带 `--root examples/reference-conv` 时为 7 项全部通过。
- `check-spec-language.mjs` 的规则来源 `docs/process/SPEC-STANDARD.md` 不在本次抽取范围，未随仓提供，脚本注释保留了该出处。
- `measure-net.mjs` 尚未建立，弱网与外部依赖的实测数据按 `docs/domains/testing.md` 的夹具写法人工登记，属 v1.6 验收报告第 5 节的 KD-04。
- `docs/plan/DECISIONS.md` 只是落点占位，不含源项目的决策记录。
- 仓库没有配置远端，也没有推送，提交只存在于本地。
