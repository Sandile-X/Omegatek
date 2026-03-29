/**
 * glb-scroll-explode.js
 * Loads a Draco-compressed GLB model, records each mesh's original
 * position, offsets every mesh outward from the model centre (exploded
 * view), then uses GSAP ScrollTrigger to tween each mesh back to its
 * origin as the user scrolls.
 *
 * Requirements (load these before this script):
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/three@0.134/examples/js/loaders/GLTFLoader.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/three@0.134/examples/js/loaders/DRACOLoader.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
 *
 * Usage:
 *   initGLBScrollExplode('#canvas-container', '/models/my-model.glb', {
 *     explodeRadius: 3,
 *     scrub: 1.5,
 *     dracoDecoderPath: '/libs/draco/',
 *   });
 */

/**
 * @param {string} containerSelector  CSS selector for the wrapper element
 * @param {string} glbUrl             Path to the .glb model
 * @param {object} [opts]
 * @param {number}  [opts.explodeRadius=4]      How far meshes fly out (world units)
 * @param {number}  [opts.scrub=1.5]            GSAP scrub smoothness
 * @param {string}  [opts.start='top 60%']      ScrollTrigger start
 * @param {string}  [opts.end='bottom 20%']     ScrollTrigger end
 * @param {string}  [opts.dracoDecoderPath='/libs/draco/']  Path to Draco WASM decoder
 * @param {boolean} [opts.autoRotate=false]     Gentle idle rotation when not interacting
 */
function initGLBScrollExplode(containerSelector, glbUrl, opts = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  if (typeof THREE === 'undefined') {
    console.error('[glb-scroll-explode] Three.js is not loaded.');
    return;
  }
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('[glb-scroll-explode] GSAP or ScrollTrigger is not loaded.');
    return;
  }

  const {
    explodeRadius    = 4,
    scrub            = 1.5,
    start            = 'top 60%',
    end              = 'bottom 20%',
    dracoDecoderPath = '/libs/draco/',
    autoRotate       = false,
  } = opts;

  gsap.registerPlugin(ScrollTrigger);

  // ── Scene setup ──────────────────────────────────────────────────────────
  const W = container.clientWidth;
  const H = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap at 2x
  renderer.setSize(W, H);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // ── Draco-compressed GLB loader ─────────────────────────────────────────
  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath(dracoDecoderPath);

  const loader = new THREE.GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  // ── Load model ───────────────────────────────────────────────────────────
  loader.load(
    glbUrl,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      // Centre model at origin
      const box    = new THREE.Box3().setFromObject(model);
      const centre = box.getCenter(new THREE.Vector3());
      model.position.sub(centre);

      // Collect all meshes and record their resting positions
      const meshData = [];
      model.traverse((child) => {
        if (!child.isMesh) return;

        const origin = child.getWorldPosition(new THREE.Vector3());

        // Explode direction: away from model centre (normalised)
        const dir = new THREE.Vector3()
          .copy(origin)
          .sub(centre.clone().add(model.position)) // world-space offset
          .normalize();

        // If mesh is at the exact centre, pick a random direction
        if (dir.length() < 0.001) {
          dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        }

        // Save local (not world) origin position
        child.userData._origin = child.position.clone();

        // Apply exploded offset in parent-local space
        const explodeTarget = child.position.clone().addScaledVector(dir, explodeRadius);

        meshData.push({ mesh: child, explodeTarget });
      });

      // Set initial state to fully exploded
      meshData.forEach(({ mesh, explodeTarget }) => {
        mesh.position.copy(explodeTarget);
        mesh.userData._tween = { x: explodeTarget.x, y: explodeTarget.y, z: explodeTarget.z };
      });

      // ── GSAP scroll animation: exploded → assembled ─────────────────────
      // One ScrollTrigger drives all meshes via a shared progress value
      const progress = { value: 0 };

      gsap.to(progress, {
        value: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start,
          end,
          scrub,
        },
        onUpdate() {
          const t = progress.value; // 0 = exploded, 1 = assembled
          meshData.forEach(({ mesh }) => {
            const origin  = mesh.userData._origin;
            const explode = mesh.userData._tween;

            mesh.position.x = explode.x + (origin.x - explode.x) * t;
            mesh.position.y = explode.y + (origin.y - explode.y) * t;
            mesh.position.z = explode.z + (origin.z - explode.z) * t;
          });
        },
      });

      // ── Render loop ───────────────────────────────────────────────────────
      let rafId;
      let angle = 0;

      function renderLoop() {
        rafId = requestAnimationFrame(renderLoop);

        if (autoRotate) {
          angle += 0.004;
          model.rotation.y = angle;
        }

        renderer.render(scene, camera);
      }
      renderLoop();

      // Stop rendering when off-screen (IntersectionObserver for perf)
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          renderLoop();
        } else {
          cancelAnimationFrame(rafId);
        }
      }, { threshold: 0 });
      obs.observe(container);
    },

    // Progress callback (optional)
    (xhr) => {
      if (xhr.total > 0) {
        console.log(`[glb-scroll-explode] Loading: ${Math.round(xhr.loaded / xhr.total * 100)}%`);
      }
    },

    // Error callback
    (err) => {
      console.error('[glb-scroll-explode] Failed to load model:', err);
    }
  );

  // ── Responsive resize ─────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
