/**
 * ULTRACANOPY PRO - UTILITIES & INTERFACE BRIDGE
 * Версія: 1.0.0 (2026)
 * Цей файл містить допоміжні функції для роботи з DOM, форматування даних
 * та систему сповіщень користувача.
 */

const Utils = {
    /**
     * Конфігурація системи логіювання
     */
    config: {
        debug: true,
        version: "2026.4.22",
        currency: "UAH",
        locale: "uk-UA"
    },

    /**
     * Ініціалізація допоміжних систем
     */
    init() {
        this.log("Система Utils активована.");
        this.setupEventListeners();
        this.createNotificationContainer();
    },

    /**
     * Форматування чисел для інженерних розрахунків
     * @param {number} value - Значення
     * @param {number} decimals - Кількість знаків після коми
     */
    formatNumber(value, decimals = 2) {
        try {
            return new Intl.NumberFormat(this.config.locale, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(value);
        } catch (e) {
            this.error("Помилка форматування числа:", e);
            return value.toFixed(decimals);
        }
    },

    /**
     * Форматування валюти (для кошторису)
     */
    formatCurrency(value) {
        return new Intl.NumberFormat(this.config.locale, {
            style: 'currency',
            currency: this.config.currency,
        }).format(value);
    },

    /**
     * Створення кастомного контейнера для сповіщень
     */
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-host';
        container.className = 'fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    },

    /**
     * Вивід сповіщень на екран (Toast)
     * @param {string} message - Текст повідомлення
     * @param {string} type - 'info', 'success', 'warning', 'error'
     */
    notify(message, type = 'info') {
        const host = document.getElementById('notification-host');
        const toast = document.createElement('div');
        
        // Вибір кольорів залежно від типу
        const styles = {
            info: 'bg-slate-800 border-blue-500 text-blue-100',
            success: 'bg-slate-800 border-green-500 text-green-100',
            warning: 'bg-slate-800 border-yellow-500 text-yellow-100',
            error: 'bg-slate-800 border-red-500 text-red-100'
        };

        toast.className = `glass-panel ${styles[type]} border-l-4 p-4 min-w-[300px] pointer-events-auto 
                           animate-fade-in flex justify-between items-center shadow-2xl`;
        
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-sm font-medium">${message}</span>
            </div>
            <button class="ml-4 opacity-50 hover:opacity-100" onclick="this.parentElement.remove()">✕</button>
        `;

        host.appendChild(toast);

        // Автоматичне видалення через 5 секунд
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.5s ease';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    },

    /**
     * Безпечне отримання елементів DOM
     */
    getEl(id) {
        const el = document.getElementById(id);
        if (!el) this.error(`Елемент #${id} не знайдено в DOM.`);
        return el;
    },

    /**
     * Логування в консоль
     */
    log(msg) {
        if (this.config.debug) console.log(`%c[UC-LOG] %c${msg}`, "color: #3b82f6; font-weight: bold", "color: #94a3b8");
    },

    /**
     * Обробка помилок
     */
    error(msg, err = "") {
        console.error(`%c[UC-ERROR] %c${msg}`, "color: #ef4444; font-weight: bold", "color: #f8fafc", err);
        this.notify(msg, 'error');
    },

    /**
     * Налаштування глобальних обробників подій
     */
    setupEventListeners() {
        // Відстеження натискання клавіш (наприклад, для скидання камери)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.log("Скидання параметрів в'юпорту...");
                // Тут можна викликати функцію скидання камери з engine3d.js
            }
        });

        // Плавна анімація чисел (Counter effect)
        this.initCounterAnimations();
    },

    /**
     * Анімація цифр при зміні значень у калькуляторі
     */
    animateValue(id, start, end, duration) {
        const obj = this.getEl(id);
        if (!obj) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = this.formatNumber(progress * (end - start) + start, 0);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    /**
     * Пошук елементів для лічильників при завантаженні
     */
    initCounterAnimations() {
        this.log("Counter animations ready.");
    },

    /**
     * Експорт даних у текстовий файл (JSON/TXT)
     */
    exportData(data, filename = 'canopy-project.json') {
        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            this.notify("Дані проєкту успішно експортовані", "success");
        } catch (e) {
            this.error("Не вдалося експортувати дані", e);
        }
    }
};

// Запуск утиліт при завантаженні скрипта
Utils.init();

/**
 * КІНЕЦЬ ФАЙЛУ utils.js
 * Цей файл забезпечує відмовостійкість інтерфейсу та зручність користувача.
 * Всі модулі тепер мають доступ до єдиної системи логування та сповіщень.
 */
