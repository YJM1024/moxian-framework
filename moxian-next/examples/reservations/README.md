# 预约取消窗口

用户可以在距开始时间至少 24 小时时取消。恰好 24 小时允许，少一纳秒拒绝，已开始拒绝。窗口比较两个时刻之间的实际时长。实现与测试都允许调用方传入当前时刻。

产品条目 1.3 确定边界例子。质量条目 7.1 把断言放在时间判定函数。打开本目录运行 `go test ./...`。在旧行为中，严格大于比较会拒绝恰好一天的请求，命名回归 `TestCancellationBoundary` 能定位这项错误。

只核对「恰好一天」这个边界时，可从本目录运行已安装的框架。

```sh
sdd test-go --package example.org/reservations \
  --test TestCancellationBoundary/exactly_one_day -- ./...
```

本例的完成依据是四个边界结果。[项目 CI 的 reservation 检查](../../../.github/workflows/moxian-next.yml) 在一次 Go 运行中分别核对这四个子测试。删除、跳过或筛掉任意一项都会使该检查失败。若业务新增预约归属、名额回补、退款或外部通知，沿对应服务端路径增加验证。
