const title = document.getElementById('title');
const password = ['1', '0', '0', '8'];
let sequence = [];  // 累计输入的数字序列
let attemptCount = 0;
const maxAttempts = 15;

// 点击盼盼 = 数字0
title.addEventListener('click', () => {
	if (attemptCount >= maxAttempts) {
		console.log('已锁定，不能再输入');
		return;
	}

	addNumber('0');

	// 翻转 + 放大动画
	gsap.fromTo(title,
		{ rotationY: 0, scale: 1 },
		{
			rotationY: 360,
			scale: 1.5,
			duration: 0.6,
			ease: "power1.inOut",
			onComplete: () => {
				// 动画完成后恢复初始状态
				gsap.to(title, { rotationY: 0, scale: 1, duration: 0.2 });
			}
		}
	);
});

// 拖动数字 1-9
document.querySelectorAll('.lottieItem').forEach(item => {
	const path = item.dataset.path;
	const num = item.dataset.num;

	const animation = lottie.loadAnimation({
		container: item,
		renderer: 'svg',
		loop: true,
		autoplay: false,
		path: path
	});

	let isPlaying = false;

	Draggable.create(item, {
		type: "x,y",
		edgeResistance: 0.65,
		inertia: true,
		onPress: function () {
			if (!this.isDragging) {
				if (isPlaying) {
					animation.stop();
					animation.goToAndStop(0, true);
					isPlaying = false;
				} else {
					animation.play();
					isPlaying = true;
				}
			}
		},
		onDrag: function () {
			const itemRect = item.getBoundingClientRect();
			const titleRect = title.getBoundingClientRect();
			if (itemRect.left < titleRect.right &&
				itemRect.right > titleRect.left &&
				itemRect.top < titleRect.bottom &&
				itemRect.bottom > titleRect.top) {
				title.style.color = '#' + Math.floor(Math.random() * 16777215).toString(16);
			} else {
				title.style.color = '#fff';
			}
		},
		onDragEnd: function () {
			const itemRect = item.getBoundingClientRect();
			const titleRect = title.getBoundingClientRect();

			if (itemRect.left < titleRect.right &&
				itemRect.right > titleRect.left &&
				itemRect.top < titleRect.bottom &&
				itemRect.bottom > titleRect.top) {
				addNumber(num);
			}

			gsap.to(item, { x: 0, y: 0, duration: 0.5 });
		}
	});
});

// 每输入一个数字处理一次
function addNumber(num) {
	if (attemptCount >= maxAttempts) {
		console.log('已锁定，不能再输入');
		return;
	}

	sequence.push(num);
	attemptCount++;
	console.log(`尝试数字: ${num}, 总尝试次数: ${attemptCount}`);

	// 检查序列中是否出现连续密码
	for (let i = 0; i <= sequence.length - password.length; i++) {
		const sub = sequence.slice(i, i + password.length);
		if (sub.join('') === password.join('')) {
			console.log('解锁成功 🎉');
			// 设置访问令牌
			sessionStorage.setItem('fireworks_access', 'granted');

			// 跳转到烟花页面
			window.location.href = 'Fireworks.html';
			sequence = []; // 解锁成功后清空序列
			return;
		}
	}

	if (attemptCount >= maxAttempts) {
		console.log('已达到最大尝试次数，解锁功能锁定');
	}
}

function resizeLottieGrid() {
  const grid = document.getElementById('lottieGrid');
  const items = document.querySelectorAll('.lottieItem');
  const cols = window.innerWidth <= 400 ? 1 : window.innerWidth <= 700 ? 2 : 3; // 列数自适应
  const gap = parseFloat(getComputedStyle(grid).gap) || 0;

  const horizontalPadding = parseFloat(getComputedStyle(grid).paddingLeft) + parseFloat(getComputedStyle(grid).paddingRight) || 0;
  const verticalPadding = parseFloat(getComputedStyle(grid).paddingTop) + parseFloat(getComputedStyle(grid).paddingBottom) || 0;

  // 计算单个格子最大宽度（左右留间距）
  const maxItemWidth = (grid.clientWidth - gap * (cols - 1)) / cols;

  // 计算单个格子最大高度（上下留间距，确保网格总高度不超过可用高度）
  const maxGridHeight = window.innerHeight - verticalPadding - document.getElementById('title').offsetHeight - 20; // 20px额外间距
  const rows = Math.ceil(items.length / cols);
  const maxItemHeight = (maxGridHeight - gap * (rows - 1)) / rows;

  // 最终格子尺寸取宽高中最小值，保证完整显示
  const itemSize = Math.min(maxItemWidth, maxItemHeight);

  items.forEach(item => {
    item.style.width = itemSize + 'px';
    item.style.height = itemSize + 'px';
  });
}

// 页面加载完成和窗口大小改变时调用
window.addEventListener('load', resizeLottieGrid);
window.addEventListener('resize', resizeLottieGrid);
