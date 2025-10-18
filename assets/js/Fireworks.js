// ======== 烟花效果 =========
function initFireworks() {
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    canvas.id = 'fireworks';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    // 设置canvas样式
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';

    window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    });

    const fireworkColors = [
        '#ff3cac', '#784BA0', '#2B86C5', '#0AE448',
        '#FFD700', '#FF4500', '#00FFFF', '#FF6EC7'
    ];

    const fireworks = [];

    class Firework {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.particles = [];

            // 播放烟花音效
            const sound = new Audio('../assets/audios/fireworks.mp3'); // 你的烟花音效文件
            sound.play();

            this.createParticles();
        }

        createParticles() {
            for (let i = 0; i < 120; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const speed = Math.random() * 6 + 2;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx, vy,
                    alpha: 1,
                    size: Math.random() * 2 + 1
                });
            }
        }

        draw() {
            this.particles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        update() {
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05;
                p.alpha -= 0.015;
            });
            this.particles = this.particles.filter(p => p.alpha > 0);
        }
    }

    function loop() {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        fireworks.forEach(fw => {
            fw.update();
            fw.draw();
        });
        requestAnimationFrame(loop);
    }

    // 开始动画循环
    loop();

    // 自动播放烟花 5 秒
    const fireworkInterval = setInterval(() => {
        const x = Math.random() * w;
        const y = Math.random() * h * 0.5;
        const color = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];
        fireworks.push(new Firework(x, y, color));
    }, 200);

    // 5秒后显示开始按钮
    setTimeout(() => {
        clearInterval(fireworkInterval);
        showStartButton();
    }, 5000);

    function showStartButton() {
        // 创建开始按钮容器
        const startContainer = document.createElement('div');
        startContainer.id = 'start-container';
        startContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0,0,0,0.7);
            z-index: 2;
            opacity: 0;
            transition: opacity 1s ease-in-out;
        `;

        // 创建开始按钮
        const button = document.createElement('button');
        button.id = 'start-button';
        button.textContent = '开始体验';
        button.style.cssText = `
            padding: 20px 40px;
            font-size: 24px;
            background: linear-gradient(45deg, #ff3cac, #784BA0);
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 0 20px rgba(255, 60, 172, 0.5);
        `;

        // 添加按钮点击效果
        button.addEventListener('mouseover', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 0 30px rgba(255, 60, 172, 0.8)';
        });

        button.addEventListener('mouseout', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 0 20px rgba(255, 60, 172, 0.5)';
        });

        // 点击按钮跳转
        button.addEventListener('click', () => {
            button.style.transform = 'scale(1.3)';
            button.style.boxShadow = '0 0 60px rgba(0, 255, 200, 1)';

            // 设置访问令牌
            sessionStorage.setItem('anicrea_access', 'granted');

            setTimeout(() => {
                window.location.href = 'AniCrea.html';
            }, 800);
        });

        startContainer.appendChild(button);
        document.body.appendChild(startContainer);

        // 淡入效果
        setTimeout(() => {
            startContainer.style.opacity = '1';
        }, 100);
    }
}

// ======== 访问控制 =========
document.addEventListener('DOMContentLoaded', function () {
    // 多重验证
    const hasAccess = sessionStorage.getItem('fireworks_access') === 'granted';
    const referrer = document.referrer;

    // 检查是否从主页跳转而来
    const isFromMainPage = referrer.includes('index.html') ||
        referrer.includes('/PG-M.github.io/') ||
        referrer.includes('/') || // GitHub Pages 根目录
        referrer === '';

    console.log('访问验证:', { hasAccess, referrer, isFromMainPage });

    if (!hasAccess || !isFromMainPage) {
        // 如果不是正确途径访问，立即跳转回主页
        alert('请从主页正确解锁后访问！');
        sessionStorage.removeItem('fireworks_access');
        window.location.href = 'index.html';
        return;
    }

    // 清除令牌，确保一次性使用
    sessionStorage.removeItem('fireworks_access');

    // 验证通过，显示烟花内容
    initFireworks();
});