
// ======================================================
// 水果迷宫打砖块
// 完整版：五种关卡布局 + 固定阻挡物 + 水果道具
// 自由进出 + 暂停 + 下一关 + 重新开始
// ======================================================


// ======================================================
// 1. 获取画布和按钮
// ======================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");


// ======================================================
// 2. 游戏状态
// ======================================================

let gameState = "ready";
// ready         等待开始
// playing       游戏进行中
// levelComplete 当前关卡完成
// won           全部通关
// lost          游戏失败

let isPaused = false;

let score = 0;
let lives = 3;

let level = 1;
const maxLevel = 5;


// ======================================================
// 3. 迷宫区域
// ======================================================

const chamber = {
    x: 70,
    y: 60,
    width: 660,
    height: 410
};

chamber.right = chamber.x + chamber.width;
chamber.bottom = chamber.y + chamber.height;


// 底部入口
const entrance = {
    x: 345,
    width: 110
};


// ======================================================
// 4. 关卡布局和难度
// # 表示砖块，. 表示空位
// ======================================================

const levelSettings = [
    {
        name: "阶梯阵",
        speed: 5.0,
        entranceWidth: 110,

        layout: [
            "########",
            "..######",
            "....####",
            "......##"
        ],

        obstacles: [
            { x: 180, y: 365, width: 150, height: 14 },
            { x: 470, y: 405, width: 150, height: 14 }
        ]
    },

    {
        name: "金字塔阵",
        speed: 5.7,
        entranceWidth: 100,

        layout: [
            "...##...",
            "..####..",
            ".######.",
            "########",
            "..####.."
        ],

        obstacles: [
            { x: 110, y: 360, width: 220, height: 14 },
            { x: 470, y: 390, width: 220, height: 14 },
            { x: 350, y: 425, width: 100, height: 14 }
        ]
    },

    {
        name: "双区域阵",
        speed: 6.4,
        entranceWidth: 90,

        layout: [
            "##....##",
            "###..###",
            "########",
            "###..###",
            "##....##",
            "##....##"
        ],

        obstacles: [
            { x: 350, y: 350, width: 18, height: 100 },
            { x: 150, y: 390, width: 160, height: 14 },
            { x: 490, y: 390, width: 160, height: 14 }
        ]
    },

    {
        name: "交错阵",
        speed: 7.1,
        entranceWidth: 80,

        layout: [
            "#.#.#.#.",
            ".#.#.#.#",
            "#.#.#.#.",
            ".#.#.#.#",
            "########",
            "##.##.##",
            ".######."
        ],

        obstacles: [
            { x: 200, y: 350, width: 18, height: 100 },
            { x: 580, y: 350, width: 18, height: 100 },
            { x: 300, y: 390, width: 200, height: 14 }
        ]
    },

    {
        name: "终极迷宫",
        speed: 7.8,
        entranceWidth: 70,

        layout: [
            "########",
            "#..##..#",
            "##.##.##",
            "...##...",
            "########",
            "##....##",
            "#.####.#",
            "########"
        ],

        obstacles: [
            { x: 180, y: 350, width: 18, height: 100 },
            { x: 600, y: 350, width: 18, height: 100 },
            { x: 270, y: 360, width: 100, height: 14 },
            { x: 430, y: 400, width: 100, height: 14 },
            { x: 350, y: 435, width: 100, height: 14 }
        ]
    }
];

let ballBaseSpeed = 5;


// ======================================================
// 5. 挡板
// ======================================================

const originalPaddleWidth = 100;

const paddle = {
    x: 350,
    y: 615,
    width: originalPaddleWidth,
    height: 16,
    speed: 7
};


// ======================================================
// 6. 小球
// ======================================================

const balls = [];

function createBall(x, y, speedX, speedY, inside = false) {
    return {
        x: x,
        y: y,
        radius: 8,
        speedX: speedX,
        speedY: speedY,
        inside: inside
    };
}

function createWaitingBall() {
    balls.length = 0;

    balls.push(
        createBall(
            paddle.x + paddle.width / 2,
            paddle.y - 12,
            0,
            -ballBaseSpeed,
            false
        )
    );
}


// ======================================================
// 7. 砖块
// ======================================================

const bricks = [];

const brickConfig = {
    width: 68,
    height: 24,
    gap: 8,
    offsetX: 82,
    offsetY: 85
};

