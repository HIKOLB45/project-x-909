/**
 * ULTRACANOPY PRO - ADVANCED 3D RENDERING SYSTEM
 * Версія: 2.1.0 (2026)
 * Технологія: WebGL / Three.js
 * Цей файл реалізує повний цикл візуалізації металоконструкції.
 */

const Engine3D = {
    // Основні компоненти Three.js
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    // Групи об'єктів
    canopyGroup: null,
    snowMesh: null,
    
    // Налаштування матеріалів
    materials: {
        steel: new THREE.MeshStandardMaterial({ 
            color: 0x475569, 
            metalness: 0.9, 
            roughness: 0.3,
            name: "Anthracite Steel" 
        }),
        roof: new THREE.MeshStandardMaterial({ 
            color: 0x1e293b, 
            side: THREE.DoubleSide, 
            flatShading: true 
        }),
        snow: new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0,
            roughness: 0.9 
        })
    },

    /**
     * Запуск рушія
     */
    init() {
        const container = document.getElementById('viewport-container');
        if (!container) return;

        // 1. Ініціалізація сцени та туману для глибини
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020617);
        this.scene.fog = new THREE.Fog(0x020617, 15, 35);

        // 2. Камера з широким кутом огляду
        this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(10, 8, 12);

        // 3. Рендерер з оптимізацією під GPU
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // 4. Світло: Сонце + Навколишнє
        this.setupLights();

        // 5. Побудова конструкції
        this.canopyGroup = new THREE.Group();
        this.buildCanopy();
        this.scene.add(this.canopyGroup);

        // 6. Допоміжні елементи (сітка)
        const grid = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
        grid.position.y = -0.01;
        this.scene.add(grid);

        // Запуск анімації
        this.animate();
        this.handleResize();
        
        Utils.log("3D Engine: Візуалізація готова.");
    },

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(15, 25, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        this.scene.add(sun);

        const fillLight = new THREE.PointLight(0x3b82f6, 0.5);
        fillLight.position.set(-10, 5, 10);
        this.scene.add(fillLight);
    },

    /**
     * Створення детальної моделі навісу
     */
    buildCanopy() {
        // Очищення групи перед побудовою
        while(this.canopyGroup.children.length > 0) { 
            this.canopyGroup.remove(this.canopyGroup.children[0]); 
        }

        // --- СТОВПИ (Pillars) ---
        const pillarPositions = [
            { x: -2.4, z: -2.4, h: 2.5 }, { x: 0, z: -2.4, h: 2.5 }, { x: 2.4, z: -2.4, h: 2.5 },
            { x: -2.4, z: 2.4, h: 2.0 },  { x: 0, z: 2.4, h: 2.0 },  { x: 2.4, z: 2.4, h: 2.0 }
        ];

        pillarPositions.forEach(p => {
            const geo = new THREE.BoxGeometry(0.06, p.h, 0.06); // 60x60 за стандартом
            const mesh = new THREE.Mesh(geo, this.materials.steel);
            mesh.position.set(p.x, p.h / 2, p.z);
            mesh.castShadow = true;
            this.canopyGroup.add(mesh);
        });

        // --- ГОЛОВНІ БАЛКИ (80x40) ---
        const mainBeamGeo = new THREE.BoxGeometry(5.0, 0.08, 0.04);
        const b1 = new THREE.Mesh(mainBeamGeo, this.materials.steel);
        b1.position.set(0, 2.5, -2.4);
        this.canopyGroup.add(b1);

        const b2 = new THREE.Mesh(mainBeamGeo, this.materials.steel);
        b2.position.set(0, 2.0, 2.4);
        this.canopyGroup.add(b2);

        // --- КРОКВИ (60x40) ---
        const angle = Math.atan2(0.5, 4.8);
        for (let i = 0; i < 7; i++) {
            const x = -2.4 + (i * 0.8);
            const trussGeo = new THREE.BoxGeometry(0.04, 0.06, 5.0);
            const truss = new THREE.Mesh(trussGeo, this.materials.steel);
            truss.position.set(x, 2.25, 0);
            truss.rotation.x = angle;
            this.canopyGroup.add(truss);
        }

        // --- ДАХ ТА СНІГ ---
        const roofGeo = new THREE.PlaneGeometry(5.2, 5.2);
        const roof = new THREE.Mesh(roofGeo, this.materials.roof);
        roof.rotation.x = Math.PI / 2 + angle;
        roof.position.set(0, 2.28, 0);
        roof.receiveShadow = true;
        this.canopyGroup.add(roof);

        // Сніговий шар (динамічний)
        const snowGeo = new THREE.BoxGeometry(5.2, 0.01, 5.2);
        this.snowMesh = new THREE.Mesh(snowGeo, this.materials.snow);
        this.snowMesh.rotation.x = angle;
        this.snowMesh.position.set(0, 2.30, 0);
        this.canopyGroup.add(this.snowMesh);
    },

    /**
     * Оновлення візуалізації снігу на основі даних калькулятора
     * @param {number} depth - товщина в метрах
     */
    updateSnow(depth) {
        if (!this.snowMesh) return;
        
        const opacity = Math.min(depth * 4, 1); // Сніг стає видимим при глибині
        this.materials.snow.opacity = opacity;
        
        if (depth > 0) {
            this.snowMesh.scale.y = depth * 100; // Збільшуємо товщину меша
            this.snowMesh.position.y = 2.30 + (depth / 2);
        }
    },

    handleResize() {
        window.addEventListener('resize', () => {
            const container = document.getElementById('viewport-container');
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        });
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Автоматичне повільне обертання
        this.canopyGroup.rotation.y += 0.001;
        
        this.renderer.render(this.scene, this.camera);
    }
};

/**
 * Глобальна функція для калькулятора
 */
function updateSnowVisual(depth) {
    Engine3D.updateSnow(depth);
}

// Запуск при завантаженні
window.addEventListener('DOMContentLoaded', () => Engine3D.init());

/**
 * КІНЕЦЬ ФАЙЛУ engine3d.js
 * Всі системи синхронізовані. Проєкт UltraCanopy Pro готовий до роботи.
 */
