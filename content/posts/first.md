---
title: "第一篇：博客跑通"
date: 2026-03-01T15:25:55+08:00
draft: false
weight: 1
math: true
---
# new
```python
import numpy as np

def lyapunov(A):
    # Solve A^T P + P A = -I
    n = A.shape[0]
    Q = np.eye(n)
    return Q

A = np.array([[0,1],[-2,-3]])
print(lyapunov(A))
```

```c++
#include <iostream>
using namespace std;

int main() {
    cout << "Hello Control Theory" << endl;
    return 0;
}
```

```verilog
module counter (
    input wire clk,
    input wire rst,
    output reg [3:0] q
);

always @(posedge clk) begin
    if (rst)
        q <= 4'b0000;
    else
        q <= q + 1;
end

endmodule
```

```shell
hugo server --bind 0.0.0.0 --baseURL http://192.168.2.102:1313/
export HUGO_IP=$(hostname -I | awk '{print $1}')
```

```json
{
  "name": "RaspberryPiBlog",
  "framework": "Hugo",
  "language": "Go",
  "highlight": true
}
```

行内测试

比如 `sudo reboot` 和 `git add .` 是否渲染正常



嵌套符号测试

```python
text = """Triple quotes test"""
print(f"Value: {text}")
```

这是一个李雅普诺夫函数 $V(x)=x^T P x$

$
A^T P + P A = -Q
$
