// ======== 烟花效果 =========
    const canvas = document.getElementById('fireworks');
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const colors = [
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
    loop();

    // 自动播放烟花 5 秒
    const fireworkInterval = setInterval(() => {
      const x = Math.random() * w;
      const y = Math.random() * h * 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      fireworks.push(new Firework(x, y, color));
    }, 200);

    setTimeout(() => {
      clearInterval(fireworkInterval);
      document.getElementById('start-container').classList.add('fade-in');
    }, 5000);

    // 点击按钮后播放动效再跳转
    const button = document.getElementById('start-button');
    button.addEventListener('click', () => {
      button.style.transform = 'scale(1.3)';
      button.style.boxShadow = '0 0 60px rgba(0, 255, 200, 1)';
      setTimeout(() => {
        window.location.href = 'AniCrea.html';
      }, 800);
    });