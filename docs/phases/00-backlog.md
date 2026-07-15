# Ludus 游戏 Backlog（00-backlog.md）

> 长期游戏清单，按"原理领域"组织。不要求一次实现。
> 每个游戏单元的交付须满足 CLAUDE.md B.7 的"完成定义(DoD)"。
> 状态图例：⬜ 未开始 / 🟡 进行中 / ✅ 已完成。优先级见文末"早期开发顺序"。
>
> ★ 总则（呼应 ADR-011 / 需求 2）：每个游戏均应提供"算法内部计算流程可视化"
> （搜索树 / 状态空间 / 行变换 / 概率演化等），作为渐进式揭示的一部分。
>
> ★ 实现优先原则：若某款游戏在网络上存在**官方或学术权威实现**（如 Simon Tatham 的 C 源码、
> GamesCrafters 的 GAMESMAN 求解器、牛津/伯克利课程 demo、知名开源求解器等），
> 应优先研读/移植/改写该实现，而非从零造轮。理由：(a) 正确性已验证 (b) 算法设计决策有据可查 (c) 避免重蹈已知陷阱。
> 移植时须标注来源并遵守其许可证。

每个条目格式：`游戏名（抽象问题 / 复杂度 / 求解器思路 / 是否可生成）`

---

## 1. 图论

- ⬜ 连连看 / 地图填色（图着色 / NP-完全 / 回溯+约束传播 / 可生成）
- ⬜ Flow Free（顶点不相交路径 / NP-完全 / SAT 或搜索 / 可生成唯一解）
- ⬜ 一笔画·中国邮递员（欧拉路径 / P / Hierholzer / 可生成）
- ⬜ 骑士周游（哈密顿路径 / NP-完全(一般图) / Warnsdorff 启发式 / 可生成）
- ⬜ Slitherlink（单回路 CSP / NP-完全 / CSP+回溯 / 可生成唯一解）
- ⬜ Hashiwokakero 架桥（约束图 / NP-完全 / CSP / 可生成唯一解）
- ⬜ 平面性游戏（K3,3/K5、四色 / — / 平面性检测 / 可生成）
- ⬜ 3 Utilities Puzzle（K3,3 非平面性 / — / 平面嵌入不可能性证明 / 经典演示）★ cut-the-knot
- ⬜ 网络管道（最大流/最小割 / P / Dinic/Ford-Fulkerson / 可生成）
- ⬜ Net 旋转拼网（网络连通性重建 / P / 连通分量检测 / 可生成）★ Simon Tatham
- ⬜ Pearl / Masyu（环路线索约束 / NP-完全 / CSP+回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Signpost（箭头哈密顿路径 / NP-完全(一般图) / 回溯+剪枝 / 可生成）★ Simon Tatham
- ⬜ Netslide 滑动拼网（行列滑动连通性重建 / — / BFS+置换群 / 可生成）★ Simon Tatham
- ⬜ Black Box 激光箱（信息最小化搜索 / — / 射线追踪+搜索 / 可生成）★ Simon Tatham
- ⬜ 警察抓小偷（cop-number / — / 博弈搜索 / 可生成）
- ⬜ Fox and Hounds 狐犬追逃（图上追逃博弈 / — / 博弈搜索 / 可生成）★ GamesCrafters

## 2. 组合博弈论

