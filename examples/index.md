# 示例与参考输入

本目录放两类材料：说明框架如何被验收的报告，以及门禁在独立仓内复跑所需的参考输入。两者都取自源仓，只作为证据与输入，不属于框架规则正文。

## 验收报告

| 文件 | 内容 |
|---|---|
| `ACCEPT-MOXIAN-V15-20261125.md` | v1.5 冻结评审的验收报告，记录矩阵 66/66、契约 7/7、六项自检结果与四条欠账 |
| `REPLAY-CHG-CONV-007.md` | 用真实变更包 CHG-CONV-007 回放框架 v1.0 的报告，说明变更包如何被框架检查 |

两份报告都保留源仓写作时的路径。`docs/framework/…` 在本仓对应 `docs/…`；报告引用的 `specs/…` 只有 P1-CONV 的最小集随仓提供，其余以源仓为准。回放报告的基线是 v1.0，阅读时不要把它当作 v1.5 的验收证据。

## 门禁参考输入

`reference-conv/` 是从源仓复制的 P1-CONV 最小输入集，包含契约表、后端、设计、前端、产品四份 spec、测试计划、`docs/product/TREE.md`、`docs/product/TRACEABILITY.md`、`specs/test/e2e/README.md`，以及 CHG-CONV-001 至 CHG-CONV-007 七个变更包；每个包有 proposal、spec、tasks、test-plan 与 evidence。它让结构、追溯、契约与语言四道门禁在没有完整产品仓的情况下也能复跑，五道命令都在仓库根目录执行：

```powershell
node scripts/check-gates.mjs --root examples/reference-conv
node scripts/check-trace.mjs --root examples/reference-conv
node scripts/check-contract.mjs --root examples/reference-conv
node scripts/check-spec-language.mjs --root examples/reference-conv
node scripts/check-matrix-coverage.mjs
```

预期结果是结构门禁 42 项通过、0 项失败、57 条 warning，追溯门禁 188 项检查、失败 0、提示 0，契约门禁 7 项通过、0 条提示，语言门禁 0 error、16 warning，矩阵覆盖率 66/66（100%）与 2 条提示，退出码都是 0。warning 内容由脚本逐条输出，处置口径见 `docs/GATES.md` 第 4.1 节。

这份快照不是框架内容，也不代表完整的产品规格；不带 `--root` 时门禁扫描仓库根的 `specs/`，本仓没有该目录，契约门禁只报一条 MX-G-26 错误，追溯门禁报 2 条 T1，结构门禁因 `specs/changes` 不可读以退出码 2 结束。
