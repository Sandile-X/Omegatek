// ===== PARTICLES.JS CONFIGURATION =====

// Particles configuration for animated background
const particlesConfig = {
    particles: {
        number: {
            value: 50,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: ["#0066cc", "#0099ff", "#ffd700", "#00cc66"]
        },
        shape: {
            type: "circle",
            stroke: {
                width: 0,
                color: "#000000"
            },
            polygon: {
                nb_sides: 5
            }
        },
        opacity: {
            value: 0.6,
            random: true,
            anim: {
                enable: true,
                speed: 1,
                opacity_min: 0.1,
                sync: false
            }
        },
        size: {
            value: 3,
            random: true,
            anim: {
                enable: true,
                speed: 2,
                size_min: 0.1,
                sync: false
            }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: "#ffffff",
            opacity: 0.2,
            width: 1
        },
        move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
                enable: true,
                rotateX: 600,
                rotateY: 1200
            }
        }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: {
                enable: true,
                mode: "repulse"
            },
            onclick: {
                enable: true,
                mode: "push"
            },
            resize: true
        },
        modes: {
            grab: {
                distance: 140,
                line_linked: {
                    opacity: 1
                }
            },
            bubble: {
                distance: 400,
                size: 40,
                duration: 2,
                opacity: 8,
                speed: 3
            },
            repulse: {
                distance: 100,
                duration: 0.4
            },
            push: {
                particles_nb: 4
            },
            remove: {
                particles_nb: 2
            }
        }
    },
    retina_detect: true
};

// Initialize particles when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if particles.js is loaded
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', particlesConfig);
        console.log('Particles.js initialized successfully');
    } else {
        console.log('Particles.js not loaded, using fallback animation');
        initFallbackAnimation();
    }
});

// Fallback animation if particles.js fails to load
function initFallbackAnimation() {
    const particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) return;
    
    // Create CSS-based particles as fallback
    for (let i = 0; i < 50; i++) {
        createFallbackParticle(particlesContainer);
    }
}

function createFallbackParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'fallback-particle';
    
    const size = Math.random() * 4 + 2;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        left: ${x}%;
        top: ${y}%;
        animation: floatFallback ${duration}s infinite linear;
        animation-delay: ${delay}s;
        pointer-events: none;
    `;
    
    container.appendChild(particle);
}

// Add fallback animation CSS
const fallbackStyle = document.createElement('style');
fallbackStyle.textContent = `
    @keyframes floatFallback {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-20px) rotate(360deg);
            opacity: 0;
        }
    }
    
    .fallback-particle {
        z-index: 1;
    }
`;
document.head.appendChild(fallbackStyle);

// Dynamic particles configuration based on device performance
function adjustParticlesForDevice() {
    const canvas = document.querySelector('#particles-js canvas');
    if (!canvas) return;
    
    const isLowEndDevice = navigator.hardwareConcurrency < 4 || 
                          window.devicePixelRatio < 2 || 
                          window.innerWidth < 768;
    
    if (isLowEndDevice) {
        // Reduce particles for low-end devices
        particlesConfig.particles.number.value = 25;
        particlesConfig.particles.move.speed = 1;
        particlesConfig.interactivity.events.onhover.enable = false;
    }
}

// Call adjustment function after a delay
setTimeout(adjustParticlesForDevice, 2000);