// Landing Page - 3D Gradient Animation Script

// ============================================
// Animated Gradient Mesh Background
// ============================================

class GradientMesh {
    constructor() {
        this.canvas = document.getElementById('gradientCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.time = 0;
        this.mouseX = 0;
        this.mouseY = 0;

        // Gradient points
        this.points = [
            { x: 0.2, y: 0.3, radius: 0.4, color: [232, 160, 176], speed: 0.5 },
            { x: 0.8, y: 0.4, radius: 0.35, color: [200, 168, 212], speed: 0.7 },
            { x: 0.5, y: 0.7, radius: 0.3, color: [139, 175, 142], speed: 0.6 },
            { x: 0.3, y: 0.8, radius: 0.25, color: [253, 220, 230], speed: 0.8 },
        ];

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Track mouse for parallax effect
        document.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        });

        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        this.time += 0.002;

        // Clear with warm cream background
        this.ctx.fillStyle = '#FAF6F0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw gradient mesh
        this.points.forEach((point, index) => {
            const offsetX = Math.sin(this.time * point.speed + index) * 0.1;
            const offsetY = Math.cos(this.time * point.speed + index) * 0.1;

            // Add mouse parallax influence
            const parallaxX = this.mouseX * 0.02;
            const parallaxY = this.mouseY * 0.02;

            const x = (point.x + offsetX + parallaxX) * this.canvas.width;
            const y = (point.y + offsetY + parallaxY) * this.canvas.height;
            const radius = point.radius * Math.min(this.canvas.width, this.canvas.height);

            // Create radial gradient
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(${point.color[0]}, ${point.color[1]}, ${point.color[2]}, 0.25)`);
            gradient.addColorStop(0.5, `rgba(${point.color[0]}, ${point.color[1]}, ${point.color[2]}, 0.12)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        });

        // Apply blur effect via filter
        this.ctx.filter = 'blur(80px)';

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize gradient mesh
const gradientMesh = new GradientMesh();

// ============================================
// Magnetic Button Effect
// ============================================

class MagneticButton {
    constructor(element) {
        this.element = element;
        this.boundingRect = element.getBoundingClientRect();

        this.element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.element.addEventListener('mouseleave', () => this.handleMouseLeave());

        // Update bounding rect on window resize
        window.addEventListener('resize', () => {
            this.boundingRect = element.getBoundingClientRect();
        });
    }

    handleMouseMove(e) {
        const rect = this.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) * 0.3;
        const deltaY = (e.clientY - centerY) * 0.3;

        this.element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }

    handleMouseLeave() {
        this.element.style.transform = 'translate(0, 0)';
    }
}

// Apply magnetic effect to primary CTA
const primaryCTA = document.getElementById('primaryCTA');
if (primaryCTA) {
    new MagneticButton(primaryCTA);
}

// ============================================
// Parallax Scroll Effect
// ============================================

class ParallaxScroll {
    constructor() {
        this.heroContent = document.querySelector('.hero-content');
        this.heroVisual = document.querySelector('.hero-visual');

        window.addEventListener('scroll', () => this.handleScroll());
    }

    handleScroll() {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;

        if (this.heroContent) {
            this.heroContent.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        }

        if (this.heroVisual) {
            this.heroVisual.style.transform = `translateY(${scrolled * parallaxSpeed * 0.7}px)`;
        }
    }
}

// Initialize parallax scroll
const parallaxScroll = new ParallaxScroll();

// ============================================
// 3D Tilt Effect on Floating Cards
// ============================================

class TiltEffect {
    constructor(element, maxTilt = 10) {
        this.element = element;
        this.maxTilt = maxTilt;

        this.element.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
        this.element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.element.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    handleMouseEnter(e) {
        this.element.style.transition = 'transform 0.1s ease';
    }

    handleMouseMove(e) {
        const rect = this.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const percentX = (e.clientX - centerX) / (rect.width / 2);
        const percentY = (e.clientY - centerY) / (rect.height / 2);

        const tiltX = percentY * this.maxTilt;
        const tiltY = -percentX * this.maxTilt;

        this.element.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
    }

    handleMouseLeave() {
        this.element.style.transition = 'transform 0.5s ease';
        this.element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    }
}

// Apply tilt effect to floating cards
const floatingCards = document.querySelectorAll('.floating-card');
floatingCards.forEach(card => {
    new TiltEffect(card, 15);
});

// ============================================
// Smooth Scroll for Anchor Links
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// Intersection Observer for Scroll Animations
// ============================================

class ScrollAnimations {
    constructor() {
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            }
        );

        // Observe elements with animation classes
        const animatedElements = document.querySelectorAll('.hero-content, .hero-visual, .glass-card');
        animatedElements.forEach(el => this.observer.observe(el));
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }
}

// Initialize scroll animations
const scrollAnimations = new ScrollAnimations();

// ============================================
// Performance Optimization
// ============================================

// Reduce animations on low-power mode
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.style.setProperty('--animation-duration', '0.01s');
}

// ============================================
// Console Message
// ============================================

console.log('%c\u273F Petal & Bloom Flower Shop', 'color: #C4708A; font-size: 20px; font-weight: bold;');
console.log('%cBuilt with 3D gradient mesh animations', 'color: #C8A8D4; font-size: 14px;');
console.log('%cExplore the code: https://github.com/your-repo', 'color: #7A9E7E; font-size: 12px;');
