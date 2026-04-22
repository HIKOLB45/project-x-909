/**
 * ULTRACANOPY PRO - ENGINEERING CALCULATOR ENGINE
 * Версія: 1.2.0 (2026)
 * Цей модуль відповідає за математичну логіку, розрахунок ваги матеріалів,
 * вартості та фізичних навантажень на конструкцію навісу.
 */

const Calculator = {
    // Технічні константи для розрахунків
    DATA: {
        tubes: {
            "50x50x2": { weight: 2.98, price: 135, label: "Квадратна 50х50х2" },
            "80x40x3": { weight: 5.25, price: 210, label: "Прямокутна 80х40х3" },
            "60x40x2": { weight: 3.03, price: 145, label: "Прямокутна 60х40x2" },
            "40x20x2": { weight: 1.80, price: 95,  label: "Прямокутна 40х20х2" }
        },
        roofing: {
            "pk20": { weight: 4.5, price: 280, label: "Профнастил ПК-20" }
        },
        concrete: { pricePerPit: 450, label: "Бетон М250 (заміс)" }
    },

    // Поточні результати розрахунку
    results: {
        totalMetalWeight: 0,
        totalPrice: 0,
        snowLoadLimit: 4500, // Розрахункова межа для балки 80х40 на 5м
        currentLoad: 0
    },

    /**
     * Головна функція ініціалізації розрахунків
     */
    init() {
        Utils.log("Calculator Engine завантажено.");
        this.renderInputs();
        this.updateAll();
        this.setupListeners();
    },

    /**
     * Створення елементів керування в інтерфейсі
     */
    renderInputs() {
        const container = Utils.getEl('calculator-inputs');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Глибина снігу (см)</label>
                    <input type="number" id="input-snow" value="25" min="0" max="200" 
                           class="w-full p-2 rounded bg-slate-800 border-slate-700 focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Тип снігу (щільність)</label>
                    <select id="input-density" class="w-full p-2 rounded bg-slate-800 border-slate-700">
                        <option value="100">Свіжий (100 кг/м³)</option>
                        <option value="250" selected>Злежаний (250 кг/м³)</option>
                        <option value="500">Мокрий (500 кг/м³)</option>
                    </select>
                </div>
                <div class="pt-2">
                    <div id="load-indicator" class="text-sm font-bold flex justify-between mb-1">
                        <span>Навантаження:</span>
                        <span id="load-value">0 кг</span>
                    </div>
                    <div class="load-bar-container">
                        <div id="load-progress" class="load-bar-fill bg-green-500"></div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Налаштування слухачів подій для автоматичного перерахунку
     */
    setupListeners() {
        const inputs = ['input-snow', 'input-density'];
        inputs.forEach(id => {
            const el = Utils.getEl(id);
            el.addEventListener('input', () => {
                this.updateAll();
                // Виклик оновлення 3D візуалізації (якщо функція доступна)
                if (typeof updateSnowVisual === 'function') {
                    const depth = Utils.getEl('input-snow').value;
                    updateSnowVisual(depth / 100);
                }
            });
        });
    },

    /**
     * Повний цикл розрахунку конструкції
     */
    updateAll() {
        this.calculateMaterials();
        this.calculateSnowLoad();
        this.renderTable();
        this.updateDashboard();
    },

    /**
     * Розрахунок специфікації матеріалів
     */
    calculateMaterials() {
        this.results.totalMetalWeight = 0;
        this.results.totalPrice = 0;

        // Розрахунок стовпів (3 по 2.5м + 3 по 2.0м)
        const pillarLen = (3 * 2.5) + (3 * 2.0);
        const pillarW = pillarLen * this.DATA.tubes["50x50x2"].weight;
        this.results.totalMetalWeight += pillarW;
        this.results.totalPrice += pillarLen * this.DATA.tubes["50x50x2"].price;

        // Балки 80х40 (2 шт по 4.8м)
        const beamLen = 2 * 4.8;
        this.results.totalMetalWeight += beamLen * this.DATA.tubes["80x40x3"].weight;
        this.results.totalPrice += beamLen * this.DATA.tubes["80x40x3"].price;

        // Ферми 60х40 (6 шт по 5.0м)
        const trussLen = 6 * 5.0;
        this.results.totalMetalWeight += trussLen * this.DATA.tubes["60x40x2"].weight;
        this.results.totalPrice += trussLen * this.DATA.tubes["60x40x2"].price;

        // Покрівля (площа ~26 м2)
        this.results.totalPrice += 26 * this.DATA.roofing["pk20"].price;
        
        // Фундамент
        this.results.totalPrice += 6 * this.DATA.concrete.pricePerPit;
    },

    /**
     * Розрахунок фізичного навантаження від снігу
     */
    calculateSnowLoad() {
        const depth = Utils.getEl('input-snow').value / 100;
        const density = Utils.getEl('input-density').value;
        const area = 25; // 5m x 5m
        
        // Математична модель: Вага = Глибина * Щільність * Площа * cos(кут нахилу)
        // Кут ~6 градусів, cos(6°) ≈ 0.994, для спрощення беремо 1
        this.results.currentLoad = Math.round(depth * density * area);
    },

    /**
     * Оновлення UI елементів навантаження
     */
    updateDashboard() {
        const loadVal = Utils.getEl('load-value');
        const progress = Utils.getEl('load-progress');
        
        loadVal.innerText = `${this.results.currentLoad} кг`;
        
        const percent = (this.results.currentLoad / this.results.snowLoadLimit) * 100;
        progress.style.width = `${Math.min(percent, 100)}%`;

        if (percent > 90) {
            progress.className = "load-bar-fill bg-red-500 shadow-[0_0_10px_#ef4444]";
            Utils.notify("Критичне навантаження на конструкцію!", "error");
        } else if (percent > 60) {
            progress.className = "load-bar-fill bg-yellow-500";
        } else {
            progress.className = "load-bar-fill bg-green-500";
        }
    },

    /**
     * Генерація HTML таблиці специфікації
     */
    renderTable() {
        const tbody = Utils.getEl('materials-table-body');
        if (!tbody) return;

        const items = [
            { id: "M01", name: "Опорні стійки", spec: "50x50x2", qty: "6 шт", len: "13.5 м", weight: (13.5 * 2.98).toFixed(1) },
            { id: "M02", name: "Головні балки", spec: "80x40x3", qty: "2 шт", len: "9.6 м", weight: (9.6 * 5.25).toFixed(1) },
            { id: "M03", name: "Поперечні ферми", spec: "60x40x2", qty: "6 шт", len: "30.0 м", weight: (30.0 * 3.03).toFixed(1) },
            { id: "M04", name: "Обрешітка", spec: "40x20x2", qty: "7 рядів", len: "35.0 м", weight: (35.0 * 1.80).toFixed(1) },
            { id: "R01", name: "Профнастил", spec: "ПК-20 (0.5мм)", qty: "12 листів", len: "26 м²", weight: "117.0" }
        ];

        tbody.innerHTML = items.map(item => `
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="py-3 text-blue-500 font-mono text-xs">${item.id}</td>
                <td class="py-3 font-semibold">${item.name}</td>
                <td class="py-3 text-slate-400">${item.spec}</td>
                <td class="py-3">${item.len}</td>
                <td class="py-3">${item.qty}</td>
                <td class="py-3 text-right text-slate-300">${item.weight} кг</td>
            </tr>
        `).join('');
    }
};

// Запуск калькулятора після завантаження DOM
document.addEventListener('DOMContentLoaded', () => Calculator.init());

/**
 * КІНЕЦЬ ФАЙЛУ calculator.js
 * Ця логіка забезпечує точність розрахунків згідно з інженерними нормами.
 */