- ✅ Nim / 取石子（Sprague-Grundy / P / XOR / 可生成必胜局面）
- ✅ Wythoff（Beatty 序列 / P / 黄金比公式 / 可生成）
- ✅ Euclid's Game 欧几里得博弈（减法倍数 / P / φ 败者态 + gcd / 可生成）★ cut-the-knot / GamesCrafters → **Hub 已上线 `euclids-game` ✅**
- ✅ Grundy's Game（Sprague-Grundy 分裂堆 / P / mex + XOR / 可生成）★ cut-the-knot → **Hub 已上线 `grundys-game` ✅**
- ⬜ Northcott's Game（棋盘位置博弈 / — / Nimber 映射 / 可生成）★ cut-the-knot
- ⬜ Kayles（Octal games / P / Grundy 数列 / 可生成）
- ⬜ 翻硬币游戏（Mock Turtles 等 / — / Grundy / 可生成）
- ⬜ Toads and Frogs（Winning Ways 经典 / — / 博弈树+Nimber 分析 / 可生成）★ cut-the-knot / GamesCrafters
- ⬜ Dodgem（Winning Ways 经典推移 / — / 博弈搜索 / 可生成）★ GamesCrafters
- ⬜ Domineering（Winning Ways 经典 / — / 博弈搜索+Nimber / 可生成）★ GamesCrafters
- ⬜ Chomp（偏序博弈 / — / 博弈树+策略窃取论证 / —）
- ⬜ 点格棋 Dots & Boxes（链规则 / — / Nimber 分析 / 可生成）
- ⬜ Hex（策略窃取 / PSPACE / 启发式+蒙特卡洛 / 可生成）
- ⬜ Y（Hex 三角网格变体 / PSPACE / 蒙特卡洛+策略窃取 / 可生成）★ GamesCrafters
- ⬜ Sim（Ramsey 博弈 / PSPACE-完全 / 策略窃取+后手必胜分析 / —）★ GamesCrafters
- ⬜ 五子棋·井字棋（Minimax/Alpha-Beta / — / 博弈树 / 可生成残局）
- ⬜ Connect 4（Minimax/Alpha-Beta / 已强解(Allis 1988, 4.5T 状态) / 博弈树+启发式+开局库 / 可生成残局）★ GamesCrafters → **Hub 已上线 `connect-four` ✅**
- ⬜ Nine Men's Morris 九子棋（Alpha-Beta / — / 博弈树+三连威胁评估 / 可生成残局）★ GamesCrafters
- ⬜ Othello / Reversi（领土博弈 / — / Alpha-Beta+MCTS+模式库 / 可生成残局）★ GamesCrafters
- ⬜ Abalone 推球棋（推力博弈 / — / Alpha-Beta / 可生成残局）★ GamesCrafters
- ⬜ Quarto（四属性对齐博弈 / — / Minimax / 可生成残局）★ GamesCrafters
- ⬜ Chopsticks 猜拳（手指数状态空间博弈 / — / BFS 状态空间 / 可生成）★ GamesCrafters
- ⬜ Date Game 日历博弈（日期约束取子博弈 / — / 逆向分析+BFS / 可生成）★ cut-the-knot
- ⬜ L-game（Edward de Bono / Winning Ways 经典 / 极小状态空间~1848 / 穷举+BFS / 可生成）★ GamesCrafters
- ⬜ Mancala 播棋家族（非洲播种博弈 / — / Alpha-Beta+MCTS / 可生成残局）★ GamesCrafters
- ⬜ Checkers / Draughts 西洋跳棋（Alpha-Beta / 已强解(Chinook 2007) / 开局库+残局库 / 可生成残局）
- ⬜ Go 围棋（博弈树 / — / MCTS+神经网络(小棋盘) / 可生成 9×9/13×13 残局）
- ⬜ Nimble（硬币带 Nim / — / Grundy 数列 / 可生成）★ cut-the-knot

## 3. 计算复杂性（"感受难度爆炸"单元）

- ⬜ 扫雷（CSP/一致性判定 / NP-完全 / CSP+概率 / 可生成）
- ✅ Sokoban（PSPACE / 推箱子 / IDA*+死锁检测 / 可生成）
- ⬜ Rush Hour 华容道车阵（PSPACE / 滑块 / BFS 状态空间 / 可生成最优解）
- ⬜ n×n 数独（NP-完全 / 见 §4 / DLX / 可生成唯一解）
- ⬜ 俄罗斯方块离线优化（NP-完全 / — / 近似/搜索 / 可生成）
- ⬜ 通用平台游戏难度（— / 元层面展示 / — / —）
- ⬜ Lemmings（PSPACE / — / 搜索 / 可生成）
- ★ 需求：可调规模 n，可视化状态空间/搜索树爆炸。

## 4. 约束满足 / SAT / 逻辑

