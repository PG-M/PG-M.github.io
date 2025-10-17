// init

console.clear();

gsap.registerPlugin(Draggable, InertiaPlugin, Physics2DPlugin);

const $stage = document.querySelector('.stage');
const stageSize = {
    w: $stage.clientWidth,
    h: $stage.clientHeight,
};
const resizeObserver = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    stageSize.w = Math.round(width);
    stageSize.h = Math.round(height);
});

resizeObserver.observe($stage);

// util

const distance = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
}

const length = (x, y) => {
    return Math.sqrt(x * x + y * y);
}

const angle = (x1, y1, x2, y2) => {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}

// Paricles!

const spawnParticle = ({
    className,
    cssVars = {},
    text = '',
    startX,
    startY,
    scale = 1,
    duration,
    delay = 0,
    velocity,
    angle,
    gravity,
}) => {
    const $el = document.createElement('div');
    $el.classList.add(className);
    $el.innerText = text;
    Object.keys(cssVars).forEach((key) => {
        $el.style[key] = cssVars[key];
    });

    gsap.set($el, {
        x: startX,
        y: startY,
        xPercent: -50,
        yPercent: -50,
        scale: scale,
    });

    const tl = gsap.timeline({
        delay,
        onStart: () => {
            $stage.appendChild($el);
        },
        onComplete: () => {
            $el.remove();
        }
    });

    tl.to($el, {
        duration,
        physics2D: { velocity, angle, gravity },
    }, 0);
    tl.to($el, {
        duration,
        opacity: 0,
    }, 0);
}

// Creature!

const CreatureStates = {
    spawning: 'spawning',
    idle: 'idle',
    pulling: 'pulling',
    dragging: 'dragging',
    dropping: 'dropping',
    leaving: 'leaving',
};

const createGroup = ({
    color = 'yellow',
    size = '80',
    leg = '40',
}) => {
    const html = `
  <div class="group" style="--color: ${color}; --leg: ${leg}px; --size: ${size}px;">
    <div class="dragger"></div>
    <div class="creature">
      <div class="leg"></div>
      <div class="leg"></div>
      <div class="body"></div>
    </div>
  </div>
  `;

    const template = document.createElement('div');
    template.innerHTML = html;

    return template.querySelector('.group');
}

class CreatureState {
    constructor(creature) {
        this.creature = creature;
    }
    onEnter(fromState) { }
    onExit(toState) { }
}

class CreatureIdleState extends CreatureState {
    onEnter(fromState) {
        if (fromState === CreatureStates.spawning) {
            this.spawningToIdle();
        } else if (fromState === CreatureStates.pulling) {
            this.pullingToIdle();
        }
    }

    spawningToIdle() {
        this.transition?.kill();

        const tl = gsap.timeline({
            onComplete: this.playIdleAnimation,
        });

        tl.fromTo(this.creature.$el, {
            scaleX: 0,
            scaleY: 0,
        }, {
            scaleX: 1,
            scaleY: 1,
            ease: 'elastic.out',
            duration: gsap.utils.random(0.8, 1),
        }, 0);

        this.transition = tl;
    }

    pullingToIdle() {
        this.transition?.kill();

        const tl = gsap.timeline({
            onComplete: this.playIdleAnimation,
        });

        tl.set(this.creature.$dragger, {
            x: this.creature.startX,
            y: this.creature.startY,
        });
        tl.to(this.creature.$el, {
            scaleX: 1,
            scaleY: 1,
            ease: 'elastic.out',
            duration: 1,
        }, 0);
        tl.set(this.creature.$el, {
            rotation: 0,
        });

        this.transition = tl;
    }

    playIdleAnimation = () => {
        const tl = gsap.timeline({
            repeat: -1,
        });

        tl.add(() => {
            for (let i = 0; i < 3; i++) {
                spawnParticle({
                    className: 'snooze-particle',
                    text: 'Z',
                    startX: this.creature.startX + 20,
                    startY: this.creature.startY - 20,
                    velocity: gsap.utils.random(90, 110),
                    angle: gsap.utils.random(-55, -65),
                    gravity: -100,
                    duration: 2,
                    delay: i * 0.25,
                });
            }
        }, 0.5);
        tl.to(this.creature.$el, {
            scaleX: 1.1,
            scaleY: 0.9,
            duration: 2,
        }, 0.25);
        tl.to(this.creature.$el, {
            scaleX: 1,
            scaleY: 1,
            duration: 1,
        }, 2.5);

        this.idleAnimation = tl;
    }