const brickColors = [
    "#ff6b6b",
    "#ffa94d",
    "#ffd43b",
    "#69db7c",
    "#4dabf7",
    "#9775fa",
    "#f783ac",
    "#20c997"
];

function createBricks() {
    bricks.length = 0;

    const layout = levelSettings[level - 1].layout;

    for (let row = 0; row < layout.length; row++) {

        for (let col = 0; col < layout[row].length; col++) {

            if (layout[row][col] !== "#") {
                continue;
            }

            bricks.push({
                x: brickConfig.offsetX +
                    col * (brickConfig.width + brickConfig.gap),

                y: brickConfig.offsetY +
                    row * (brickConfig.height + brickConfig.gap),

                width: brickConfig.width,
                height: brickConfig.height,
                alive: true,
                color: brickColors[row % brickColors.length]
            });
        }
    }
}


// ======================================================
// 8. 固定阻挡物
// ======================================================

const obstacles = [];

function createObstacles() {
    obstacles.length = 0;

    const setting = levelSettings[level - 1];

    for (const item of setting.obstacles) {
        obstacles.push({ ...item });
    }
}


// ======================================================
// 9. 水果道具
// ======================================================

const fruits = [];

const fruitTypes = [
    {
        name: "三倍小球",
        emoji: "🍒",
        effect: "triple"
    },
    {
        name: "增加生命",
        emoji: "🍎",
        effect: "life"
    },
    {
        name: "加宽挡板",
        emoji: "🍌",
        effect: "wide"
    },
    {
        name: "小球减速",
        emoji: "🍇",
        effect: "slow"
    },
    {
        name: "穿透砖块",
        emoji: "🍍",
        effect: "pierce"
    },
    {
        name: "额外加分",
        emoji: "🍊",
        effect: "bonus"
    }
];


// ======================================================
// 10. 临时能力计时
// ======================================================

const effects = {
    wide: 0,
    slow: 0,
    pierce: 0
};


// ======================================================
// 11. 入口和关卡难度
// ======================================================

function randomizeEntrance() {

    const minX = chamber.x + 20;
    const maxX = chamber.right - entrance.width - 20;

    entrance.x = minX + Math.random() * (maxX - minX);
}

function setLevelDifficulty() {

    const setting = levelSettings[level - 1];

    entrance.width = setting.entranceWidth;

    ballBaseSpeed = setting.speed;

    randomizeEntrance();
}


// ======================================================
// 12. 键盘控制
// ======================================================

const keys = {
    left: false,
    right: false
};

document.addEventListener("keydown", function (event) {

    if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.code === "Space"
    ) {
        event.preventDefault();
    }

    if (event.key === "ArrowLeft") {
        keys.left = true;
    }

    if (event.key === "ArrowRight") {
        keys.right = true;
    }

    // P键暂停或继续
    if (event.key.toLowerCase() === "p") {
        togglePause();
    }

    // 空格键开始或进入下一关
    if (event.code === "Space") {

        if (gameState === "ready") {
            startGame();

        } else if (gameState === "levelComplete") {
            nextLevel();
        }
    }
});

document.addEventListener("keyup", function (event) {

    if (event.key === "ArrowLeft") {
        keys.left = false;
    }

    if (event.key === "ArrowRight") {
        keys.right = false;
    }
});


// ======================================================
// 13. 暂停功能
// ======================================================

function togglePause() {

    if (gameState !== "playing") {
        return;
    }

    isPaused = !isPaused;

    updatePauseButton();
}

function updatePauseButton() {
    pauseButton.textContent = isPaused
        ? "继续游戏"
        : "暂停游戏";
}

pauseButton.addEventListener("click", function () {
    togglePause();
});


// ======================================================
// 14. 鼠标和触屏控制
// ======================================================

function movePaddleTo(clientX) {

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;

    const mouseX = (clientX - rect.left) * scaleX;

    paddle.x = mouseX - paddle.width / 2;

    paddle.x = Math.max(
        0,
        Math.min(canvas.width - paddle.width, paddle.x)
    );
}

canvas.addEventListener("mousemove", function (event) {
    movePaddleTo(event.clientX);
});

canvas.addEventListener("touchmove", function (event) {

    event.preventDefault();

    if (event.touches.length > 0) {
        movePaddleTo(event.touches[0].clientX);
    }

}, { passive: false });


// ======================================================
// 15. 开始游戏
// ======================================================