- ✅ 数独（精确覆盖 / NP-完全 / DLX/SAT / 可生成唯一解）
- ⬜ 扫雷（CSP/概率 / NP-完全 / 见 §3）
- ⬜ Nonogram 数织（行列约束 / NP-完全 / 行列 DP+传播 / 可生成唯一解）
- ⬜ Kakuro（和约束 CSP / NP-完全 / 回溯+剪枝 / 可生成唯一解）
- ⬜ KenKen（算术 CSP / NP-完全 / 回溯 / 可生成唯一解）
- ⬜ Light Up / Akari 灯照（灯照 CSP / NP-完全 / 回溯+约束传播 / 可生成唯一解）★ Simon Tatham
- ⬜ Tents 帐篷（配对 CSP / NP-完全 / 回溯+约束传播 / 可生成唯一解）★ Simon Tatham
- ⬜ Towers / Skyscrapers 摩天楼（可见度拉丁方 / NP-完全 / 回溯+剪枝 / 可生成唯一解）★ Simon Tatham
- ⬜ Unequal / Futoshiki（不等式拉丁方 / NP-完全 / 回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Slant 斜线迷宫（斜线 CSP / NP-完全 / 回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Galaxies 星系分区（旋转对称分区 / NP-完全 / 回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Magnets 磁铁（正负极 CSP / NP-完全 / 回溯+约束传播 / 可生成唯一解）★ Simon Tatham
- ⬜ Dominosa（多米诺骨牌完美覆盖 / P(判定) / 匹配+回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Singles / Hitori（去重涂黑 / NP-完全 / 回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Unruly（黑白不连续三连 / P / 约束传播 / 可生成）★ Simon Tatham
- ⬜ Palisade 栅栏分区（等大小连通分区 / NP-完全 / 回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Tracks 铁路轨道（行列轨道 CSP / NP-完全 / 回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Range 可见距离（可见距离限制 / NP-完全 / 回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Mosaic 马赛克（邻域计数 CSP / NP-完全 / 回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Rectangles 矩形分区（矩形面积分区 / NP-完全 / 回溯 / 可生成唯一解）★ Simon Tatham
- ⬜ Filling / Fillomino（多联骨牌数字分区 / NP-完全 / 回溯+约束传播 / 可生成唯一解）★ Simon Tatham
- ⬜ Undead 鬼怪镜（幽灵/吸血鬼/僵尸 镜面可见 CSP / NP-完全 / 回溯+约束传播 / 可生成唯一解）★ Simon Tatham
- ⬜ 斑马问题（SAT/归结 / NP-完全 / SAT 求解 / 可生成）
- ⬜ Lewis Carroll 逻辑游戏（三段论推理 / — / 归结+逻辑编程 / 可生成）★ cut-the-knot
- ⬜ 布尔电路解谜（电路可满足 / NP-完全 / SAT / 可生成）
- ⬜ Bishop Puzzle 象谜题（棋盘最大独立集 / P / 贪心+公式 / 可生成）★ GamesCrafters

## 5. 线性代数 GF(2)

- ✅ Lights Out 点灯（高斯消元/零空间 / P / GF(2) 高斯消元 / 可生成唯一解·最优解）★首个切片
- ⬜ Merlin's Magic Squares（Lights Out 同构变体 / P / GF(2) 高斯消元 / 可生成）★ cut-the-knot
- ⬜ 开关阵列 / 异或谜题（线性方程组 GF(2) / P / 高斯消元 / 可生成）
- ⬜ 15 数码（置换奇偶不变量 / 见 §7,§9 / — / —）

## 6. 组合优化

- ⬜ TSP 送货（旅行商 / NP-难 / Held-Karp/2-opt/Christofides / 可生成已知最优小规模）
- ⬜ 背包收集（0/1 背包 / NP-完全 / DP/FPTAS / 可生成）
- ⬜ 装箱（Bin Packing / NP-难 / 近似 / 可生成）
- ⬜ 任务调度（调度 / NP-难 / 近似/DP / 可生成）
- ⬜ 切料问题（Cutting Stock / NP-难 / 列生成 / 可生成）
- ⬜ 设施选址 / 集合覆盖（NP-难 / 贪心近似 / 可生成）
- ⬜ 稳定匹配（Gale-Shapley / P / 延迟接受 / 可生成）
- ⬜ 公平分配（cut-and-choose / — / 协议演示 / 可生成）

## 7. 搜索 / 启发式