    onExit(toState) {
        this.idleAnimation?.kill();
        this.transition?.kill();
    }
}

class CreaturePullingState extends CreatureState {
    onEnter(fromState) {
        gsap.ticker.add(this.tick);
    }

    onExit(toState) {
        gsap.ticker.remove(this.tick);
    }

    tick = () => {
        const d = distance(this.creature.startX, this.creature.startY, this.creature.dragX, this.creature.dragY);
        const a = angle(this.creature.startX, this.creature.startY, this.creature.dragX, this.creature.dragY);
        const stretch = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0, stageSize.h * 0.5, 0, 1, d));

        gsap.set(this.creature.$el, {
            rotation: a,
            scaleX: 1 + stretch * 2,
            scaleY: 1 - (stretch * 0.25),
        });

        if (stretch === 1) {
            this.creature.setState(CreatureStates.dragging);

            for (let i = 0; i < 20; i++) {
                spawnParticle({
                    className: 'ground-particle',
                    startX: this.creature.startX + gsap.utils.random(-this.creature.radius * 0.5, this.creature.radius * 0.5),
                    startY: this.creature.startY,
                    scale: gsap.utils.random(0.25, 1),
                    velocity: gsap.utils.random(400, 800),
                    angle: a + gsap.utils.random(-40, 40),
                    gravity: 1200,
                    duration: gsap.utils.random(0.5, 2),
                    delay: 0,
                });
            }
        }
    }
}

class CreatureDraggingState extends CreatureState {
    onEnter(fromState) {
        gsap.ticker.add(this.tick);

        const tl = gsap.timeline({
            onComplete: () => this.lockStretch = false,
        });

        this.lockStretch = true;
        this.transition = tl.to(this.creature.$el, {
            scaleX: 1,
            scaleY: 1,
            ease: 'elastic.out',
            duration: 1,
        }, 0);
    }

    onExit(toState) {
        gsap.ticker.remove(this.tick);
    }

    tick = () => {
        const { deltaX, deltaY, x, y, } = this.creature.draggable;
        const l = length(deltaX, deltaY);

        this.creature.qX(x);
        this.creature.qY(y);

        if (l > 20) {
            this.transition.kill();
            this.lockStretch = false;
        }

        if (this.lockStretch) {
            return;
        }

        const a = angle(0, 0, deltaX, deltaY);
        const stretch = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0, 50, 0, 1, l));

        gsap.set(this.creature.$el, {
            rotation: a,
            scaleX: 1 + stretch * 0.5,
            scaleY: 1 - (stretch * 0.125),
        });
    }
}

class CreatureDroppingState extends CreatureState {
    onEnter() {
        this.creature.draggable.disable();

        const tl = gsap.timeline({
            onComplete: () => {
                this.creature.setState(CreatureStates.leaving);
            }
        });
        const d = stageSize.h - this.creature.dragY;
        const duration = d * 0.002;
        const squish = gsap.utils.mapRange(0, stageSize.h, 0.25, 1, d);

        tl.set(this.creature.$el, { zIndex: 1 });
        tl.to(this.creature.$el, {
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            duration: duration * 0.5,
        }, 0)
        // tl.to(this.creature.$el, {
        //     y: stageSize.h - this.creature.radius,
        //     ease: 'power3.in',
        //     duration: duration,
        // }, 0);

        tl.to(this.creature.$el, {
            y: stageSize.h - this.creature.radius,
            ease: 'power3.in',
            duration: duration,
            onStart: () => { // 动画开始时立即触发
                const duangSound = document.getElementById('duang-sound');
                if (duangSound) {
                    duangSound.currentTime = 0;
                    duangSound.play();
                }
            }
        }, 0);


        // tl.add(() => {
        //     const duangSound = document.getElementById('duang-sound');
        //     if (duangSound) {
        //         duangSound.currentTime = 0;
        //         duangSound.play();
        //     }
        // });
        tl.add(() => {
            const count = gsap.utils.mapRange(0, stageSize.h, 4, 20, d) | 0;
            const impact = gsap.utils.mapRange(0, stageSize.h, 1, 4, d);

            for (let i = 0; i < count; i++) {
                spawnParticle({
                    className: 'ground-particle',
                    startX: this.creature.dragX,
                    startY: this.creature.startY,
                    scale: gsap.utils.random(0.25, 1),
                    velocity: gsap.utils.random(100, 300) * impact,
                    angle: -90 + gsap.utils.random(-30, 30),
                    gravity: 1200,
                    duration: gsap.utils.random(1, 4),
                    delay: 0,
                });
            }
        });
        tl.set(this.creature.$el, {
            transformOrigin: '50% 100%'
        })
        tl.to(this.creature.$el, {
            scaleY: 1 - 0.75 * squish,
            scaleX: 1 + 0.5 * squish,
            duration: 0.25,
            ease: 'expo.out',
        });
        tl.to(this.creature.$el, {
            scaleY: 1,
            scaleX: 1,
            duration: 1,
            ease: 'elastic.out',
        });
        tl.set(this.creature.$el, {
            transformOrigin: '50% 50%',
        });
    }
}

