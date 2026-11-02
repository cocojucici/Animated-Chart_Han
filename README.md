# LAX IN MOTION · Animated Chart

按照 https://moraisland.github.io/lax-in-motion/#intro 的航站楼排名教程制作。

## 运行

在当前目录运行：

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

打开 http://127.0.0.1:8000 。也可使用 VS Code Live Server。请通过 HTTP 打开，直接双击 HTML 无法读取 CSV。

## 功能

- RacingBars 0.5.0 动态条形排名，D3 7.9.0 读取和汇总数据。
- 2006 年 1 月至 2023 年 10 月，214 个月、12 个航站楼类别。
- 到达/出发、国内/国际、起止月份筛选。
- 播放、暂停、重播、重置、时间轴和 0.5×–4× 速度。
- 稳定配色、领先航站楼金色描边及 TOP 1、动态总人次。
- 缺失记录以 * 标记，区别于已报告零值；当月数据表可展开。
- 所有运行依赖保存在本地 vendor 目录，无需 npm 安装或 CDN。

## 统计口径与验证

先按筛选条件选取原始行，再以 ReportPeriod 的月份及 Terminal 分组，求和 Passenger_Count。DataExtractDate 不参与统计。缺失项以零长度占位，不作估计。客流为人次，并非独立旅客。

已对原始 CSV 独立计算并通过浏览器核对：

| 月份 | 筛选 | 总人次 | 领先航站楼 | 领先人次 |
| --- | --- | ---: | --- | ---: |
| 2006-01 | 全部 | 4,756,159 | T4 | 866,261 |
| 2019-05 | 国内、到达+出发 | 5,413,760 | T1 | 841,564 |
| 2019-06 | 国内、到达+出发 | 5,672,492 | T5 | 907,604 |

浏览器已检查播放结束、领先切换、重置、时间轴跳转及筛选应用。

## 文件

index.html 页面；style.css 样式；script.js 控件、播放和总量；data-model.js 筛选及缺失类别补全；terminal-d3.js CSV 解析、汇总、数据表；vendor/ 本地库。

data-model.js 和 terminal-d3.js 基于教学站点对应模块；RacingBars 及 D3 分发文件取自该站点 vendor 目录。原始 CSV 保持不变。
