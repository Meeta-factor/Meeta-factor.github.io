---
title: "第二篇：代码测试"
date: 2026-03-01T15:25:55+08:00
draft: false
weight: 2
math: true
mermaid: true
---
系统矩阵为：

$$
A = \begin{bmatrix}
0 & 1 \\
-2 & -3
\end{bmatrix}
$$

对应 Python 验证代码：

```python
import numpy as np
A = np.array([[0,1],[-2,-3]])
```
```mermaid
graph TD
A[系统] --> B[控制器]
B --> C[执行器]
```
```mermaid
graph LR
R[Reference] --> E[Error]
E --> C[Controller]
C --> P[Plant]
P --> Y[Output]
Y -->|feedback| E
```

| Name | Value |
|------|-------|
| Kp   | 1.2   |
| Ki   | 0.8   |

$\int _{0}^{1} \sin(x) \mathrm{d}x$

$$\int _{0}^{1} \sin(x) \mathrm{d}x$$

<iframe width="600" height="400"
src="https://www.youtube.com/embed/_bqa_I5hNAo"
frameborder="0" allowfullscreen></iframe>