class CreatureLeavingState extends CreatureState {
    onEnter() {
        const tl = gsap.timeline({
            onComplete: this.creature.handleComplete
        });
        const legs = Array.from(this.creature.$el.querySelectorAll('.leg'));
        const body = this.creature.$el;
        const gait = ((this.creature.radius + this.creature.leg) * Math.PI * 2) / 8;
        const dir = gsap.utils.random([-1, 1]);
        const start = 0;
        const steps = Math.ceil(dir === 1 ? (this.creature.dragX / gait) : (stageSize.w - this.creature.dragX) / gait) + 1;

        tl.set(body, {
            scaleX: dir,
            rotation: 0,
        });
        tl.to(body, {
            y: stageSize.h - (this.creature.radius + this.creature.leg),
            duration: .5,
            ease: 'back.out(3)',
        }, start);
        tl.to(legs, {
            y: this.creature.leg * 0.5 + this.creature.radius,
            duration: .125,
            ease: 'expo.out',
        }, start);
        tl.to(legs[0], {
            rotation: '+=45',
            duration: 1,
        });

        const step = (even) => {
            tl.to(body, {
                rotation: dir === 1 ? '-=45' : '+=45',
                x: (dir === 1 ? '-=' : '+=') + gait,
                duration: 0.25,
                ease: 'circ.inOut'
            }, '-=0.25');

            tl.to(legs[even ? 1 : 0], {
                rotation: '+=90',
                duration: 0.5,
                ease: 'back.out'
            });
        }

        for (let i = 0; i < steps; i++) {
            step(i % 2 === 0);
        }
    }
}

class Creature {
    previousState = null;
    state = CreatureStates.spawning;
    startX = 0;
    startY = 0;
    width = 80;
    height = 80;
    leg = 40;

    constructor(x, y, color, size, leg, onComplete) {
        this.$group = createGroup({
            color,
            size,
            leg,
        });
        $stage.appendChild(this.$group);

        this.$dragger = this.$group.querySelector('.dragger');
        this.$el = this.$group.querySelector('.creature');
        this.onComplete = onComplete;
        this.startX = x;
        this.startY = y;
        this.width = size;
        this.height = size;
        this.leg = leg,
            this.radius = this.width * 0.5;

        gsap.set([this.$dragger, this.$el], {
            xPercent: -50,
            yPercent: -50,
            x: this.startX,
            y: this.startY,
        });

        this.qX = gsap.quickTo(this.$el, 'x', { duration: 0.2, ease: 'back.out' });
        this.qY = gsap.quickTo(this.$el, 'y', { duration: 0.2, ease: 'back.out' });

        this.draggable = Draggable.create(this.$dragger, {
            bounds: { top: 0, left: 0, width: stageSize.w, height: stageSize.h + this.radius },
            onDragStart: this.onDragStart,
            onDragEnd: this.onDragEnd,
        })[0];

        this.states = {
            [CreatureStates.idle]: new CreatureIdleState(this),
            [CreatureStates.pulling]: new CreaturePullingState(this),
            [CreatureStates.dragging]: new CreatureDraggingState(this),
            [CreatureStates.dropping]: new CreatureDroppingState(this),
            [CreatureStates.leaving]: new CreatureLeavingState(this),
        };

        this.setState(CreatureStates.idle);
    }

    setState(state) {
        const prev = this.states[this.state];
        const next = this.states[state];

        if (prev) { prev.onExit(state); }
        if (next) { next.onEnter(this.state); }

        this.previousState = this.state;
        this.state = state;
    }

