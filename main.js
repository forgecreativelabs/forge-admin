document.addEventListener('DOMContentLoaded', () => {
    // --- Aesthetic Enhancements ---
    // 1. Ambient Cursor Flare
    const cursorFlare = document.createElement('div');
    cursorFlare.className = 'cursor-flare';
    document.body.appendChild(cursorFlare);
    document.addEventListener('mousemove', (e) => {
        cursorFlare.style.left = e.clientX + 'px';
        cursorFlare.style.top = e.clientY + 'px';
    });

    // 2. Scroll Reveal Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.level-1, .level-2').forEach(el => {
        el.classList.add('fade-up');
        observer.observe(el);
    });
    // --------------------------------

    // 1. Form Validation logic
    const form = document.getElementById('contact-form');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        
        const inputs = form.querySelectorAll('input, textare'); // fix: textarea
        const actualInputs = form.querySelectorAll('input, textarea');
        actualInputs.forEach(input => {
            const group = input.closest('.input-group');
            if(!input.value.trim()) {
                group.classList.add('has-error');
                isValid = false;
            } else {
                if(input.type === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if(!emailRegex.test(input.value)) {
                        group.classList.add('has-error');
                        isValid = false;
                    } else {
                        group.classList.remove('has-error');
                    }
                } else {
                    group.classList.remove('has-error');
                }
            }
        });

        if(isValid) {
            // Simulate sending data & success state
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'TRANSMITTING...';
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';

            setTimeout(() => {
                form.reset();
                btn.innerHTML = originalText;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
                
                const successMsg = document.getElementById('form-success');
                successMsg.style.display = 'block';
                setTimeout(() => {
                    successMsg.style.display = 'none';
                }, 5000);
            }, 1500);
        }
    });

    // 2. Service Filter Switching
    const serviceChips = document.querySelectorAll('.service-chip');
    const servicePanels = document.querySelectorAll('.service-panel');
    
    serviceChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active chip
            serviceChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            const filter = chip.dataset.filter;
            
            // Filter service panels
            servicePanels.forEach(panel => {
                const category = panel.dataset.category;
                
                if (filter === 'all' || category === filter) {
                    panel.classList.remove('hidden');
                    panel.classList.add('fade-in');
                    // Remove fade-in class after animation completes
                    setTimeout(() => panel.classList.remove('fade-in'), 600);
                } else {
                    panel.classList.add('hidden');
                    panel.classList.remove('fade-in');
                }
            });
        });
    });

    // 3. 3D Tilt Effect on Cards
    const tiltElements = document.querySelectorAll('.data-card, .floating-panel');
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
            const rotateY = ((x - centerX) / centerX) * 10;
            
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // 4. Interactive Hero Canvas Engine
    const heroCanvas = document.getElementById('hero-canvas');
    const heroSection = document.getElementById('hero-section');
    
    // Cursor Ring Element  
    const cursorRing = document.createElement('div');
    cursorRing.className = 'cursor-ring';
    document.body.appendChild(cursorRing);

    if (heroCanvas && heroSection) {
        const hCtx = heroCanvas.getContext('2d');
        let hW, hH;
        let heroParticles = [];
        let geometries = [];
        let pulseWaves = [];
        let time = 0;
        
        const heroMouse = { x: -9999, y: -9999, radius: 200, active: false, clicking: false };
        
        // Track mouse relative to hero section
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            heroMouse.x = e.clientX - rect.left;
            heroMouse.y = e.clientY - rect.top;
            heroMouse.active = true;
            cursorRing.style.left = e.clientX + 'px';
            cursorRing.style.top = e.clientY + 'px';
            cursorRing.classList.add('visible');
        });
        
        heroSection.addEventListener('mouseleave', () => {
            heroMouse.active = false;
            cursorRing.classList.remove('visible');
        });
        
        // Click to spawn pulse waves
        heroSection.addEventListener('mousedown', () => {
            heroMouse.clicking = true;
            cursorRing.classList.add('expanded');
            pulseWaves.push({ x: heroMouse.x, y: heroMouse.y, radius: 0, maxRadius: 300, opacity: 1 });
        });
        heroSection.addEventListener('mouseup', () => {
            heroMouse.clicking = false;
            cursorRing.classList.remove('expanded');
        });
        
        function heroResize() {
            const rect = heroSection.getBoundingClientRect();
            hW = heroCanvas.width = rect.width;
            hH = heroCanvas.height = rect.height;
        }
        window.addEventListener('resize', heroResize);
        heroResize();
        
        // --- Particle Class (multi-depth) ---
        class HeroParticle {
            constructor(depth) {
                this.depth = depth; // 1=far, 2=mid, 3=near
                this.x = Math.random() * hW;
                this.y = Math.random() * hH;
                this.baseX = this.x;
                this.baseY = this.y;
                this.vx = (Math.random() - 0.5) * (0.15 * depth);
                this.vy = (Math.random() - 0.5) * (0.15 * depth);
                this.size = (Math.random() * 1.5 + 0.5) * depth * 0.7;
                this.density = (Math.random() * 15 + 5) * depth;
                this.opacity = (0.2 + Math.random() * 0.4) * (depth / 3);
                this.hue = Math.random() > 0.6 ? 0 : 15; // cyan or violet
                this.pulsePhase = Math.random() * Math.PI * 2;
            }
            update() {
                // Floating drift
                this.baseX += this.vx;
                this.baseY += this.vy;
                if (this.baseX < 0 || this.baseX > hW) this.vx *= -1;
                if (this.baseY < 0 || this.baseY > hH) this.vy *= -1;
                
                this.x = this.baseX;
                this.y = this.baseY;
                
                // Mouse repulsion force
                if (heroMouse.active) {
                    let dx = heroMouse.x - this.x;
                    let dy = heroMouse.y - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    let effectRad = heroMouse.radius * (this.depth / 2);
                    
                    if (dist < effectRad) {
                        let force = (effectRad - dist) / effectRad;
                        let pushX = (dx / dist) * force * this.density * 0.8;
                        let pushY = (dy / dist) * force * this.density * 0.8;
                        this.x -= pushX;
                        this.y -= pushY;
                        
                        // Color shift near mouse
                        this.hue = 0 + (15 - 0) * (1 - force);
                    }
                }
                
                // Subtle pulse effect
                this.currentOpacity = this.opacity + Math.sin(time * 0.02 + this.pulsePhase) * 0.1;
            }
            draw() {
                let s = this.hue === 0 ? `hsla(0, 85%, 60%,` : `hsla(15, 90%, 55%,`;
                hCtx.fillStyle = s + `${this.currentOpacity})`;
                hCtx.beginPath();
                hCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                hCtx.fill();
            }
        }
        
        // --- Geometry Class (floating shapes) ---
        class FloatingGeometry {
            constructor() {
                this.x = Math.random() * hW;
                this.y = Math.random() * hH;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;
                this.size = 15 + Math.random() * 40;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.008;
                this.opacity = 0.04 + Math.random() * 0.06;
                this.baseOpacity = this.opacity;
                this.sides = [3, 4, 6][Math.floor(Math.random() * 3)]; // tri, diamond, hex
                this.hue = Math.random() > 0.5 ? 0 : 15;
                this.parallaxFactor = 0.02 + Math.random() * 0.04;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.rotationSpeed;
                
                if (this.x < -this.size) this.x = hW + this.size;
                if (this.x > hW + this.size) this.x = -this.size;
                if (this.y < -this.size) this.y = hH + this.size;
                if (this.y > hH + this.size) this.y = -this.size;
                
                // Mouse proximity glow
                if (heroMouse.active) {
                    let dx = heroMouse.x - this.x;
                    let dy = heroMouse.y - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 250) {
                        let intensity = 1 - dist / 250;
                        this.opacity = this.baseOpacity + intensity * 0.15;
                        this.rotationSpeed += intensity * 0.001 * (this.rotationSpeed > 0 ? 1 : -1);
                    } else {
                        this.opacity += (this.baseOpacity - this.opacity) * 0.05;
                    }
                }
            }
            draw() {
                let drawX = this.x;
                let drawY = this.y;
                
                // Parallax offset
                if (heroMouse.active) {
                    drawX += (heroMouse.x - hW / 2) * this.parallaxFactor;
                    drawY += (heroMouse.y - hH / 2) * this.parallaxFactor;
                }
                
                hCtx.save();
                hCtx.translate(drawX, drawY);
                hCtx.rotate(this.rotation);
                
                let sat = this.hue === 0 ? '85%' : '90%';
                let light = this.hue === 0 ? '60%' : '55%';
                hCtx.strokeStyle = `hsla(${this.hue}, ${sat}, ${light}, ${this.opacity})`;
                hCtx.lineWidth = 1;
                
                hCtx.beginPath();
                for (let i = 0; i <= this.sides; i++) {
                    let angle = (i / this.sides) * Math.PI * 2 - Math.PI / 2;
                    let px = Math.cos(angle) * this.size;
                    let py = Math.sin(angle) * this.size;
                    if (i === 0) hCtx.moveTo(px, py);
                    else hCtx.lineTo(px, py);
                }
                hCtx.closePath();
                hCtx.stroke();
                
                hCtx.restore();
            }
        }
        
        // --- Init Hero Entities ---
        function initHero() {
            heroParticles = [];
            geometries = [];
            
            // Depth layer 1 (far) - many small dim particles
            let count1 = Math.floor((hW * hH) / 12000);
            for (let i = 0; i < count1; i++) heroParticles.push(new HeroParticle(1));
            
            // Depth layer 2 (mid)
            let count2 = Math.floor((hW * hH) / 25000);
            for (let i = 0; i < count2; i++) heroParticles.push(new HeroParticle(2));
            
            // Depth layer 3 (near) - fewer, larger bright particles
            let count3 = Math.floor((hW * hH) / 50000);
            for (let i = 0; i < count3; i++) heroParticles.push(new HeroParticle(3));
            
            // Floating geometries
            let geoCount = Math.max(6, Math.floor((hW * hH) / 100000));
            for (let i = 0; i < geoCount; i++) geometries.push(new FloatingGeometry());
        }
        
        // --- Draw Connections ---
        function drawConnections() {
            // Only connect nearby depth-2 and depth-3 particles for performance
            const connectable = heroParticles.filter(p => p.depth >= 2);
            for (let i = 0; i < connectable.length; i++) {
                for (let j = i + 1; j < connectable.length; j++) {
                    let dx = connectable[i].x - connectable[j].x;
                    let dy = connectable[i].y - connectable[j].y;
                    let distSq = dx * dx + dy * dy;
                    let maxDistSq = 18000;
                    
                    if (distSq < maxDistSq) {
                        let alpha = (1 - distSq / maxDistSq) * 0.12;
                        
                        // Brighten connections near mouse
                        if (heroMouse.active) {
                            let mx = (connectable[i].x + connectable[j].x) / 2;
                            let my = (connectable[i].y + connectable[j].y) / 2;
                            let md = Math.sqrt((heroMouse.x - mx) ** 2 + (heroMouse.y - my) ** 2);
                            if (md < 200) alpha += (1 - md / 200) * 0.15;
                        }
                        
                        hCtx.beginPath();
                        hCtx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
                        hCtx.lineWidth = 0.8;
                        hCtx.moveTo(connectable[i].x, connectable[i].y);
                        hCtx.lineTo(connectable[j].x, connectable[j].y);
                        hCtx.stroke();
                    }
                }
            }
        }
        
        // --- Draw Pulse Waves ---
        function drawPulseWaves() {
            for (let i = pulseWaves.length - 1; i >= 0; i--) {
                let pw = pulseWaves[i];
                pw.radius += 4;
                pw.opacity -= 0.015;
                
                if (pw.opacity <= 0 || pw.radius > pw.maxRadius) {
                    pulseWaves.splice(i, 1);
                    continue;
                }
                
                let gradient = hCtx.createRadialGradient(pw.x, pw.y, pw.radius * 0.8, pw.x, pw.y, pw.radius);
                gradient.addColorStop(0, `rgba(239, 68, 68, 0)`);
                gradient.addColorStop(0.7, `rgba(255, 255, 255, ${pw.opacity * 0.3})`);
                gradient.addColorStop(1, `rgba(239, 68, 68, 0)`);
                
                hCtx.beginPath();
                hCtx.strokeStyle = `rgba(255, 255, 255, ${pw.opacity * 0.5})`;
                hCtx.lineWidth = 2;
                hCtx.arc(pw.x, pw.y, pw.radius, 0, Math.PI * 2);
                hCtx.stroke();
                
                hCtx.fillStyle = gradient;
                hCtx.fill();
            }
        }
        
        // --- Draw Cursor Orbit ---
        function drawCursorOrbit() {
            if (!heroMouse.active) return;
            
            let orbitRadius = heroMouse.clicking ? 60 : 45;
            let orbitCount = heroMouse.clicking ? 8 : 5;
            
            for (let i = 0; i < orbitCount; i++) {
                let angle = (time * 0.03) + (i / orbitCount) * Math.PI * 2;
                let ox = heroMouse.x + Math.cos(angle) * orbitRadius;
                let oy = heroMouse.y + Math.sin(angle) * orbitRadius;
                
                hCtx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 0.05 + i) * 0.2})`;
                hCtx.beginPath();
                hCtx.arc(ox, oy, 2, 0, Math.PI * 2);
                hCtx.fill();
            }
            
            // Mouse crosshair
            let ch = 8;
            hCtx.strokeStyle = `rgba(239, 68, 68, ${0.15 + Math.sin(time * 0.04) * 0.1})`;
            hCtx.lineWidth = 1;
            hCtx.beginPath();
            hCtx.moveTo(heroMouse.x - ch, heroMouse.y);
            hCtx.lineTo(heroMouse.x + ch, heroMouse.y);
            hCtx.moveTo(heroMouse.x, heroMouse.y - ch);
            hCtx.lineTo(heroMouse.x, heroMouse.y + ch);
            hCtx.stroke();
        }
        
        // --- Draw Coordinate Grid Lines Near Mouse ---
        function drawMouseGrid() {
            if (!heroMouse.active) return;
            
            let gridAlpha = 0.03 + Math.sin(time * 0.02) * 0.01;
            hCtx.strokeStyle = `rgba(239, 68, 68, ${gridAlpha})`;
            hCtx.lineWidth = 0.5;
            
            // Horizontal scan line
            hCtx.beginPath();
            hCtx.moveTo(0, heroMouse.y);
            hCtx.lineTo(hW, heroMouse.y);
            hCtx.stroke();
            
            // Vertical scan line
            hCtx.beginPath();
            hCtx.moveTo(heroMouse.x, 0);
            hCtx.lineTo(heroMouse.x, hH);
            hCtx.stroke();
            
            // Corner brackets
            let bSize = 20;
            let bDist = 55;
            hCtx.strokeStyle = `rgba(239, 68, 68, 0.2)`;
            hCtx.lineWidth = 1.5;
            
            // Top-left
            hCtx.beginPath();
            hCtx.moveTo(heroMouse.x - bDist, heroMouse.y - bDist + bSize);
            hCtx.lineTo(heroMouse.x - bDist, heroMouse.y - bDist);
            hCtx.lineTo(heroMouse.x - bDist + bSize, heroMouse.y - bDist);
            hCtx.stroke();
            // Top-right
            hCtx.beginPath();
            hCtx.moveTo(heroMouse.x + bDist - bSize, heroMouse.y - bDist);
            hCtx.lineTo(heroMouse.x + bDist, heroMouse.y - bDist);
            hCtx.lineTo(heroMouse.x + bDist, heroMouse.y - bDist + bSize);
            hCtx.stroke();
            // Bottom-left
            hCtx.beginPath();
            hCtx.moveTo(heroMouse.x - bDist, heroMouse.y + bDist - bSize);
            hCtx.lineTo(heroMouse.x - bDist, heroMouse.y + bDist);
            hCtx.lineTo(heroMouse.x - bDist + bSize, heroMouse.y + bDist);
            hCtx.stroke();
            // Bottom-right
            hCtx.beginPath();
            hCtx.moveTo(heroMouse.x + bDist - bSize, heroMouse.y + bDist);
            hCtx.lineTo(heroMouse.x + bDist, heroMouse.y + bDist);
            hCtx.lineTo(heroMouse.x + bDist, heroMouse.y + bDist - bSize);
            hCtx.stroke();
        }
        
        // --- Main Hero Animation Loop ---
        function heroAnimate() {
            hCtx.clearRect(0, 0, hW, hH);
            time++;
            
            // Update & draw geometries (background layer)
            for (let g of geometries) {
                g.update();
                g.draw();
            }
            
            // Update & draw particles
            for (let p of heroParticles) {
                p.update();
                p.draw();
            }
            
            // Draw connections
            drawConnections();
            
            // Draw mouse interactions
            drawMouseGrid();
            drawCursorOrbit();
            drawPulseWaves();
            
            requestAnimationFrame(heroAnimate);
        }
        
        initHero();
        heroAnimate();
        
        // Re-init on resize
        window.addEventListener('resize', () => {
            heroResize();
            initHero();
        });
    }

    // Also keep the global tech-canvas but make it lighter
    const canvas = document.getElementById('tech-canvas');
    if(canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        
        const mouse = { x: -1000, y: -1000, radius: 150 };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        
        window.addEventListener('mouseout', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 20) + 1;
            }
            update() {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;

                if (distance < mouse.radius) {
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    if (this.x !== this.baseX) {
                        let dx = this.x - this.baseX;
                        this.x -= dx / 20;
                    }
                    if (this.y !== this.baseY) {
                        let dy = this.y - this.baseY;
                        this.y -= dy / 20;
                    }
                }

                this.baseX += this.vx;
                this.baseY += this.vy;

                if(this.baseX < 0 || this.baseX > width) this.vx = -this.vx;
                if(this.baseY < 0 || this.baseY > height) this.vy = -this.vy;
            }
            draw() {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }
        }

        function init() {
            particles = [];
            let numberOfParticles = (width * height) / 15000;
            for(let i=0; i<numberOfParticles; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            for(let i=0; i<particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                
                for(let j=i; j<particles.length; j++) {
                    let dx = particles[i].x - particles[j].x;
                    let dy = particles[i].y - particles[j].y;
                    let distance = dx * dx + dy * dy;
                    
                    if(distance < 15000) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(239, 68, 68, ${0.15 - distance/100000})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }

        init();
        animate();
    }

    // 6. Scroll Motion Blur
    const scrollElements = document.querySelectorAll('header, section, footer');
    let currentScrollY = window.scrollY;
    let scrollVelocity = 0;
    let renderVelocity = 0;

    window.addEventListener('scroll', () => {
        const newScrollY = window.scrollY;
        scrollVelocity = newScrollY - currentScrollY;
        currentScrollY = newScrollY;
    }, { passive: true });

    function renderScrollBlur() {
        renderVelocity += (scrollVelocity - renderVelocity) * 0.5; // Reacts almost instantly to scroll changes
        scrollVelocity *= 0.8; // Sharp decay to prevent lingering blur
        
        const blurAmount = Math.min(Math.abs(renderVelocity) * 0.15, 15); // Higher multiplier for faster blur engagement
        
        if (blurAmount > 0.1) {
            scrollElements.forEach(el => {
                el.style.filter = `blur(${blurAmount}px)`;
            });
        } else {
            scrollElements.forEach(el => {
                if (el.style.filter !== 'none' && el.style.filter !== '') {
                    el.style.filter = 'none';
                }
            });
        }
        requestAnimationFrame(renderScrollBlur);
    }
    renderScrollBlur();

    // 7. Matrix Glitch Hover Effect
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const glitchBtns = document.querySelectorAll('.glitch-btn');

    glitchBtns.forEach(btn => {
        let interval = null;
        
        btn.addEventListener('mouseenter', e => {
            const targetText = btn.dataset.targetText;
            if (!targetText) return;
            
            let iteration = 0;
            clearInterval(interval);
            
            interval = setInterval(() => {
                btn.innerText = targetText.split("").map((letter, index) => {
                    if(letter === " ") return " ";
                    if (index < iteration) {
                        return targetText[index];
                    }
                    return letters[Math.floor(Math.random() * letters.length)];
                }).join("");
                
                if (iteration >= targetText.length) {
                    clearInterval(interval);
                }
                iteration += 1 / 2; // Speed of resolve
            }, 30);
        });

        btn.addEventListener('mouseleave', e => {
            clearInterval(interval);
            btn.innerText = btn.dataset.originalText;
        });
    });

    // 8. Command Center Interactions
    
    // Auth Portal / Identity Core
    const authTrigger = document.getElementById('auth-trigger');
    const authPortal = document.getElementById('auth-portal');
    const closeAuthBtn = document.getElementById('close-auth');
    
    // Auth Views & Forms
    const loginView = document.getElementById('auth-login-view');
    const registerView = document.getElementById('auth-register-view');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Comms Widget
    const commsWidget = document.getElementById('comms-widget');
    const sessionHeader = document.getElementById('session-header');
    
    if (authTrigger && authPortal && closeAuthBtn) {
        authTrigger.addEventListener('click', e => {
            e.preventDefault();
            authPortal.style.display = 'flex';
        });
        
        closeAuthBtn.addEventListener('click', () => {
            authPortal.style.display = 'none';
        });

        // View Toggles
        if (showRegisterLink && showLoginLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginView.style.display = 'none';
                registerView.style.display = 'block';
            });
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                registerView.style.display = 'none';
                loginView.style.display = 'block';
            });
        }
        
    const profileContainer = document.getElementById('profile-container');
    const profileTrigger = document.getElementById('profile-trigger');
    const profileMenu = document.getElementById('profile-menu');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Toggle Profile Dropdown
    if (profileTrigger && profileMenu) {
        profileTrigger.addEventListener('click', () => {
            profileMenu.style.display = profileMenu.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            document.body.classList.add('glitch-shutdown');
            
            setTimeout(() => {
                // Ensure UI is fully reset by forcing a hard reload once screen goes black
                window.location.reload();
            }, 1000); // Wait for the animation length
        });
    }

    function handleSuccessfulAuth(vector) {
        authPortal.style.display = 'none';
        authTrigger.style.display = 'none';
        profileContainer.style.display = 'block';
        profileTrigger.innerText = vector.charAt(0).toUpperCase();
        profileContainer.dataset.vector = vector;
        
        // Authorization Intercept
        const states = JSON.parse(localStorage.getItem('forge_ticket_states')) || {};
        const status = states[vector] || 'unsubmitted';
        
        if (status === 'accepted') {
            if (commsWidget && commsWidget.style.display === 'none') {
                commsWidget.style.display = 'flex';
                commsWidget.classList.add('visible-fade');
                if (typeof loadUserChat === 'function') loadUserChat();
            }
        } else {
            if (commsWidget) commsWidget.style.display = 'none';
        }
    }
    
    // Handle Login Subs
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const vectorInput = document.getElementById('login-vector');
            const passInput = document.getElementById('login-pass');
            const vector = vectorInput.value.trim();
            const pass = passInput.value;
            
            // Fetch credentials from LocalStorage
            const credentials = JSON.parse(localStorage.getItem('forge_credentials')) || {};
            
            // Validate
            if (credentials[vector] && credentials[vector] === pass) {
                handleSuccessfulAuth(vector);
            } else {
                // Fail!
                passInput.style.borderColor = 'var(--error)';
                passInput.value = '';
                passInput.placeholder = 'INVALID CREDENTIALS';
            }
        });
    }
    
    // Handle Reg Subs
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const pass1 = document.getElementById('reg-pass').value;
            const pass2 = document.getElementById('reg-pass-confirm').value;
            const vector = document.getElementById('reg-nom').value.trim() || 'UNKNOWN_OP';
            
            if (pass1 !== pass2) {
                const passInput = document.getElementById('reg-pass-confirm');
                passInput.style.borderColor = 'var(--error)';
                passInput.value = '';
                passInput.placeholder = 'Passwords do not match';
                return;
            }
            
            // Save simulated credentials
            const credentials = JSON.parse(localStorage.getItem('forge_credentials')) || {};
            credentials[vector] = pass1;
            localStorage.setItem('forge_credentials', JSON.stringify(credentials));
            
            handleSuccessfulAuth(vector);
        });
    }
}
const toggleCommsBtn = document.getElementById('toggle-comms');
const fbSendBtn = document.getElementById('fb-send-btn');
    const commsFeed = document.getElementById('comms-feed');
    const directTransmission = document.getElementById('direct-transmission');

    if (commsWidget) {
        // Hardware Voice Call Visualization Engine
        let callAudioContext = null;
        let callMicStream = null;
        let callAnimFrame = null;

        async function startCallVisualizer(barsContainer) {
            try {
                callMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                callAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = callAudioContext.createMediaStreamSource(callMicStream);
                const analyser = callAudioContext.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const bars = barsContainer.querySelectorAll('.bar');
                
                // Disable CSS animations so JS can take over
                bars.forEach(b => b.style.animation = 'none');

                function animate() {
                    if(!callAudioContext) return;
                    analyser.getByteFrequencyData(dataArray);
                    
                    for (let i = 0; i < Math.min(15, bars.length); i++) {
                        let val = dataArray[i * 2] || 10;
                        let scale = Math.max(0.4, (val / 255) * 2.5);
                        if(bars[i]) {
                            bars[i].style.transform = `scaleY(${scale})`;
                            bars[i].style.opacity = scale > 1 ? 1 : 0.7;
                        }
                    }
                    callAnimFrame = requestAnimationFrame(animate);
                }
                animate();
                return true;
            } catch(e) {
                alert("Microphone Permission Denied. Run on a Local Server to test hardware features.");
                return false;
            }
        }

        function stopCallVisualizer() {
            if (callAnimFrame) cancelAnimationFrame(callAnimFrame);
            if (callAudioContext) callAudioContext.close();
            if (callMicStream) callMicStream.getTracks().forEach(t => t.stop());
            callAudioContext = null;
            callMicStream = null;
            callAnimFrame = null;
        }

        // Toggle maximize controls & voice bridge
        const maximizeBtn = document.getElementById('maximize-comms');
        const callBtn = document.getElementById('call-comms');
        const endCallBtn = document.getElementById('end-call-btn');
        const callOverlay = document.getElementById('call-overlay');
        const callStatusText = document.getElementById('call-status-text');
        const voiceBars = callOverlay ? callOverlay.querySelector('.voice-bars') : null;
        
        if (callBtn) {
            callBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const vector = document.getElementById('profile-container').dataset.vector;
                if(!vector) return;
                
                // Pre-fetch mic explicitly for hardware reaction
                const authorized = await startCallVisualizer(voiceBars);
                if (!authorized) return;

                commsWidget.classList.remove('minimized');
                commsWidget.classList.add('maximized');

                callOverlay.style.display = 'flex';
                callStatusText.innerText = 'ESTABLISHING UPLINK...';
                if(voiceBars) {
                    voiceBars.style.opacity = '1';
                }
                endCallBtn.style.display = 'block';
                endCallBtn.innerText = '[ CANCEL ]';
                
                localStorage.setItem('forge_call_state', JSON.stringify({ vector, state: 'ringing', id: Date.now() }));
            });
        }

        if (endCallBtn) {
            endCallBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const vector = document.getElementById('profile-container').dataset.vector;
                
                if (endCallBtn.innerText.includes('ACCEPT')) {
                     const ok = await startCallVisualizer(voiceBars);
                     if (!ok) return;
                     
                     // Sync the UI locally because 'storage' events don't fire on the emitting window
                     if (callStatusText) callStatusText.innerText = 'VOICE UPLINK ACTIVE';
                     if (voiceBars) voiceBars.style.opacity = '1';
                     if (commsWidget) {
                         commsWidget.classList.add('voice-active');
                         commsWidget.classList.remove('maximized');
                         commsWidget.classList.add('minimized');
                     }
                     endCallBtn.innerText = '[ END UPLINK ]';

                     const extras = document.getElementById('user-call-extras');
                     if(extras) extras.style.display = 'flex';

                     localStorage.setItem('forge_call_state', JSON.stringify({ vector, state: 'connected', id: Date.now() }));
                     return;
                }
                
                stopCallVisualizer();
                callOverlay.style.display = 'none';
                if(voiceBars) voiceBars.style.opacity = '0';
                localStorage.setItem('forge_call_state', JSON.stringify({ vector, state: 'ended', id: Date.now() }));
                commsWidget.classList.remove('voice-active');
            });
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (commsWidget.classList.contains('minimized')) {
                    commsWidget.classList.remove('minimized');
                }
                commsWidget.classList.toggle('maximized');
            });
        }
        
        // Message Routing Helper
        function dispatchMessage(msgObj) {
            const vector = document.getElementById('profile-container').dataset.vector || 'UNKNOWN_OP';
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: true });
            
            const states = JSON.parse(localStorage.getItem('forge_ticket_states')) || {};
            let stored = JSON.parse(localStorage.getItem('forge_briefings')) || [];

            // Disconnect old conversation thread if it was archived
            if (states[vector] === 'archived') {
                const archiveSuffix = '_archived_' + Date.now();
                stored.forEach(b => {
                    if (b.vector === vector) b.vector = vector + archiveSuffix;
                });
                states[vector + archiveSuffix] = 'archived';
                delete states[vector];

                // Shift progress tree
                const progressObj = JSON.parse(localStorage.getItem('forge_ticket_progress')) || {};
                if (progressObj[vector] !== undefined) {
                    progressObj[vector + archiveSuffix] = progressObj[vector];
                    delete progressObj[vector];
                    localStorage.setItem('forge_ticket_progress', JSON.stringify(progressObj));
                }
            }

            stored.push({
                identity: 'COMMS_HUB_DIRECT',
                vector: vector,
                time: timestamp,
                ...msgObj
            });
            localStorage.setItem('forge_briefings', JSON.stringify(stored));
            
            // Promote to pending state if not in active communication
            if (states[vector] !== 'accepted') {
                states[vector] = 'pending';
            }
            localStorage.setItem('forge_ticket_states', JSON.stringify(states));

            
            // Re-render feed instantly
            loadUserChat();
        }

        // Send Text Message Helper
        function handleSendMessage() {
            if (directTransmission.value.trim() !== '') {
                dispatchMessage({ type: 'text', payload: directTransmission.value });
                directTransmission.value = '';
            }
        }

        // --- File Attachment Pipeline ---
        const userAttachBtn = document.getElementById('user-attach-btn');
        const userFileInput = document.getElementById('user-file-input');
        if (userAttachBtn && userFileInput) {
            userAttachBtn.addEventListener('click', () => userFileInput.click());
            userFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const mbSize = (file.size / (1024 * 1024)).toFixed(2);
                
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        dispatchMessage({ type: 'image', payload: ev.target.result });
                    };
                    reader.readAsDataURL(file);
                } else {
                    dispatchMessage({ type: 'file', filename: file.name, size: mbSize + ' MB' });
                }
                userFileInput.value = '';
            });
        }

        // --- HW Voice Recording Pipeline ---
        const userVoiceBtn = document.getElementById('user-voice-btn');
        const userCommsFooter = document.getElementById('user-comms-footer');
        const userRecordingOverlay = document.getElementById('user-recording-overlay');
        const userRecordingTimer = document.getElementById('user-recording-timer');
        const userCancelVoice = document.getElementById('user-cancel-voice');
        const userSendVoice = document.getElementById('user-send-voice');
        let voiceInterval;
        let voiceSeconds = 0;
        let hardwareRecorder = null;
        let audioChunks = [];

        async function initializeUserMic() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                hardwareRecorder = new MediaRecorder(stream);
                
                hardwareRecorder.ondataavailable = e => {
                    if (e.data.size > 0) audioChunks.push(e.data);
                };
                
                hardwareRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    audioChunks = [];
                    // Convert to base64 for cross-tab local storage injection
                    const reader = new FileReader();
                    reader.onload = ev => {
                        dispatchMessage({ type: 'voice_real', payload: ev.target.result });
                    };
                    reader.readAsDataURL(audioBlob);
                    
                    // Stop mic tracks physically
                    stream.getTracks().forEach(track => track.stop());
                };
                
                return true;
            } catch (err) {
                alert("Microphone Permission Denied. Ensure you run via Server (localhost) to bypass File:// strict security limits.");
                return false;
            }
        }

        if (userVoiceBtn) {
            userVoiceBtn.addEventListener('click', async () => {
                const authorized = await initializeUserMic();
                if(!authorized) return;
                
                userCommsFooter.style.display = 'none';
                userRecordingOverlay.style.display = 'flex';
                voiceSeconds = 0;
                userRecordingTimer.innerText = '0:00';
                audioChunks = [];
                hardwareRecorder.start();
                
                voiceInterval = setInterval(() => {
                    voiceSeconds++;
                    const m = Math.floor(voiceSeconds / 60);
                    const s = (voiceSeconds % 60).toString().padStart(2, '0');
                    userRecordingTimer.innerText = `${m}:${s}`;
                }, 1000);
            });
        }
        if (userCancelVoice) {
            userCancelVoice.addEventListener('click', () => {
                clearInterval(voiceInterval);
                if(hardwareRecorder && hardwareRecorder.state === 'recording') {
                    // Overwrite stop logic to destroy chunk without sending
                    hardwareRecorder.onstop = () => hardwareRecorder.stream.getTracks().forEach(t=>t.stop());
                    hardwareRecorder.stop();
                }
                userRecordingOverlay.style.display = 'none';
                userCommsFooter.style.display = 'flex';
            });
        }
        if (userSendVoice) {
            userSendVoice.addEventListener('click', () => {
                clearInterval(voiceInterval);
                userRecordingOverlay.style.display = 'none';
                userCommsFooter.style.display = 'flex';
                if(hardwareRecorder && hardwareRecorder.state === 'recording') {
                    hardwareRecorder.stop(); // Triggers the base64 conversion & send cascade
                }
            });
        }

        // Direct Transmission Handling
        let typingTimeout;
        if (directTransmission) {
            directTransmission.addEventListener('input', () => {
                const vector = document.getElementById('profile-container').dataset.vector;
                if (!vector) return;
                
                const ts = JSON.parse(localStorage.getItem('forge_typing_states')) || {};
                ts[vector] = true;
                localStorage.setItem('forge_typing_states', JSON.stringify(ts));
                
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    const tsOff = JSON.parse(localStorage.getItem('forge_typing_states')) || {};
                    tsOff[vector] = false;
                    localStorage.setItem('forge_typing_states', JSON.stringify(tsOff));
                }, 1500);
            });
            
            directTransmission.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const vector = document.getElementById('profile-container').dataset.vector;
                    if (vector) {
                        const tsOff = JSON.parse(localStorage.getItem('forge_typing_states')) || {};
                        tsOff[vector] = false;
                        localStorage.setItem('forge_typing_states', JSON.stringify(tsOff));
                    }
                    handleSendMessage();
                }
            });
        }

        // Facebook Send Button Logic
        if (fbSendBtn) {
            fbSendBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleSendMessage();
            });
        }
        
        // Setup simulated message queue from Contact Form
        const contactForm = document.getElementById('contact-form');
        const formSuccess = document.getElementById('form-success');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const identity = document.getElementById('identity').value;
                const payloadText = document.getElementById('payload').value;
                const vector = document.getElementById('profile-container').dataset.vector;
                
                if (vector) {
                    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: true });
                    
                    // Check for Archived reset scenario
                    const states = JSON.parse(localStorage.getItem('forge_ticket_states')) || {};
                    let stored = JSON.parse(localStorage.getItem('forge_briefings')) || [];

                    if (states[vector] === 'archived') {
                        const archiveSuffix = '_archived_' + Date.now();
                        // Move old timeline to archive wrapper
                        stored.forEach(b => {
                            if (b.vector === vector) b.vector = vector + archiveSuffix;
                        });
                        // Track old wrapper state
                        states[vector + archiveSuffix] = 'archived';

                        // Shift over the historical progress too
                        const progressObj = JSON.parse(localStorage.getItem('forge_ticket_progress')) || {};
                        progressObj[vector + archiveSuffix] = progressObj[vector] || "0";
                        delete progressObj[vector];
                        localStorage.setItem('forge_ticket_progress', JSON.stringify(progressObj));
                    }

                    // Route to Admin System via LocalStorage
                    stored.push({
                        identity: identity || 'Unknown Designation',
                        vector: vector,
                        payload: payloadText,
                        time: timestamp
                    });
                    localStorage.setItem('forge_briefings', JSON.stringify(stored));
                    
                    // Also establish pending state
                    if(states[vector] !== 'accepted') {
                        states[vector] = 'pending';
                        localStorage.setItem('forge_ticket_states', JSON.stringify(states));
                    }
                    
                    if(formSuccess) {
                        formSuccess.innerText = 'TRANSMISSION LOGGED. AWAITING CLEARANCE.';
                        formSuccess.style.color = 'var(--primary)';
                        formSuccess.style.display = 'block';
                    }
                    contactForm.reset();
                    
                    // Force the comms widget to re-render in case the vector was just wiped (Archived split)
                    if (typeof loadUserChat === 'function') {
                        loadUserChat();
                    }
                } else {
                    if (formSuccess) {
                        formSuccess.innerText = 'ERROR: YOU MUST LOG IN TO SUBMIT A BRIEFING.';
                        formSuccess.style.color = 'var(--error)';
                        formSuccess.style.display = 'block';
                    }
                }
            });
        }

        function pushChatMessage(className, msgObj) {
            const div = document.createElement('div');
            div.className = className + ' fade-up visible';
            
            if (msgObj.type === 'image') {
                div.innerHTML = `<img src="${msgObj.payload}" style="max-width: 100%; border-radius: 8px; margin-top: 4px;" alt="Attached Image">`;
            } else if (msgObj.type === 'file') {
                div.innerHTML = `
                    <div class="file-chip" style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 1.5rem;">📎</div>
                        <div style="display: flex; flex-direction: column; overflow: hidden;">
                            <span style="font-weight: bold; font-family: monospace; font-size: 0.8rem; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${msgObj.filename}</span>
                            <span style="font-size: 0.7rem; opacity: 0.7;">${msgObj.size}</span>
                        </div>
                    </div>`;
            } else if (msgObj.type === 'voice') {
                div.innerHTML = `
                    <div class="voice-chip cursor-pointer" style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;" onclick="this.querySelector('.play-icon').innerText = '⏸'; setTimeout(()=>this.querySelector('.play-icon').innerText = '▶', parseInt('${msgObj.duration}'.split(':')[1])*1000)">
                        <div class="play-icon" style="font-size: 1.2rem; color: #10b981;">▶</div>
                        <div class="voice-wave" style="height: 14px; width: 60px; background: repeating-linear-gradient(90deg, currentColor 0px, currentColor 2px, transparent 2px, transparent 4px); opacity: 0.5;"></div>
                        <span style="font-family: monospace; font-size: 0.75rem;">${msgObj.duration}</span>
                    </div>`;
            } else if (msgObj.type === 'voice_real') {
                div.innerHTML = `
                    <div class="voice-chip cursor-pointer" style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;">
                        <audio src="${msgObj.payload}" style="display:none;"></audio>
                        <div class="play-icon" style="font-size: 1.2rem; color: #10b981;">▶</div>
                        <div class="voice-wave" style="height: 14px; width: 60px; background: repeating-linear-gradient(90deg, currentColor 0px, currentColor 2px, transparent 2px, transparent 4px); opacity: 0.5;"></div>
                        <span style="font-family: monospace; font-size: 0.75rem;">${msgObj.duration || 'AUDIO'}</span>
                    </div>`;
                    
                setTimeout(() => {
                    const audioEl = div.querySelector('audio');
                    const playIcon = div.querySelector('.play-icon');
                    if(audioEl && playIcon) {
                        div.addEventListener('click', () => {
                            if(audioEl.paused) {
                                audioEl.play().catch(e => console.error(e));
                                playIcon.innerText = '⏸';
                            } else {
                                audioEl.pause();
                                playIcon.innerText = '▶';
                            }
                        });
                        audioEl.addEventListener('ended', () => playIcon.innerText = '▶');
                    }
                }, 10);
            } else {
                div.innerText = msgObj.payload;
            }
            
            commsFeed.appendChild(div);
            // Auto scroll
            setTimeout(() => { commsFeed.scrollTop = commsFeed.scrollHeight; }, 50);
        }

        // Two-Way Live Sync
        function loadUserChat() {
            const vector = document.getElementById('profile-container').dataset.vector;
            if (!vector) return;
            
            const stored = JSON.parse(localStorage.getItem('forge_briefings')) || [];
            const thread = stored.filter(b => b.vector === vector);
            commsFeed.innerHTML = '';
            
            thread.forEach(msg => {
                if (msg.identity === 'Forge Admin') {
                    pushChatMessage('chat-bubble admin-bubble', msg);
                } else {
                    pushChatMessage('chat-bubble user-bubble', msg);
                }
            });
            loadUserProgress();
        }

        function loadUserProgress() {
            const vector = document.getElementById('profile-container') ? document.getElementById('profile-container').dataset.vector : null;
            if (!vector) return;
            const progressObj = JSON.parse(localStorage.getItem('forge_ticket_progress')) || {};
            const val = parseInt(progressObj[vector] || "0", 10);
            const fill = document.getElementById('client-progress-fill');
            const text = document.getElementById('client-progress-text');
            if (fill && text) {
                switch(val) {
                    case 0:
                        fill.style.width = '10%';
                        text.innerText = 'NOT STARTED';
                        break;
                    case 1:
                        fill.style.width = '40%';
                        text.innerText = 'IN PROGRESS';
                        break;
                    case 2:
                        fill.style.width = '75%';
                        text.innerText = 'UNDER REVIEW';
                        break;
                    case 3:
                        fill.style.width = '100%';
                        text.innerText = 'COMPLETED';
                        fill.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
                        fill.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';
                        break;
                }
                if (val !== 3) {
                    fill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
                    fill.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
                }
            }
        }
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'forge_briefings') {
                if (commsWidget && commsWidget.style.display !== 'none') {
                    loadUserChat();
                }
            } else if (e.key === 'forge_ticket_states') {
                const vector = document.getElementById('profile-container') ? document.getElementById('profile-container').dataset.vector : null;
                if (vector) {
                    const states = JSON.parse(e.newValue || '{}');
                    const status = states[vector] || 'unsubmitted';
                    
                    if (status === 'accepted') {
                        if (commsWidget && commsWidget.style.display === 'none') {
                            commsWidget.style.display = 'flex';
                            commsWidget.classList.add('visible-fade');
                            loadUserChat();
                        }
                    } else {
                        if (commsWidget) commsWidget.style.display = 'none';
                    }
                }
            } else if (e.key === 'forge_ticket_progress') {
                if (commsWidget && commsWidget.style.display !== 'none') {
                    loadUserProgress();
                }
            } else if (e.key === 'forge_call_state') {
                const vector = document.getElementById('profile-container') ? document.getElementById('profile-container').dataset.vector : null;
                if (!vector || !commsWidget || commsWidget.style.display === 'none') return;
                
                // Active Voice Pipeline Interpreter
                const callData = JSON.parse(e.newValue || '{}');
                if (callData.vector === vector) {
                    const callOverlay = document.getElementById('call-overlay');
                    const callStatusText = document.getElementById('call-status-text');
                    const voiceBars = callOverlay ? callOverlay.querySelector('.voice-bars') : null;
                    const endCallBtn = document.getElementById('end-call-btn');
                    
                    if (callData.state === 'admin_ringing') {
                        if (commsWidget) {
                            commsWidget.classList.remove('minimized');
                            commsWidget.classList.add('maximized');
                        }
                        if (callOverlay) callOverlay.style.display = 'flex';
                        if (callStatusText) callStatusText.innerText = 'INCOMING ADMIN UPLINK';
                        if (voiceBars) voiceBars.style.opacity = '0';
                        if (endCallBtn) {
                            endCallBtn.style.display = 'block';
                            endCallBtn.innerText = '[ ACCEPT UPLINK ]';
                        }
                    } else if (callData.state === 'connected') {
                        callStatusText.innerText = 'VOICE UPLINK ACTIVE';
                        if(voiceBars) voiceBars.style.opacity = '1';
                        if(commsWidget) {
                            commsWidget.classList.add('voice-active');
                            commsWidget.classList.remove('maximized');
                            commsWidget.classList.add('minimized');
                        }
                        if(endCallBtn) endCallBtn.innerText = '[ END UPLINK ]';
                        
                        const extras = document.getElementById('user-call-extras');
                        if(extras) extras.style.display = 'flex';
                        
                        const muteBtn = callOverlay.querySelector('.call-mute-btn');
                        const spkrBtn = callOverlay.querySelector('.call-speaker-btn');
                        if(muteBtn && !muteBtn.dataset.bound) {
                            muteBtn.dataset.bound = '1';
                            muteBtn.addEventListener('click', () => {
                                if(callMicStream) {
                                    const audioTrack = callMicStream.getAudioTracks()[0];
                                    if(audioTrack) {
                                        audioTrack.enabled = !audioTrack.enabled;
                                        muteBtn.innerText = audioTrack.enabled ? '🎤' : '🔇';
                                        muteBtn.style.color = audioTrack.enabled ? '#fff' : 'var(--error)';
                                    }
                                }
                            });
                        }
                        if(spkrBtn && !spkrBtn.dataset.bound) {
                            spkrBtn.dataset.bound = '1';
                            spkrBtn.addEventListener('click', () => {
                                const isMuted = spkrBtn.innerText === '🔈';
                                spkrBtn.innerText = isMuted ? '🔊' : '🔈';
                            });
                        }
                    } else if (callData.state === 'declined') {
                        callStatusText.innerText = 'UPLINK DECLINED';
                        stopCallVisualizer();
                        if(voiceBars) voiceBars.style.opacity = '0';
                        setTimeout(() => { if(callOverlay) callOverlay.style.display = 'none'; }, 2000);
                    } else if (callData.state === 'ended') {
                        stopCallVisualizer();
                        const extras = document.getElementById('user-call-extras');
                        if(extras) extras.style.display = 'none';
                        if(callOverlay) callOverlay.style.display = 'none';
                        if(commsWidget) commsWidget.classList.remove('voice-active');
                    }
                }
            }
        });
    }
});