- ⬜ 滑块 8/15-puzzle（最短路径搜索 / NP-难(一般) / A*/IDA*+模式数据库 / 可生成已知最优）
- ✅ Peg Solitaire 孔明棋（可达性搜索 / NP-完全 / 回溯+哈希剪枝+对称约简 / 经典名局合集）★ GamesCrafters / cut-the-knot
- ⬜ 迷宫（最短路 / P / BFS/Dijkstra/A* / 可生成）
- ⬜ 倒水谜题（状态 BFS / P / gcd+裴蜀/BFS / 可生成已知最优）
- ⬜ 过河问题（状态搜索 / P / BFS / 可生成）
- ⬜ 河内塔（递归 / P / 递归/迭代 / 可生成）
- ⬜ Bicolor Tower of Hanoi 双色汉诺塔（递归+约束 / P / 递归+搜索 / 可生成）★ cut-the-knot
- ⬜ 华容道（滑块 / 见 §3 Rush Hour）
- ⬜ Inertia 惯性滑行（动量搜索 / — / BFS+动量状态空间 / 可生成）★ Simon Tatham
- ⬜ Sixteen 行列滑动（行列置换排序 / — / BFS+置换群 / 可生成已知最优）★ Simon Tatham
- ⬜ Twiddle 旋转排序（旋转置换 / — / BFS+置换群 / 可生成已知最优）★ Simon Tatham
- ⬜ Top Spin 循环置换（循环置换排序 / — / BFS+置换群分析 / 可生成已知最优）★ GamesCrafters
- ⬜ Shuttle Puzzle 穿梭排序（相邻交换排序 / P / 逆序数+BFS / 可生成已知最优）★ cut-the-knot
- ⬜ N Queens Puzzle N皇后（回溯搜索 / — / 回溯+约束传播 / 可生成）★ GamesCrafters / cut-the-knot
- ⬜ 1D Chess 一维象棋（极小棋盘搜索 / P(小) / Minimax+BFS 穷举 / 可生成残局）★ GamesCrafters
- ⬜ Hour Glass Timing 沙漏计时（状态 BFS+数论 / P / BFS+裴蜀定理 / 可生成已知最优）★ cut-the-knot

## 8. 计算几何

- ⬜ 解缠绕（平面直线嵌入/Fáry 定理 / — / 平面嵌入算法 / 可生成）
- ⬜ 圈地（凸包 / P / Graham/Andrew / 可生成）
- ⬜ 美术馆守卫（⌊n/3⌋ 定理 / 三角剖分 / 多边形三角剖分+三染色 / 可生成）
- ⬜ Tangram（多边形覆盖 / NP-难 / 搜索 / 可生成）
- ⬜ 激光反射（对称展开 / P / 几何反射/射线 / 可生成）
- ⬜ Buffon's Needle/Noodle（几何概率+π估算 / — / 蒙特卡洛模拟 / 可生成）★ cut-the-knot

## 9. 群论与置换

- ⬜ 魔方（置换群/上帝之数 / — / Kociemba 两阶段(纯 TS, 可选 WASM 加速) / 可生成已知最优层数标注）
- ⬜ 15 数码（交错群 A15 / — / 见 §7 / —）
- ⬜ 旋转环谜题（轨道-稳定子 / — / 群论分析 / 可生成）
- ⬜ 格雷码灯（格雷码 / P / 格雷码生成 / 可生成）
- ⬜ Cube 滚立方体（立方体滚动置换群 / — / BFS+置换群 / 可生成已知最优）★ Simon Tatham

## 10. 概率与决策

- ⬜ 2048（Expectimax/MDP / — / Expectimax / —）
- ⬜ 扫雷概率开格（贝叶斯 / 见 §3 / 概率推断 / —）
- ⬜ 21 点（最优策略表 / — / DP/MDP / —）
- ⬜ 三门问题（条件概率 / — / 模拟+贝叶斯 / —）
- ⬜ 多臂老虎机（UCB / — / UCB1/Thompson / —）
- ⬜ Parrondo's Paradox（两个输策略交替变赢 / — / 概率转移矩阵模拟 / —）★ cut-the-knot
- ⬜ Battleship 海战棋（隐藏信息推理 / — / 概率密度估计+搜索 / 可生成）
- ⬜ 猜数字 / Wordle（熵/信息增益 / — / 见 §11 / 可生成）

## 11. 信息论与编码

- ⬜ 二十个问题（决策树/log 下界 / — / 决策树 / —）
- ⬜ Wordle（信息增益 / — / 熵最大化 / 可生成）
- ⬜ 称硬币找次品（三进制 / — / 三分策略 / 可生成）
- ⬜ 帽子猜色（汉明码 / — / 纠错码构造 / —）
- ⬜ Mastermind（Knuth 五步 / — / Minimax 猜测 / 可生成）

