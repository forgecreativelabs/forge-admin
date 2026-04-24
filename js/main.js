document.addEventListener('DOMContentLoaded', () => {
    // Current Year for Footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Custom Cursor Glow effect
    const cursorGlow = document.querySelector('.cursor-glow');
    
    // Only activate custom cursor on desktop
    if (window.matchMedia("(min-width: 900px)").matches) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursorGlow.style.left = e.clientX + 'px';
                cursorGlow.style.top = e.clientY + 'px';
            });
        });

        // Interactive hover states for cursor
        const interactiveElements = document.querySelectorAll('a, button, .btn, .service-card');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorGlow.style.background = 'radial-gradient(circle closest-side, rgba(230, 57, 70, 0.15), transparent)';
            });
            el.addEventListener('mouseleave', () => {
                cursorGlow.style.background = 'radial-gradient(circle closest-side, rgba(230, 57, 70, 0.05), transparent)';
            });
        });
    }

    // Scroll Animations (Intersection Observer)
    const fadeElements = document.querySelectorAll('.service-card, .step, .section-header');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add a slight delay based on index for staggered effect
                entry.target.style.animation = `fadeUp 0.6s forwards ${index * 0.1}s`;
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => {
        el.style.opacity = '0'; // Initial state
        observer.observe(el);
    });

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(5, 5, 5, 0.98)';
            navbar.style.padding = '15px 0';
        } else {
            navbar.style.background = 'rgba(5, 5, 5, 0.9)';
            navbar.style.padding = '20px 0';
        }

        // Hide navbar on scroll down, show on scroll up
        if (lastScrollY < window.scrollY && window.scrollY > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        lastScrollY = window.scrollY;
    });

    // Contact Modal Logic
    const contactModal = document.getElementById('contact-modal');
    const openContactBtns = document.querySelectorAll('.open-contact-btn');
    const closeContactBtn = document.getElementById('modal-close');

    openContactBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.classList.add('active');
        });
    });

    closeContactBtn.addEventListener('click', () => {
        contactModal.classList.remove('active');
    });

    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            contactModal.classList.remove('active');
        }
    });

    // Set FormSubmit next URL to current page automatically
    const nextInput = document.querySelector('input[name="_next"]');
    if (nextInput) {
        nextInput.value = window.location.href;
    }

    // Toast Notification for "Work" Links
    const workLinks = document.querySelectorAll('a[href="#work"]');
    const toastContainer = document.getElementById('toast-container');

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOutToast 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 4000);
    }

    workLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('ARCHIVE ACCESS DENIED: PORTFOLIO MODULE TEMPORARILY UNAVAILABLE.');
        });
    });

    // AJAX Contact Form Submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>TRANSMITTING...</span>';

            fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    showToast('TRANSMISSION SUCCESSFUL.');
                    contactForm.reset();
                    contactModal.classList.remove('active');
                } else {
                    showToast('ERROR: ADDRESS DEACTIVATED OR REQUIRES CONFIRMATION.');
                }
            }).catch(error => {
                showToast('NETWORK ERROR: TRANSMISSION FAILED.');
            }).finally(() => {
                submitBtn.innerHTML = originalBtnText;
            });
        });
    }

    // WebGL / Canvas Background Setup
    initCanvasAnimation();
});

// Canvas Background Network Animation
function initCanvasAnimation() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    let width, height;
    let particles = [];
    
    const config = {
        particleCount: window.innerWidth > 768 ? 60 : 30,
        particleColor: 'rgba(230, 57, 70, 0.8)',
        lineColor: 'rgba(230, 57, 70, 0.15)',
        particleSize: 1.5,
        defaultSpeed: 0.5,
        variantSpeed: 1,
        defaultRadius: 150,
        variantRadius: 100,
        linkRadius: 200,
    };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.speed = config.defaultSpeed + Math.random() * config.variantSpeed;
            this.directionAngle = Math.floor(Math.random() * 360);
            this.color = config.particleColor;
            this.radius = config.particleSize + Math.random() * 1;
            this.vector = {
                x: Math.cos(this.directionAngle) * this.speed,
                y: Math.sin(this.directionAngle) * this.speed
            };
        }

        update() {
            this.border();
            this.x += this.vector.x;
            this.y += this.vector.y;
        }

        border() {
            if (this.x >= width || this.x <= 0) {
                this.vector.x *= -1;
            }
            if (this.y >= height || this.y <= 0) {
                this.vector.y *= -1;
            }
            if (this.x > width) this.x = width;
            if (this.y > height) this.y = height;
            if (this.x < 0) this.x = 0;
            if (this.y < 0) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function setup() {
        particles = [];
        resize();
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        // Draw links
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(particles[i].x - particles[j].x, 2) + 
                    Math.pow(particles[i].y - particles[j].y, 2)
                );

                if (distance < config.linkRadius) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.closePath();
                    
                    // Fading effect for lines
                    const opacity = 1 - (distance / config.linkRadius);
                    ctx.strokeStyle = `rgba(230, 57, 70, ${opacity * 0.25})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => {
        resize();
        setup();
    });

    setup();
    requestAnimationFrame(draw);
}
