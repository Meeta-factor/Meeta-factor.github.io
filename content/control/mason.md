---
title: "Mason-solver"
toc: true
date: 2026-04-21T15:25:55+08:00
draft: false
weight: 3
math: true
---
# Mason-solver

## 问题提出

 在自动控制原理中，信号流图和 Mason 公式是求传递函数的经典方法。但真正做题时，困难往往不在公式本身，而在于路径和回路的枚举：前向通道是否漏了？局部回路是否重复算了？互不接触回路的组合是否找全了？这些错误一旦出现，最后的传递函数即使错了，也很难定位是哪一步出的问题。

为了解决这个问题，我做了一个小工具[mason-solver](https://github.com/Meeta-factor/mason)：给定信号流图的边数据，它不仅输出最终传递函数，还把前向通道、各个回路、$\Delta$、$\Delta_k$ 的计算过程逐项展开。它的目标不是替代控制理论，而是把原本容易出错的人工枚举过程变成一个可检查、可追踪、可复核的计算流程。

## 问题分析

在进一步思考这个问题时，我逐渐意识到：Mason 公式本身并不复杂，真正复杂的是它背后的“结构枚举过程”。前向通道的识别、回路的提取、互不接触回路组合的判断，本质上都是图结构问题，而不是代数问题。但在传统做题过程中，这些步骤完全依赖人工视觉扫描与记忆，很容易出现遗漏或重复。也就是说，我们用的是一种“人脑不擅长”的方式在处理一个“结构性很强”的问题。

从这个角度看，把 Mason 公式的计算流程交给程序，并不是为了“省一点算力”，而是为了把问题的本质重新对齐：让机器去完成确定性的结构搜索与组合，而把人从繁琐且易错的枚举中解放出来，专注于系统建模与结果理解。这也是这个项目的出发点——不是做一个更快的计算器，而是构建一个能够忠实反映信号流图结构、并对每一步计算过程负责的工具

## python 实现

在具体实现上，这个工具采用一种尽量简洁、结构明确的输入方式：用边列表（edge list）来描述信号流图。每一条边由“起点、终点、增益”三部分组成，可以用 CSV 或 Python 数据结构表示。例如：

```text
start,end,gain
R,n1,1
n1,n2,G1
n2,C,1
C,n1,-H1
```

或者 

```python
data = {
    "edges": [
        ("R", "n1", "1"),
        ("n1", "n2", "G1"),
        ("n2", "C", "1"),
        ("C", "n1", "-H1"),
    ],
  "source":["R"],
  "sink":["C"],
}
```

### info输出

$\textbf{Forward Paths}$

$\text{Path } 1:\ R \rightarrow n1 \rightarrow n2 \rightarrow C$

$P_1 = G_{1}$

$\Delta_1 = 1$

$\textbf{Loops}$

$\text{Loop } 1:\ n2 \rightarrow C \rightarrow n1 \rightarrow n2$

$L_1 = - G_{1} H_{1}$

$\textbf{System Determinant}$

$\Delta = G_{1} H_{1} + 1$

$\textbf{Transfer Function}$

$T = \frac{G_{1}}{G_{1} H_{1} + 1}$

在这样的结构化输入基础上，程序会自动完成一系列原本需要人工逐步推导的过程，包括：

1. 搜索所有从输入节点到输出节点的前向通道；
2. 枚举系统中的所有单个回路；
3. 识别两两及更高阶的互不接触回路组合；
4. 计算系统的总行列式 $\Delta$；
5. 对每一条前向通道计算对应的 $\Delta_k$；
6. 根据 Mason 公式生成最终的传递函数表达式；
7. 将上述所有中间结果以结构化形式输出，便于逐步核对。

这种设计的核心思想是：把“图结构”与“代数计算”解耦。边列表负责描述系统结构，而具体的符号运算可以交由后端（如 sympy 或 control 库）处理。这样一来，这个工具既可以作为一个独立的求解器使用，也可以作为更复杂控制分析流程中的前处理模块。

## 实例演示

### 信号流图

![image-20260422001213889 ](/images/control/mason-sfg.png )

### 求解过程

#### 传递函数矩阵$G_{yu}$

$$
\Delta =- G_{1} G_{2} G_{3} G_{4} G_{7} G_{8}+ G_{1} G_{2} G_{3} G_{4}+ G_{1} G_{2} G_{5} G_{6} G_{7} G_{8}- G_{1} G_{2} G_{5} G_{6}+ G_{1} G_{3}+ G_{1} G_{6} G_{7}+ G_{2} G_{4}+ G_{2} G_{5} G_{8}+ 1
$$

$$
T = \frac{1}{\Delta}
\begin{bmatrix}- G_{1} \left(G_{2} G_{3} G_{4} G_{7} G_{8}+ G_{2} G_{5} G_{6}- G_{3} (G_{2} G_{4} + 1)- G_{6} G_{7} (G_{2} G_{5} G_{8} + 1)\right)
&G_{2} (G_{3} G_{8} + G_{6})\\\
G_{1} (G_{4} G_{7} + G_{5})&- G_{2} \left(G_{1} G_{3} G_{4} G_{7} G_{8}+ G_{1} G_{5} G_{6}- G_{4} (G_{1} G_{3} + 1)- G_{5} G_{8} (G_{1} G_{6} G_{7} + 1)\right)\end{bmatrix}
$$

#### 其中$R1 \to C1$求解过程

$\displaystyle \textbf{Loops}$

$\displaystyle \text{Loop } 1:\ n3 \rightarrow n4 \rightarrow n5 \rightarrow n6 \rightarrow n1 \rightarrow n2 \rightarrow n3$

$\displaystyle L_1 = - G_{1} G_{3}$

$\displaystyle \text{Loop } 2:\ n3 \rightarrow n4 \rightarrow n5 \rightarrow n6 \rightarrow n1 \rightarrow n2 \rightarrow m3 \rightarrow m4 \rightarrow m5 \rightarrow m6 \rightarrow m1 \rightarrow m2 \rightarrow n3$

$\displaystyle L_2 = G_{1} G_{2} G_{3} G_{4} G_{7} G_{8}$

$\displaystyle \text{Loop } 3:\ n3 \rightarrow n4 \rightarrow m5 \rightarrow m6 \rightarrow m1 \rightarrow m2 \rightarrow m3 \rightarrow m4 \rightarrow n5 \rightarrow n6 \rightarrow n1 \rightarrow n2 \rightarrow n3$

$\displaystyle L_3 = G_{1} G_{2} G_{5} G_{6}$

$\displaystyle \text{Loop } 4:\ n3 \rightarrow n4 \rightarrow m5 \rightarrow m6 \rightarrow m1 \rightarrow m2 \rightarrow n3$

$\displaystyle L_4 = - G_{2} G_{5} G_{8}$

$\displaystyle \text{Loop } 5:\ n1 \rightarrow n2 \rightarrow m3 \rightarrow m4 \rightarrow n5 \rightarrow n6 \rightarrow n1$

$\displaystyle L_5 = - G_{1} G_{6} G_{7}$

$\displaystyle \text{Loop } 6:\ m3 \rightarrow m4 \rightarrow m5 \rightarrow m6 \rightarrow m1 \rightarrow m2 \rightarrow m3$

$\displaystyle L_6 = - G_{2} G_{4}$

$\displaystyle \textbf{Forward Paths}$

$\displaystyle \text{Path } 1:\ R1 \rightarrow n1 \rightarrow n2 \rightarrow n3 \rightarrow n4 \rightarrow n5 \rightarrow n6 \rightarrow C1$

$\displaystyle P_1 = G_{1} G_{3}$

$\displaystyle \Delta_1 = G_{2} G_{4} + 1$

$\displaystyle \text{Path } 2:\ R1 \rightarrow n1 \rightarrow n2 \rightarrow n3 \rightarrow n4 \rightarrow m5 \rightarrow m6 \rightarrow m1 \rightarrow m2 \rightarrow m3 \rightarrow m4 \rightarrow n5 \rightarrow n6 \rightarrow C1$

$\displaystyle P_2 = - G_{1} G_{2} G_{5} G_{6}$

$\displaystyle \Delta_2 = 1$

$\displaystyle \text{Path } 3:\ R1 \rightarrow n1 \rightarrow n2 \rightarrow m3 \rightarrow m4 \rightarrow m5 \rightarrow m6 \rightarrow m1 \rightarrow m2 \rightarrow n3 \rightarrow n4 \rightarrow n5 \rightarrow n6 \rightarrow C1$

$\displaystyle P_3 = - G_{1} G_{2} G_{3} G_{4} G_{7} G_{8}$

$\displaystyle \Delta_3 = 1$

$\displaystyle \text{Path } 4:\ R1 \rightarrow n1 \rightarrow n2 \rightarrow m3 \rightarrow m4 \rightarrow n5 \rightarrow n6 \rightarrow C1$

$\displaystyle P_4 = G_{1} G_{6} G_{7}$

$\displaystyle \Delta_4 = G_{2} G_{5} G_{8} + 1$

$\displaystyle \textbf{System Determinant}$

$\displaystyle \begin{aligned}\Delta &= 1 - \left(L_1 + L_2 + L_3 + L_4 + L_5 + L_6\right) + \left(L_1 \cdot L_6 + L_4 \cdot L_5\right) \\\ &= 1 - \left(- G_{1} G_{3} + G_{1} G_{2} G_{3} G_{4} G_{7} G_{8} + G_{1} G_{2} G_{5} G_{6} + - G_{2} G_{5} G_{8} + - G_{1} G_{6} G_{7} + - G_{2} G_{4}\right)+ \left(G_{1} G_{2} G_{3} G_{4} + G_{1} G_{2} G_{5} G_{6} G_{7} G_{8}\right) \\\ &= - G_{1} G_{2} G_{3} G_{4} G_{7} G_{8} + G_{1} G_{2} G_{3} G_{4} + G_{1} G_{2} G_{5} G_{6} G_{7} G_{8} - G_{1} G_{2} G_{5} G_{6} + G_{1} G_{3} + G_{1} G_{6} G_{7} + G_{2} G_{4} + G_{2} G_{5} G_{8} + 1\end{aligned}$

$\displaystyle \textbf{Transfer Function}$

$\displaystyle T = \frac{\sum P_{i} \Delta_{i}}{\Delta} = - \frac{G_{1} \left(G_{2} G_{3} G_{4} G_{7} G_{8} + G_{2} G_{5} G_{6} - G_{3} \left(G_{2} G_{4} + 1\right) - G_{6} G_{7} \left(G_{2} G_{5} G_{8} + 1\right)\right)}{- G_{1} G_{2} G_{3} G_{4} G_{7} G_{8} + G_{1} G_{2} G_{3} G_{4} + G_{1} G_{2} G_{5} G_{6} G_{7} G_{8} - G_{1} G_{2} G_{5} G_{6} + G_{1} G_{3} + G_{1} G_{6} G_{7} + G_{2} G_{4} + G_{2} G_{5} G_{8} + 1}$