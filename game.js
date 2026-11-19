
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