function startGame() {

    if (gameState !== "ready") {
        return;
    }

    gameState = "playing";

    isPaused = false;

    if (balls.length === 0) {
        createWaitingBall();
    }

    updatePauseButton();
}


// ======================================================
// 16. 下一关
// ======================================================

function nextLevel() {

    if (gameState !== "levelComplete") {
        return;
    }

    if (level >= maxLevel) {
        return;
    }

    level++;

    isPaused = false;

    // 清理上一关的小球和水果
    balls.length = 0;
    fruits.length = 0;

    // 清除临时能力
    effects.wide = 0;
    effects.slow = 0;
    effects.pierce = 0;

    paddle.width = originalPaddleWidth;

    // 设置下一关
    setLevelDifficulty();

    createBricks();
    createObstacles();

    paddle.x = canvas.width / 2 - paddle.width / 2;

    createWaitingBall();

    gameState = "ready";

    updatePauseButton();
}


// ======================================================
// 17. 重新开始
// ======================================================

function restartGame() {

    score = 0;
    lives = 3;
    level = 1;

    isPaused = false;

    balls.length = 0;
    fruits.length = 0;

    effects.wide = 0;
    effects.slow = 0;
    effects.pierce = 0;

    paddle.width = originalPaddleWidth;
    paddle.x = canvas.width / 2 - paddle.width / 2;

    setLevelDifficulty();

    createBricks();
    createObstacles();

    createWaitingBall();

    gameState = "ready";

    updatePauseButton();
}


// ======================================================
// 18. 点击画布
// ======================================================

canvas.addEventListener("click", function () {

    if (isPaused) {
        togglePause();
        return;
    }

    if (gameState === "ready") {
        startGame();

    } else if (gameState === "levelComplete") {
        nextLevel();

    } else if (gameState === "won" || gameState === "lost") {
        restartGame();
    }
});

restartButton.addEventListener("click", function () {
    restartGame();
});


// ======================================================
// 19. 更新挡板
// ======================================================

function updatePaddle() {

    if (keys.left) {
        paddle.x -= paddle.speed;
    }

    if (keys.right) {
        paddle.x += paddle.speed;
    }

    paddle.x = Math.max(
        0,
        Math.min(canvas.width - paddle.width, paddle.x)
    );
}


// ======================================================
// 20. 小球与迷宫墙壁碰撞
// 支持从入口自由进入和离开
// ======================================================

function checkChamberCollision(ball) {

    // 小球在迷宫外
    if (!ball.inside) {

        // 只有向上运动的小球可以进入
        if (
            ball.speedY < 0 &&
            ball.y - ball.radius <= chamber.bottom &&
            ball.y + ball.radius >= chamber.bottom
        ) {

            const canEnter =
                ball.x - ball.radius > entrance.x &&
                ball.x + ball.radius < entrance.x + entrance.width;

            if (canEnter) {

                ball.inside = true;

                ball.y = chamber.bottom - ball.radius;

                ball.speedY = -Math.abs(ball.speedY);

            } else {

                // 没对准入口，撞到底墙反弹
                ball.y = chamber.bottom + ball.radius;

                ball.speedY = Math.abs(ball.speedY);
            }
        }

        return;
    }

    // 小球已经进入迷宫

    // 左墙
    if (ball.x - ball.radius < chamber.x) {

        ball.x = chamber.x + ball.radius;

        ball.speedX = Math.abs(ball.speedX);
    }

    // 右墙
    if (ball.x + ball.radius > chamber.right) {

        ball.x = chamber.right - ball.radius;

        ball.speedX = -Math.abs(ball.speedX);
    }

    // 顶墙
    if (ball.y - ball.radius < chamber.y) {

        ball.y = chamber.y + ball.radius;

        ball.speedY = Math.abs(ball.speedY);
    }

    // 底部入口
    if (
        ball.y + ball.radius >= chamber.bottom &&
        ball.speedY > 0
    ) {

        const canExit =
            ball.x - ball.radius > entrance.x &&
            ball.x + ball.radius < entrance.x + entrance.width;

        if (canExit) {

            // 从入口离开迷宫
            ball.inside = false;

            ball.y = chamber.bottom + ball.radius;

            ball.speedY = Math.abs(ball.speedY);

        } else {

            // 入口以外的底墙会反弹
            ball.y = chamber.bottom - ball.radius;

            ball.speedY = -Math.abs(ball.speedY);
        }
    }
}


// ======================================================
// 21. 小球与固定阻挡物碰撞
// ======================================================

