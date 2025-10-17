// 注册 Draggable 插件
gsap.registerPlugin(Draggable);

const colors = [
	["rgb(155, 237, 255)", "rgb(3, 127, 154)"],
	["rgb(10, 228, 72)", "rgb(171, 255, 132)"],
	["rgb(255, 135, 9)", "rgb(247, 189, 248)"],
	["rgb(241, 0, 203)", "rgb(254, 197, 251)"],
	["rgb(155, 237, 255)", "rgb(3, 127, 154)"],
	["rgb(10, 228, 72)", "rgb(171, 255, 132)"]
];

const logo = document.querySelector('.logo');
const items = document.querySelectorAll('.img-group svg');
const originalPositions = new Map();

// 密码验证相关变量
const targetSequence = [4, 0, 0, 1]; // 目标序列 1 0 0 8
let currentSequence = []; // 当前拖拽序列
let attemptCount = 0; // 尝试次数
const maxAttempts = 20; // 最大尝试次数
let passwordUnlocked = false; // 密码是否已解锁

// 存储初始位置
items.forEach((item, index) => {
	originalPositions.set(item, {
		x: 0,
		y: 0,
		scale: 1,
		rotation: 0
	});
});

items.forEach((item, i) => {
	const itemColor = colors[i];

	Draggable.create(item, {
		type: "x,y",
		bounds: "body",
		onPress: function () {
			// 如果已经超过最大尝试次数且未解锁，直接返回
			if (attemptCount >= maxAttempts && !passwordUnlocked) {
				return;
			}

			// 保存当前位置
			originalPositions.set(item, {
				x: this.x,
				y: this.y,
				scale: 1,
				rotation: 0
			});

			// 放大并旋转当前拖拽的图标
			gsap.to(item, {
				duration: 0.1,
				scale: 1.2,
				rotate: 'random(-9,9)',
				zIndex: 100
			});

			// 降低其他图标的透明度
			gsap.to(items, {
				duration: 0.1,
				opacity: (index, target) => (target === item) ? 1 : 0.3
			});
		},

		onRelease: function () {
			// 如果已经超过最大尝试次数且未解锁，直接返回
			if (attemptCount >= maxAttempts && !passwordUnlocked) {
				// 强制回到原始位置
				const originalPos = originalPositions.get(item);
				gsap.to(item, {
					duration: 0.4,
					x: originalPos.x,
					y: originalPos.y,
					rotate: originalPos.rotation,
					scale: originalPos.scale,
					ease: 'elastic.out(.45)'
				});

				// 恢复所有图标的透明度
				gsap.to(items, {
					duration: 0.2,
					opacity: 1,
					zIndex: 0
				});
				return;
			}

			const originalPos = originalPositions.get(item);

			// 检查是否在logo上方
			if (Draggable.hitTest(item, logo, 20)) {
				// 记录拖拽的图标索引到序列中
				currentSequence.push(i);
				attemptCount++;

				console.log(`当前序列: ${currentSequence}, 尝试次数: ${attemptCount}`);

				// 检查序列是否匹配
				checkSequence();
			}

			// 平滑回到原始位置
			gsap.to(item, {
				duration: 0.4,
				x: originalPos.x,
				y: originalPos.y,
				rotate: originalPos.rotation,
				scale: originalPos.scale,
				ease: 'elastic.out(.45)'
			});

			// 恢复所有图标的透明度
			gsap.to(items, {
				duration: 0.2,
				opacity: 1,
				zIndex: 0
			});
		},

		onDrag: function () {
			if (!gsap.isTweening(logo)) {
				// 检查是否在logo上方
				if (Draggable.hitTest(item, logo, 20)) {
					// 根据SVG颜色改变logo的渐变颜色
					gsap.to('.logo #gradient stop', {
						attr: { 'stop-color': (n) => itemColor[n] },
						duration: 0.3
					});
				}
			}
		},

		// 移动端触摸优化
		allowNativeTouchScrolling: false,
		allowContextMenu: true,
		zIndexBoost: false
	});
});

// 检查序列是否匹配目标密码
function checkSequence() {
	// 如果序列长度超过4，只保留最近的4个元素
	if (currentSequence.length > 4) {
		currentSequence = currentSequence.slice(-4);
	}

	console.log(`检查序列: ${currentSequence}`);

	// 只有当序列长度达到4时才检查
	if (currentSequence.length === 4) {
		const isMatch = currentSequence.every((value, index) => value === targetSequence[index]);

		if (isMatch && attemptCount <= maxAttempts) {
			passwordUnlocked = true;
			console.log("🎉 密码正确！恭喜你解锁了秘密！");

			// 设置访问令牌
			sessionStorage.setItem('fireworks_access', 'granted');

			// 跳转到烟花页面
			window.location.href = 'Fireworks.html';
			currentSequence = [];
			// 成功后将序列清空，避免重复触发
			currentSequence = [];
		} else if (attemptCount >= maxAttempts && !passwordUnlocked) {
			console.log("❌ 已超过20次尝试，密码功能已锁定。");
			// 超过尝试次数后清空序列
			currentSequence = [];
		}
	}
}

// 窗口大小变化时重置位置
window.addEventListener('resize', () => {
	items.forEach((item) => {
		const draggable = Draggable.get(item);
		if (draggable) {
			draggable.update(true);
		}
	});
});