    onDragStart = () => {
        this.setState(CreatureStates.pulling);
    }

    onDragEnd = () => {
        if (this.state === CreatureStates.dragging) {
            this.setState(CreatureStates.dropping);
        } else if (this.state === CreatureStates.pulling) {
            this.setState(CreatureStates.idle);
        }
    }

    handleComplete = () => {
        this.destroy();
        this.onComplete();
    }

    destroy() {
        this.draggable.kill();
        this.$group.remove();
    }

    get dragX() { return this.draggable.x }
    get dragY() { return this.draggable.y }
}

// loop

let creatureCount = 0;

const spawnCreature = ({
    startX = gsap.utils.random(100, stageSize.w - 100, 1),
    color = gsap.utils.random(['gold', 'salmon', 'lightpink', 'coral', 'violet', 'slateblue']),
    size = gsap.utils.random(40, 180, 1),
    leg = size * gsap.utils.random(0.1, 0.8, 0.1),
} = {}) => {
    creatureCount++;

    const creature = new Creature(startX, stageSize.h, color, size, leg, () => {
        if (--creatureCount < 5) {
            spawnCreature();
        }
        spawnCreature();
    });
};

spawnCreature({
    color: 'gold',
    size: 160,
    leg: 60,
    startX: stageSize.w * 0.5,
});

// 音效选择功能
document.addEventListener('DOMContentLoaded', function () {
    const soundOptions = document.querySelectorAll('.sound-option');
    let selectedSound = 'default-sound'; 

    soundOptions.forEach(option => {
        option.addEventListener('click', function () {
            // 移除之前的选择
            soundOptions.forEach(opt => opt.classList.remove('selected'));
            // 设置新的选择
            this.classList.add('selected');
            selectedSound = this.getAttribute('data-sound');
            console.log('选择的音效:', selectedSound); // 调试用
        });
    });

    // 保存原始方法
    const originalDropMethod = CreatureDroppingState.prototype.onEnter;

    // 重写方法以使用选择的音效
    CreatureDroppingState.prototype.onEnter = function () {
        this.creature.draggable.disable();

        const tl = gsap.timeline({
            onComplete: () => {
                this.creature.setState(CreatureStates.leaving);
            }
        });

        const d = stageSize.h - this.creature.dragY;
        const duration = d * 0.002;
        const squish = gsap.utils.mapRange(0, stageSize.h, 0.25, 1, d);

        tl.set(this.creature.$el, { zIndex: 1 });
        tl.to(this.creature.$el, {
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            duration: duration * 0.5,
        }, 0);

        tl.to(this.creature.$el, {
            y: stageSize.h - this.creature.radius,
            ease: 'power3.in',
            duration: duration,
            onStart: () => {
                // 使用选择的音效
                const sound = document.getElementById(selectedSound);
                if (sound) {
                    console.log('播放音效:', selectedSound); // 调试用
                    sound.currentTime = 0;
                    sound.play().catch(e => {
                        console.error('播放音效失败:', e);
                    });
                } else {
                    console.error('未找到音效元素:', selectedSound);
                }
            }
        }, 0);

        // ... 其余动画代码保持不变
        tl.add(() => {
            const count = gsap.utils.mapRange(0, stageSize.h, 4, 20, d) | 0;
            const impact = gsap.utils.mapRange(0, stageSize.h, 1, 4, d);

            for (let i = 0; i < count; i++) {
                spawnParticle({
                    className: 'ground-particle',
                    startX: this.creature.dragX,
                    startY: this.creature.startY,
                    scale: gsap.utils.random(0.25, 1),
                    velocity: gsap.utils.random(100, 300) * impact,
                    angle: -90 + gsap.utils.random(-30, 30),
                    gravity: 1200,
                    duration: gsap.utils.random(1, 4),
                    delay: 0,
                });
            }
        });

        tl.set(this.creature.$el, {
            transformOrigin: '50% 100%'
        });

        tl.to(this.creature.$el, {
            scaleY: 1 - 0.75 * squish,
            scaleX: 1 + 0.5 * squish,
            duration: 0.25,
            ease: 'expo.out',
        });

        tl.to(this.creature.$el, {
            scaleY: 1,
            scaleX: 1,
            duration: 1,
            ease: 'elastic.out',
        });

        tl.set(this.creature.$el, {
            transformOrigin: '50% 50%',
        });
    };
});