function checkObstacleCollision(ball, oldX, oldY) {

    for (const obstacle of obstacles) {

        const left = obstacle.x;
        const right = obstacle.x + obstacle.width;
        const top = obstacle.y;
        const bottom = obstacle.y + obstacle.height;

        // 计算小球中心距离矩形最近点
        const nearestX = Math.max(
            left,
            Math.min(ball.x, right)
        );

        const nearestY = Math.max(
            top,
            Math.min(ball.y, bottom)
        );

        const dx = ball.x - nearestX;
        const dy = ball.y - nearestY;

        // 没有碰撞
        if (
            dx * dx + dy * dy >
            ball.radius * ball.radius
        ) {
            continue;
        }

        // 判断小球上一帧位于阻挡物的哪一侧
        const fromLeft = oldX + ball.radius <= left;
        const fromRight = oldX - ball.radius >= right;
        const fromTop = oldY + ball.radius <= top;
        const fromBottom = oldY - ball.radius >= bottom;

        if (fromLeft) {

            ball.x = left - ball.radius;
            ball.speedX = -Math.abs(ball.speedX);

        } else if (fromRight) {

            ball.x = right + ball.radius;
            ball.speedX = Math.abs(ball.speedX);

        } else if (fromTop) {

            ball.y = top - ball.radius;
            ball.speedY = -Math.abs(ball.speedY);

        } else if (fromBottom) {

            ball.y = bottom + ball.radius;
            ball.speedY = Math.abs(ball.speedY);

        } else {

            // 边角碰撞时，按重叠较小的方向反弹
            const overlapX =
                ball.radius + obstacle.width / 2 -
                Math.abs(ball.x - (left + obstacle.width / 2));

            const overlapY =
                ball.radius + obstacle.height / 2 -
                Math.abs(ball.y - (top + obstacle.height / 2));

            if (overlapX < overlapY) {

                if (ball.x < left + obstacle.width / 2) {
                    ball.x = left - ball.radius;
                    ball.speedX = -Math.abs(ball.speedX);
                } else {
                    ball.x = right + ball.radius;
                    ball.speedX = Math.abs(ball.speedX);
                }

            } else {

                if (ball.y < top + obstacle.height / 2) {
                    ball.y = top - ball.radius;
                    ball.speedY = -Math.abs(ball.speedY);
                } else {
                    ball.y = bottom + ball.radius;
                    ball.speedY = Math.abs(ball.speedY);
                }
            }
        }
    }
}


// ======================================================
// 22. 小球与砖块碰撞
// ======================================================

function checkBrickCollision(ball) {

    if (!ball.inside) {
        return;
    }

    for (const brick of bricks) {

        if (!brick.alive) {
            continue;
        }

        const hit =
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height;

        if (!hit) {
            continue;
        }

        if (effects.pierce <= 0) {
            ball.speedY *= -1;
        }

        destroyBrick(brick);

        break;
    }
}


// ======================================================
// 23. 击碎砖块
// ======================================================

function destroyBrick(brick) {

    if (!brick.alive) {
        return;
    }

    brick.alive = false;

    score += 10;

    // 30%概率掉落水果
    if (Math.random() < 0.3) {

        const randomIndex = Math.floor(
            Math.random() * fruitTypes.length
        );

        fruits.push({

            x: brick.x + brick.width / 2,

            y: brick.y + brick.height / 2,

            speedY: 2.5,

            type: fruitTypes[randomIndex]
        });
    }

    // 检查是否还有砖块
    const remaining = bricks.some(function (item) {
        return item.alive;
    });

    if (!remaining) {

        if (level < maxLevel) {
            gameState = "levelComplete";
        } else {
            gameState = "won";
        }
    }
}


// ======================================================
// 24. 小球与挡板碰撞
// ======================================================

function checkPaddleCollision(ball) {

    // 只有迷宫外的小球可以碰到挡板
    if (ball.inside || ball.speedY <= 0) {
        return;
    }

    const hit =
        ball.x + ball.radius > paddle.x &&
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height;

    if (hit) {

        ball.y = paddle.y - ball.radius;

        const hitPosition =
            (ball.x - (paddle.x + paddle.width / 2)) /
            (paddle.width / 2);

        // 控制反弹角度
        ball.speedX = hitPosition * ballBaseSpeed;

        ball.speedY = -Math.sqrt(
            Math.max(
                1,
                ballBaseSpeed * ballBaseSpeed -
                ball.speedX * ball.speedX
            )
        );

        // 减速效果
        if (effects.slow > 0) {
            ball.speedX *= 0.75;
            ball.speedY *= 0.75;
        }
    }
}