## 12. 形式语言与自动机

- ⬜ 寄存器机编程解谜（计算模型 / — / 解释器 / 可生成）
- ⬜ 并发汇编（Zachtronics 式 / — / 解释器+验证 / 可生成）
- ⬜ 生命游戏（元胞自动机/图灵完备 / — / 模拟 / 可生成图样）★建议 Canvas 渲染
- ⬜ 状态机解谜（DFA/NFA / — / 自动机模拟 / 可生成）
- ⬜ 正则匹配解谜（正则 / — / 正则引擎 / 可生成）

## 13. 数论

- ⬜ 倒水（裴蜀定理 / 见 §7 / gcd / 可生成）
- ⬜ 约瑟夫问题（递推 / P / 递推/公式 / 可生成）
- ⬜ 模运算连线（模算术 / — / — / 可生成）
- ⬜ Magic Squares 幻方（幻方构造 / — / 奇数/双偶/单偶构造法 / 可生成）★ cut-the-knot
- ⬜ 加密寻宝（RSA/CRT / — / 数论算法 / 可生成）

## 14. 数据结构

- ⬜ 消消乐 / 俄罗斯方块（并查集/洪水填充 / — / Union-Find/Flood-Fill / 可生成）★建议 Canvas 渲染
- ⬜ 汉诺塔（栈 / 见 §7 / — / —）
- ⬜ 纸牌接龙（搜索 / NP-完全(部分) / 搜索 / 可生成可解）
- ⬜ 区间覆盖游戏（线段树/贪心 / P / 贪心/线段树 / 可生成）

## 15. 动态规划与递归

- ⬜ 爬楼梯（斐波那契 / P / DP / 可生成）
- ⬜ 网格收金币（路径 DP / P / DP / 可生成已知最优）
- ⬜ 字符串解谜（编辑距离/LCS / P / DP / 可生成）
- ⬜ 铺砖（状态压缩 DP/骨牌计数 / — / 轮廓线 DP / 可生成）
- ⬜ Tromino Puzzle（L 形三联骨牌覆盖 / P / 分治+递归 / 可生成）★ cut-the-knot

## 16. ★ 关卡设计单元（Procedural Puzzle Generation）—— 横切能力，非单一游戏

此为贯穿所有游戏的生成能力，需在架构与通用 UI 层支持：

- ⬜ (a) 反向生成保证可解
- ⬜ (b) 挖空 + 求解器验证生成**唯一解**（数独范式，需可计数解的求解器如 DLX）
- ⬜ (c) 生成**已知最优解**关卡（反向 BFS 保证最短，或 A*/IDA* 事后标注）
- ⬜ (d) **难度度量与调控**（推理技巧分层、搜索树大小、回溯次数、人类平均步数）
- ⬜ (e) **反向设计博弈**（让用户设计"看似易实则难"或"难以察觉无解"的关卡）

---

## 🚀 早期开发顺序（阶段 5，刻意覆盖不同领域以暴露接口缺陷）

1. ✅ **Lights Out 点灯**（§5 线性代数 GF(2)）—— 阶段 4 垂直切片
2. ✅ **数独**（§4 CSP/SAT，DLX + 唯一解生成）
3. ✅ **Nim / Wythoff**（§2 组合博弈论）
4. ✅ **Connect 4**（§2 博弈树/Alpha-Beta，已强解，教育价值极高）★ GamesCrafters
5. ✅ **15-puzzle 滑块**（§7 搜索，A*/IDA*）
6. ✅ **倒水谜题**（§13 数论）
7. ✅ **Nonogram 数织**（§4 CSP）
8. ✅ **Peg Solitaire 孔明棋**（§7 搜索，回溯+对称约简）★ 四平台共有