// ======================================================
// 25. 失去生命
// ======================================================

function loseLife() {

    lives--;

    if (lives <= 0) {

        gameState = "lost";

        isPaused = false;

        updatePauseButton();

        return;
    }

    // 还有生命，重新准备小球
    createWaitingBall();

    gameState = "ready";
}


// ======================================================
// 26. 更新小球
// ======================================================

function updateBalls() {

    for (let i = balls.length - 1; i >= 0; i--) {

        const ball = balls[i];

        // 保存移动前的位置，用于判断阻挡物碰撞方向
        const oldX = ball.x;
        const oldY = ball.y;

        // 移动小球
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        // 画布左边界
        if (ball.x - ball.radius < 0) {

            ball.x = ball.radius;

            ball.speedX = Math.abs(ball.speedX);
        }

        // 画布右边界
        if (ball.x + ball.radius > canvas.width) {

            ball.x = canvas.width - ball.radius;

            ball.speedX = -Math.abs(ball.speedX);
        }

        // 画布顶部
        if (ball.y - ball.radius < 0) {

            ball.y = ball.radius;

            ball.speedY = Math.abs(ball.speedY);
        }

        // 迷宫墙壁
        checkChamberCollision(ball);

        // 固定阻挡物
        if (ball.inside) {
            checkObstacleCollision(ball, oldX, oldY);
        }

        // 砖块
        checkBrickCollision(ball);

        // 挡板
        checkPaddleCollision(ball);

        // 小球掉出画布
        if (ball.y - ball.radius > canvas.height) {
            balls.splice(i, 1);
        }
    }

    // 所有小球消失
    if (
        balls.length === 0 &&
        gameState === "playing"
    ) {
        loseLife();
    }
}


// ======================================================
// 27. 三倍小球
// ======================================================

function tripleBalls() {

    if (balls.length === 0) {
        return;
    }

    const originalBall = balls[0];

    const speed = ballBaseSpeed * 0.8;

    const newBall1 = createBall(
        originalBall.x,
        originalBall.y,
        -speed,
        -speed,
        originalBall.inside
    );

    const newBall2 = createBall(
        originalBall.x,
        originalBall.y,
        speed,
        -speed,
        originalBall.inside
    );

    // 如果正在减速，新球也减速
    if (effects.slow > 0) {

        newBall1.speedX *= 0.75;
        newBall1.speedY *= 0.75;

        newBall2.speedX *= 0.75;
        newBall2.speedY *= 0.75;
    }

    balls.push(newBall1, newBall2);
}


// ======================================================
// 28. 激活水果效果
// ======================================================

function activateFruit(effect) {

    switch (effect) {

        case "triple":
            tripleBalls();
            break;

        case "life":
            lives++;
            break;

        case "wide":
            effects.wide = 600;
            paddle.width = 160;
            break;

        case "slow":
            effects.slow = 600;

            for (const ball of balls) {
                ball.speedX *= 0.75;
                ball.speedY *= 0.75;
            }
            break;

        case "pierce":
            effects.pierce = 600;
            break;

        case "bonus":
            score += 100;
            break;
    }
}


// ======================================================
// 29. 更新水果
// ======================================================

function updateFruits() {

    for (let i = fruits.length - 1; i >= 0; i--) {

        const fruit = fruits[i];

        fruit.y += fruit.speedY;

        // 接住水果
        const caught =
            fruit.x > paddle.x &&
            fruit.x < paddle.x + paddle.width &&
            fruit.y + 12 >= paddle.y &&
            fruit.y <= paddle.y + paddle.height;

        if (caught) {

            activateFruit(fruit.type.effect);

            fruits.splice(i, 1);

            continue;
        }

        // 水果掉出画布
        if (fruit.y > canvas.height) {
            fruits.splice(i, 1);
        }
    }
}


// ======================================================
// 30. 更新道具计时
// ======================================================

function updateEffects() {

    if (effects.wide > 0) {

        effects.wide--;

        if (effects.wide === 0) {
            paddle.width = originalPaddleWidth;
        }
    }

    if (effects.slow > 0) {
        effects.slow--;
    }

    if (effects.pierce > 0) {
        effects.pierce--;
    }
}


// ======================================================
// 31. 更新挡板和游戏
// ======================================================

function updateGame() {

    if (gameState !== "playing") {
        return;
    }

    if (isPaused) {
        return;
    }

    updatePaddle();

    updateBalls();

    updateFruits();

    updateEffects();
}


// ======================================================
// 32. 绘制迷宫墙壁
// ======================================================

function drawChamber() {

    // 房间背景
    ctx.fillStyle = "#202b45";

    ctx.fillRect(
        chamber.x,
        chamber.y,
        chamber.width,
        chamber.height
    );

    ctx.fillStyle = "#8b9bb4";

    // 左墙
    ctx.fillRect(
        chamber.x - 5,
        chamber.y,
        5,
        chamber.height
    );

    // 右墙
    ctx.fillRect(
        chamber.right,
        chamber.y,
        5,
        chamber.height
    );

    // 顶墙
    ctx.fillRect(
        chamber.x,
        chamber.y - 5,
        chamber.width,
        5
    );

    // 底墙左边
    ctx.fillRect(
        chamber.x,
        chamber.bottom,
        entrance.x - chamber.x,
        5
    );

    // 底墙右边
    ctx.fillRect(
        entrance.x + entrance.width,
        chamber.bottom,
        chamber.right - entrance.x - entrance.width,
        5
    );

    // 入口
    ctx.fillStyle = "#69db7c";

    ctx.fillRect(
        entrance.x,
        chamber.bottom,
        entrance.width,
        5
    );

    // 入口文字
    ctx.fillStyle = "#69db7c";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "自由入口",
        entrance.x + entrance.width / 2,
        chamber.bottom + 22
    );
}


// ======================================================
// 33. 绘制砖块
// ======================================================

function drawBricks() {

    for (const brick of bricks) {

        if (!brick.alive) {
            continue;
        }

        ctx.fillStyle = brick.color;

        ctx.fillRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height
        );

        // 高光
        ctx.fillStyle = "rgba(255,255,255,0.25)";

        ctx.fillRect(
            brick.x + 3,
            brick.y + 3,
            brick.width - 6,
            4
        );

        // 边框
        ctx.strokeStyle = "rgba(0,0,0,0.2)";

        ctx.strokeRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height
        );
    }
}


// ======================================================
// 34. 绘制固定阻挡物
// ======================================================

function drawObstacles() {

    for (const obstacle of obstacles) {

        // 阻挡物主体
        ctx.fillStyle = "#64748b";

        ctx.fillRect(
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );

        // 高光
        ctx.fillStyle = "#cbd5e1";

        ctx.fillRect(
            obstacle.x + 3,
            obstacle.y + 2,
            Math.max(0, obstacle.width - 6),
            3
        );

        // 边框
        ctx.strokeStyle = "#e2e8f0";

        ctx.strokeRect(
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );
    }
}


// ======================================================
// 35. 绘制小球
// ======================================================

function drawBalls() {

    for (const ball of balls) {

        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffffff";

        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 10;

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.closePath();
    }
}


// ======================================================
// 36. 绘制挡板
// ======================================================

function drawPaddle() {

    ctx.fillStyle = "#74c0fc";

    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );

    ctx.fillStyle = "#d0ebff";

    ctx.fillRect(
        paddle.x + 5,
        paddle.y + 3,
        paddle.width - 10,
        4
    );
}


// ======================================================
// 37. 绘制水果
// ======================================================

function drawFruits() {

    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const fruit of fruits) {

        ctx.fillText(
            fruit.type.emoji,
            fruit.x,
            fruit.y
        );
    }
}


// ======================================================
// 38. 绘制游戏信息
// ======================================================

function drawInfo() {

    ctx.fillStyle = "#ffffff";

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.font = "19px Arial";

    ctx.fillText("得分：" + score, 70, 525);

    ctx.fillText("生命：" + lives, 240, 525);

    ctx.fillText(
        "关卡：" + level + "/" + maxLevel,
        400,
        525
    );

    // 当前关卡名称
    ctx.font = "15px Arial";

    ctx.fillStyle = "#ffd43b";

    ctx.fillText(
        levelSettings[level - 1].name,
        70,
        555
    );

    // 当前能力
    const activeEffects = [];

    if (effects.wide > 0) {
        activeEffects.push("挡板加宽");
    }

    if (effects.slow > 0) {
        activeEffects.push("小球减速");
    }

    if (effects.pierce > 0) {
        activeEffects.push("穿透砖块");
    }

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        "当前能力：" + (activeEffects.join("、") || "无"),
        240,
        555
    );

    // 剩余砖块
    const remainingBricks = bricks.filter(
        brick => brick.alive
    ).length;

    ctx.fillStyle = "#a5b4fc";

    ctx.fillText(
        "剩余砖块：" + remainingBricks,
        70,
        585
    );

    ctx.fillText(
        "按 P 键暂停或继续",
        240,
        585
    );
}