> 说明：复杂度标注为粗略归类，正式归类与论证在各游戏的"揭示抽象"段（阶段 3/5）中精确给出并附引用。
>
> ### 📚 参考来源
>
> 本 backlog 在自主规划基础上，参考了以下四个平台的游戏清单进行补充（标注 ★ 来源）：
>
> | 平台 | 类型 | 游戏数 | 主要贡献 |
> |------|------|--------|----------|
> | **Simon Tatham's Portable Puzzle Collection** | 开源单机逻辑谜题合集 | 40 款 | CSP/逻辑谜题体系化，Web+桌面+移动端全覆盖 |
> | **GamesCrafters (UC Berkeley)** | 双人完全信息抽象策略博弈求解器 | 62 款游戏 + 11 款谜题 | 组合博弈论强解，教育性质（750+ 学生参与） |
> | **Red Blob Games (Amit Patel)** | 交互式算法教程与可视化 | ~80 个交互项目 | 交互式教程的最佳实践参考（非游戏内容），尤其 A* 引导、六边形网格、地图生成 |
> | **Cut-the-Knot (Alexander Bogomolny)** | 数学谜题与交互演示 | 数百个 | 数学谜题深度覆盖，组合博弈/概率/几何 |
>
> > 标注规则：每个新增条目末尾以 `★ 来源` 标注参考平台。
> > Red Blob Games 主要为算法可视化设计参考（非游戏），纳入 Ludus 教育层设计参考而非游戏清单。
>
> ### 🔗 权威/参考实现索引
>
> 以下列出早期开发游戏中已在网络上存在权威或高质量实现的参考，开发时优先研读移植：
>
> | 游戏 | 权威/参考实现 | 说明 |
> |------|-------------|------|
> | Lights Out | [Oxford CS demo](https://www.cs.ox.ac.uk/admissions/undergraduate/courses/demo-lightsout.html) | GF(3) 高斯消元，处理奇异矩阵取极小解 |
> | | [Nathaniel Johnston (2024)](https://njohnston.ca/2024/03/) | 线性代数解法 + Manim 动画脚本 |
> | | [daattali/lightsout](https://github.com/daattali/lightsout) (R) | `solve_board()` / `is_solvable()` |
> | 数独 | [sekika/kaidoku](https://github.com/sekika/kaidoku) | 19 种逻辑策略 + 9 级难度生成 + Pyodide WASM |
> | | DLX 标准实现 | Knuth 论文 "Dancing Links" (arXiv:cs/0011047) |
> | Nim/Wythoff | [CGSuite](https://www.cgsuite.org/) | 组合博弈论代数系统，含 Nimber 计算 |
> | | [LIRIS Heap Games](https://projet.liris.cnrs.fr/gag/grundy/index.html) | Python，Grundy 数 + P-positions 计算 |
> | Connect 4 | [GamesCrafters 强解](https://gamescrafters.berkeley.edu/) | 4.53T 状态穷举，Allis 1988 九策略 |
> | 15-Puzzle | A* + 模式数据库标准实现 | Korf (1985), Culberson & Schaeffer (1996) |
> | Peg Solitaire | [GamesCrafters](https://gamescrafters.berkeley.edu/) | 回溯+对称约简，已解标准英国棋盘 |
> | Nonogram | Simon Tatham `pattern.c` | C 源码，行列 DP + 约束传播 |
> | Sokoban | [dangarfield/sokoban-solver](https://github.com/dangarfield/sokoban-solver) | A*/BFS/DFS/UCS + Rust WASM + 关卡编辑器 |
> | 扫雷 | Simon Tatham `mines.c` | 保证可无猜求解的生成算法 |
> | Simon Tatham 全集 | [sgt-puzzles (git)](https://git.tartarus.org/?p=simon/puzzles.git) | C 源码，40 款游戏的标准实现，MIT 许可证 |
> | GamesCrafters 全集 | [GamesCrafters GitHub](https://github.com/GamesCrafters) | C/Python/Rust 多版求解器，学术权威 |
> | N Queens | 标准回溯入门 | 无数实现，经典 CS101 教学案例 |
> | Mancala | [GamesCrafters](https://gamescrafters.berkeley.edu/) | 多种变体 (Kalah/Oware) 求解 |
> | Checkers | Chinook (Schaeffer et al., 2007) | 首个完全强解的重大棋类游戏 |
>
> > 移植指南：Simon Tatham 的游戏采用 MIT 许可证，源码在 `git.tartarus.org`。
> > 每款游戏的 `.c` 文件自包含（规则+求解器+生成器在同一文件），是移植的黄金参考。
> > GamesCrafters 的 GAMESMAN 求解器为学术项目，公开算法但需注意许可。