// ======================================================
// 39. 绘制游戏提示
// ======================================================

function drawGameMessage() {

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 等待开始
    if (gameState === "ready") {

        ctx.fillStyle = "rgba(0,0,0,0.55)";

        ctx.fillRect(
            150,
            270,
            500,
            100
        );

        ctx.fillStyle = "#ffffff";

        ctx.font = "25px Arial";

        ctx.fillText(
            "点击画面或按空格开始",
            canvas.width / 2,
            310
        );

        ctx.font = "16px Arial";

        ctx.fillText(
            "控制挡板接住水果，不要让小球掉落！",
            canvas.width / 2,
            345
        );
    }

    // 暂停
    if (isPaused) {

        ctx.fillStyle = "rgba(0,0,0,0.75)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#ffffff";

        ctx.font = "42px Arial";

        ctx.fillText(
            "游戏已暂停",
            canvas.width / 2,
            canvas.height / 2 - 20
        );

        ctx.font = "22px Arial";

        ctx.fillText(
            "按 P 键或点击继续游戏",
            canvas.width / 2,
            canvas.height / 2 + 35
        );
    }

    // 当前关卡完成
    if (gameState === "levelComplete") {

        ctx.fillStyle = "rgba(0,0,0,0.75)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#69db7c";

        ctx.font = "40px Arial";

        ctx.fillText(
            "第 " + level + " 关完成！",
            canvas.width / 2,
            canvas.height / 2 - 35
        );

        ctx.fillStyle = "#ffffff";

        ctx.font = "22px Arial";

        ctx.fillText(
            "点击画面或按空格进入下一关",
            canvas.width / 2,
            canvas.height / 2 + 25
        );
    }

    // 全部通关
    if (gameState === "won") {

        ctx.fillStyle = "rgba(0,0,0,0.8)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#ffd43b";

        ctx.font = "42px Arial";

        ctx.fillText(
            "恭喜全部通关！",
            canvas.width / 2,
            canvas.height / 2 - 45
        );

        ctx.fillStyle = "#ffffff";

        ctx.font = "25px Arial";

        ctx.fillText(
            "最终得分：" + score,
            canvas.width / 2,
            canvas.height / 2 + 10
        );

        ctx.font = "19px Arial";

        ctx.fillText(
            "点击画面重新开始",
            canvas.width / 2,
            canvas.height / 2 + 60
        );
    }

    // 游戏失败
    if (gameState === "lost") {

        ctx.fillStyle = "rgba(0,0,0,0.8)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#ff6b6b";

        ctx.font = "45px Arial";

        ctx.fillText(
            "游戏结束",
            canvas.width / 2,
            canvas.height / 2 - 45
        );

        ctx.fillStyle = "#ffffff";

        ctx.font = "25px Arial";

        ctx.fillText(
            "最终得分：" + score,
            canvas.width / 2,
            canvas.height / 2 + 10
        );

        ctx.font = "19px Arial";

        ctx.fillText(
            "点击画面重新开始",
            canvas.width / 2,
            canvas.height / 2 + 60
        );
    }
}


// ======================================================
// 40. 绘制整个游戏
// ======================================================

function drawGame() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // 背景
    ctx.fillStyle = "#111827";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawChamber();

    drawBricks();

    drawObstacles();

    drawBalls();

    drawPaddle();

    drawFruits();

    drawInfo();

    drawGameMessage();
}


// ======================================================
// 41. 游戏主循环
// ======================================================

function gameLoop() {

    updateGame();

    drawGame();

    requestAnimationFrame(gameLoop);
}


// ======================================================
// 42. 初始化游戏
// ======================================================

function initGame() {

    setLevelDifficulty();

    createBricks();

    createObstacles();

    createWaitingBall();

    paddle.x = canvas.width / 2 - paddle.width / 2;

    updatePauseButton();

    gameLoop();
}


// ======================================================
// 43. 启动游戏
// ======================================================

initGame();
