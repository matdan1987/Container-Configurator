// ===== Service Templates =====
const serviceTemplates = {
    nextcloud: {
        name: 'nextcloud',
        image: 'lscr.io/linuxserver/nextcloud:latest',
        ports: ['80:80', '443:443'],
        volumes: [
            './nextcloud/config:/config',
            './nextcloud/data:/data'
        ],
        environment: [
            'PUID=1000',
            'PGID=1000',
            'TZ=Europe/Berlin'
        ],
        restart: 'unless-stopped'
    },
    jellyfin: {
        name: 'jellyfin',
        image: 'lscr.io/linuxserver/jellyfin:latest',
        ports: ['8096:8096', '8920:8920'],
        volumes: [
            './jellyfin/config:/config',
            './jellyfin/media:/data/media'
        ],
        environment: [
            'PUID=1000',
            'PGID=1000',
            'TZ=Europe/Berlin'
        ],
        restart: 'unless-stopped',
        devices: ['/dev/dri:/dev/dri']
    },
    qbittorrent: {
        name: 'qbittorrent',
        image: 'lscr.io/linuxserver/qbittorrent:latest',
        ports: ['8080:8080', '6881:6881', '6881:6881/udp'],
        volumes: [
            './qbittorrent/config:/config',
            './qbittorrent/downloads:/downloads'
        ],
        environment: [
            'PUID=1000',
            'PGID=1000',
            'TZ=Europe/Berlin',
            'WEBUI_PORT=8080'
        ],
        restart: 'unless-stopped'
    },
    swag: {
        name: 'swag',
        image: 'lscr.io/linuxserver/swag:latest',
        ports: ['443:443', '80:80'],
        volumes: [
            './swag/config:/config'
        ],
        environment: [
            'PUID=1000',
            'PGID=1000',
            'TZ=Europe/Berlin',
            'URL=yourdomain.com',
            'VALIDATION=http',
            'SUBDOMAINS=www'
        ],
        restart: 'unless-stopped',
        capAdd: ['NET_ADMIN']
    },
    mariadb: {
        name: 'mariadb',
        image: 'lscr.io/linuxserver/mariadb:latest',
        ports: ['3306:3306'],
        volumes: [
            './mariadb/config:/config'
        ],
        environment: [
            'PUID=1000',
            'PGID=1000',
            'TZ=Europe/Berlin',
            'MYSQL_ROOT_PASSWORD=rootpassword',
            'MYSQL_DATABASE=mydb',
            'MYSQL_USER=myuser',
            'MYSQL_PASSWORD=mypassword'
        ],
        restart: 'unless-stopped'
    },
    nginx: {
        name: 'nginx',
        image: 'lscr.io/linuxserver/nginx:latest',
        ports: ['80:80', '443:443'],
        volumes: [
            './nginx/config:/config'
        ],
        environment: [
            'PUID=1000',
            'PGID=1000',
            'TZ=Europe/Berlin'
        ],
        restart: 'unless-stopped'
    },
    plex: {
        name: 'plex',
        image: 'lscr.io/linuxserver/plex:latest',
        ports: ['32400:32400'],
        volumes: [
            './plex/config:/config',
            './plex/media:/data/media'
        ],
        environment: [
            'PUID=1000',
            'PGID=1000',
            'VERSION=docker',
            'TZ=Europe/Berlin'
        ],
        restart: 'unless-stopped',
        networkMode: 'host'
    },
    heimdall: {
        name: 'heimdall',
        image: 'lscr.io/linuxserver/heimdall:latest',
        ports: ['80:80', '443:443'],
        volumes: [
            './heimdall/config:/config'
        ],
        environment: [
            'PUID=1000',
            'PGID=1000',
            'TZ=Europe/Berlin'
        ],
        restart: 'unless-stopped'
    },
    postgres: {
        name: 'postgres',
        image: 'postgres:latest',
        ports: ['5432:5432'],
        volumes: [
            './postgres/data:/var/lib/postgresql/data'
        ],
        environment: [
            'POSTGRES_USER=postgres',
            'POSTGRES_PASSWORD=password',
            'POSTGRES_DB=mydb'
        ],
        restart: 'unless-stopped'
    },
    redis: {
        name: 'redis',
        image: 'redis:alpine',
        ports: ['6379:6379'],
        volumes: [
            './redis/data:/data'
        ],
        command: 'redis-server --appendonly yes',
        restart: 'unless-stopped'
    },
    traefik: {
        name: 'traefik',
        image: 'traefik:latest',
        ports: ['80:80', '443:443', '8080:8080'],
        volumes: [
            '/var/run/docker.sock:/var/run/docker.sock:ro',
            './traefik/traefik.yml:/traefik.yml',
            './traefik/acme.json:/acme.json'
        ],
        command: '--api.insecure=true --providers.docker',
        restart: 'unless-stopped'
    },
    custom: {
        name: 'custom',
        image: '',
        ports: [],
        volumes: [],
        environment: [],
        restart: 'unless-stopped'
    }
};

// ===== Application State =====
class AppState {
    constructor() {
        this.containers = [];
        this.currentContainerId = null;
    }

    addContainer(serviceType) {
        const template = JSON.parse(JSON.stringify(serviceTemplates[serviceType]));
        const id = Date.now().toString();

        // Make name unique
        let baseName = template.name;
        let counter = 1;
        while (this.containers.some(c => c.name === template.name)) {
            template.name = `${baseName}_${counter}`;
            counter++;
        }

        const container = {
            id,
            serviceType,
            ...template,
            privileged: false,
            capAdd: template.capAdd || [],
            devices: template.devices || [],
            networkMode: template.networkMode || '',
            healthcheck: {
                enabled: false,
                test: '',
                interval: '30s',
                timeout: '10s',
                retries: 3
            }
        };

        this.containers.push(container);
        this.currentContainerId = id;
        return container;
    }

    removeContainer(id) {
        const index = this.containers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.containers.splice(index, 1);
            if (this.currentContainerId === id) {
                this.currentContainerId = this.containers.length > 0 ? this.containers[0].id : null;
            }
        }
    }

    getCurrentContainer() {
        return this.containers.find(c => c.id === this.currentContainerId);
    }

    updateContainer(id, updates) {
        const container = this.containers.find(c => c.id === id);
        if (container) {
            Object.assign(container, updates);
        }
    }

    clear() {
        this.containers = [];
        this.currentContainerId = null;
    }
}

const state = new AppState();

// ===== UI Updates =====
function updateActiveContainersList() {
    const container = document.getElementById('activeContainers');

    if (state.containers.length === 0) {
        container.innerHTML = '<p class="empty-state">Keine Programme ausgewählt</p>';
        return;
    }

    container.innerHTML = state.containers.map(c => `
        <div class="active-container-item ${c.id === state.currentContainerId ? 'selected' : ''}"
             data-id="${c.id}">
            <span>${c.name}</span>
            <span class="text-muted">${c.serviceType}</span>
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.active-container-item').forEach(item => {
        item.addEventListener('click', () => {
            state.currentContainerId = item.dataset.id;
            updateActiveContainersList();
            renderConfigPanel();
            updatePreviews();
        });
    });
}

function renderConfigPanel() {
    const container = state.getCurrentContainer();
    const configContent = document.getElementById('configContent');
    const removeBtn = document.getElementById('removeContainerBtn');

    if (!container) {
        configContent.innerHTML = `
            <div class="welcome-message">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
                <h3>Willkommen beim Container Configurator</h3>
                <p>Wähle ein Programm aus der linken Liste, um zu beginnen.</p>
            </div>
        `;
        removeBtn.style.display = 'none';
        return;
    }

    removeBtn.style.display = 'flex';

    configContent.innerHTML = `
        <div class="form-section">
            <h3 class="form-section-title">Grundeinstellungen</h3>

            <div class="input-grid">
                <div class="form-group">
                    <label class="form-label">Name des Programms</label>
                    <input type="text" class="form-input" id="containerName" value="${container.name}">
                </div>

                <div class="form-group">
                    <label class="form-label">Programmvorlage (Image)</label>
                    <input type="text" class="form-input" id="containerImage" value="${container.image}">
                </div>

                <div class="form-group">
                    <label class="form-label">Neustart-Verhalten</label>
                    <select class="form-select" id="restartPolicy">
                        <option value="no" ${container.restart === 'no' ? 'selected' : ''}>Kein Neustart</option>
                        <option value="always" ${container.restart === 'always' ? 'selected' : ''}>Immer neu starten</option>
                        <option value="unless-stopped" ${container.restart === 'unless-stopped' ? 'selected' : ''}>Neu starten (außer manuell gestoppt)</option>
                        <option value="on-failure" ${container.restart === 'on-failure' ? 'selected' : ''}>Nur bei Fehler neu starten</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Netzwerk-Modus</label>
                    <select class="form-select" id="networkMode">
                        <option value="">Standard</option>
                        <option value="bridge" ${container.networkMode === 'bridge' ? 'selected' : ''}>Bridge (Standard)</option>
                        <option value="host" ${container.networkMode === 'host' ? 'selected' : ''}>Host (direkter Zugriff)</option>
                        <option value="none" ${container.networkMode === 'none' ? 'selected' : ''}>Kein Netzwerk</option>
                    </select>
                </div>
            </div>

            <div class="checkbox-group mt-2">
                <input type="checkbox" id="privileged" ${container.privileged ? 'checked' : ''}>
                <label for="privileged">Erweiterte Rechte (nur wenn nötig)</label>
            </div>
        </div>

        <div class="form-section">
            <h3 class="form-section-title">Netzwerk-Ports (Zugänge zum Programm)</h3>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Format: Außen:Innen (z.B. 8080:80 bedeutet Port 80 im Container ist über Port 8080 erreichbar)</p>
            <div class="dynamic-list" id="portsList"></div>
            <button class="btn btn-add" id="addPort">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Port hinzufügen
            </button>
        </div>

        <div class="form-section">
            <h3 class="form-section-title">Datenordner (wo die Daten gespeichert werden)</h3>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Format: Pfad/auf/dem/Server:/pfad/im/container</p>
            <div class="dynamic-list" id="volumesList"></div>
            <button class="btn btn-add" id="addVolume">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Datenordner hinzufügen
            </button>
        </div>

        <div class="form-section">
            <h3 class="form-section-title">Umgebungsvariablen (Einstellungen für das Programm)</h3>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Hier können Sie Einstellungen wie Zeitzone, Benutzer-ID, Passwörter etc. festlegen</p>
            <div class="dynamic-list" id="envList"></div>
            <button class="btn btn-add" id="addEnv">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Einstellung hinzufügen
            </button>
        </div>

        <div class="form-section">
            <h3 class="form-section-title">Geräte (Hardware-Zugriff)</h3>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Z.B. /dev/dri für GPU-Zugriff (nur für fortgeschrittene Nutzer)</p>
            <div class="dynamic-list" id="devicesList"></div>
            <button class="btn btn-add" id="addDevice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Gerät hinzufügen
            </button>
        </div>

        <div class="form-section">
            <h3 class="form-section-title">Berechtigungen (System-Capabilities)</h3>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Spezielle Berechtigungen wie NET_ADMIN für Netzwerk-Tools (nur wenn nötig)</p>
            <div class="dynamic-list" id="capAddList"></div>
            <button class="btn btn-add" id="addCapability">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Berechtigung hinzufügen
            </button>
        </div>

        ${container.command ? `
        <div class="form-section">
            <h3 class="form-section-title">Startbefehl (Command)</h3>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Spezieller Befehl, der beim Start ausgeführt wird</p>
            <div class="form-group">
                <input type="text" class="form-input" id="containerCommand" value="${container.command}">
            </div>
        </div>
        ` : ''}

        <div class="form-section">
            <h3 class="form-section-title">Zustandsprüfung (Health Check)</h3>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Automatische Überprüfung, ob das Programm noch funktioniert</p>
            <div class="checkbox-group mb-2">
                <input type="checkbox" id="healthcheckEnabled" ${container.healthcheck.enabled ? 'checked' : ''}>
                <label for="healthcheckEnabled">Zustandsprüfung aktivieren</label>
            </div>
            <div id="healthcheckConfig" style="display: ${container.healthcheck.enabled ? 'block' : 'none'}">
                <div class="form-group">
                    <label class="form-label">Prüfbefehl</label>
                    <input type="text" class="form-input" id="healthcheckTest"
                           value="${container.healthcheck.test}"
                           placeholder="CMD-SHELL curl -f http://localhost/ || exit 1">
                </div>
                <div class="input-grid">
                    <div class="form-group">
                        <label class="form-label">Prüfintervall (z.B. 30s)</label>
                        <input type="text" class="form-input" id="healthcheckInterval"
                               value="${container.healthcheck.interval}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Timeout (z.B. 10s)</label>
                        <input type="text" class="form-input" id="healthcheckTimeout"
                               value="${container.healthcheck.timeout}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Wiederholungen</label>
                        <input type="number" class="form-input" id="healthcheckRetries"
                               value="${container.healthcheck.retries}">
                    </div>
                </div>
            </div>
        </div>
    `;

    // Render dynamic lists
    renderDynamicList('portsList', container.ports, 'Port (z.B. 8080:80)');
    renderDynamicList('volumesList', container.volumes, 'Datenordner (z.B. ./data:/data)');
    renderEnvList('envList', container.environment);
    renderDynamicList('devicesList', container.devices, 'Gerät (z.B. /dev/dri:/dev/dri)');
    renderDynamicList('capAddList', container.capAdd, 'Berechtigung (z.B. NET_ADMIN)');

    // Attach event listeners
    attachConfigEventListeners();
}

function renderDynamicList(listId, items, placeholder) {
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = items.map((item, index) => `
        <div class="dynamic-item">
            <div class="dynamic-item-inputs">
                <input type="text" class="form-input" value="${item}" data-index="${index}">
            </div>
            <button class="btn btn-danger btn-icon" data-index="${index}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');

    if (items.length === 0) {
        list.innerHTML = `<p class="text-muted" style="font-size: 0.875rem;">Keine Einträge vorhanden</p>`;
    }
}

function renderEnvList(listId, items) {
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = items.map((item, index) => {
        const [key, ...valueParts] = item.split('=');
        const value = valueParts.join('=');
        return `
            <div class="dynamic-item">
                <div class="dynamic-item-inputs">
                    <input type="text" class="form-input" placeholder="NAME" value="${key}" data-index="${index}" data-part="key">
                    <input type="text" class="form-input" placeholder="WERT" value="${value}" data-index="${index}" data-part="value">
                </div>
                <button class="btn btn-danger btn-icon" data-index="${index}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
    }).join('');

    if (items.length === 0) {
        list.innerHTML = `<p class="text-muted" style="font-size: 0.875rem;">Keine Einträge vorhanden</p>`;
    }
}

function attachConfigEventListeners() {
    const container = state.getCurrentContainer();
    if (!container) return;

    // Basic inputs
    const nameInput = document.getElementById('containerName');
    const imageInput = document.getElementById('containerImage');
    const restartSelect = document.getElementById('restartPolicy');
    const networkModeSelect = document.getElementById('networkMode');
    const privilegedCheck = document.getElementById('privileged');
    const commandInput = document.getElementById('containerCommand');

    nameInput?.addEventListener('input', (e) => {
        state.updateContainer(container.id, { name: e.target.value });
        updateActiveContainersList();
        updatePreviews();
    });

    imageInput?.addEventListener('input', (e) => {
        state.updateContainer(container.id, { image: e.target.value });
        updatePreviews();
    });

    restartSelect?.addEventListener('change', (e) => {
        state.updateContainer(container.id, { restart: e.target.value });
        updatePreviews();
    });

    networkModeSelect?.addEventListener('change', (e) => {
        state.updateContainer(container.id, { networkMode: e.target.value });
        updatePreviews();
    });

    privilegedCheck?.addEventListener('change', (e) => {
        state.updateContainer(container.id, { privileged: e.target.checked });
        updatePreviews();
    });

    commandInput?.addEventListener('input', (e) => {
        state.updateContainer(container.id, { command: e.target.value });
        updatePreviews();
    });

    // Health check
    const healthcheckEnabled = document.getElementById('healthcheckEnabled');
    const healthcheckConfig = document.getElementById('healthcheckConfig');

    healthcheckEnabled?.addEventListener('change', (e) => {
        container.healthcheck.enabled = e.target.checked;
        healthcheckConfig.style.display = e.target.checked ? 'block' : 'none';
        updatePreviews();
    });

    document.getElementById('healthcheckTest')?.addEventListener('input', (e) => {
        container.healthcheck.test = e.target.value;
        updatePreviews();
    });

    document.getElementById('healthcheckInterval')?.addEventListener('input', (e) => {
        container.healthcheck.interval = e.target.value;
        updatePreviews();
    });

    document.getElementById('healthcheckTimeout')?.addEventListener('input', (e) => {
        container.healthcheck.timeout = e.target.value;
        updatePreviews();
    });

    document.getElementById('healthcheckRetries')?.addEventListener('input', (e) => {
        container.healthcheck.retries = parseInt(e.target.value);
        updatePreviews();
    });

    // Ports
    attachDynamicListListeners('portsList', 'ports');
    document.getElementById('addPort')?.addEventListener('click', () => {
        container.ports.push('');
        renderDynamicList('portsList', container.ports, 'Port');
        attachDynamicListListeners('portsList', 'ports');
        updatePreviews();
    });

    // Volumes
    attachDynamicListListeners('volumesList', 'volumes');
    document.getElementById('addVolume')?.addEventListener('click', () => {
        container.volumes.push('');
        renderDynamicList('volumesList', container.volumes, 'Volume');
        attachDynamicListListeners('volumesList', 'volumes');
        updatePreviews();
    });

    // Environment
    attachEnvListListeners();
    document.getElementById('addEnv')?.addEventListener('click', () => {
        container.environment.push('=');
        renderEnvList('envList', container.environment);
        attachEnvListListeners();
        updatePreviews();
    });

    // Devices
    attachDynamicListListeners('devicesList', 'devices');
    document.getElementById('addDevice')?.addEventListener('click', () => {
        container.devices.push('');
        renderDynamicList('devicesList', container.devices, 'Device');
        attachDynamicListListeners('devicesList', 'devices');
        updatePreviews();
    });

    // Capabilities
    attachDynamicListListeners('capAddList', 'capAdd');
    document.getElementById('addCapability')?.addEventListener('click', () => {
        container.capAdd.push('');
        renderDynamicList('capAddList', container.capAdd, 'Capability');
        attachDynamicListListeners('capAddList', 'capAdd');
        updatePreviews();
    });
}

function attachDynamicListListeners(listId, propertyName) {
    const container = state.getCurrentContainer();
    if (!container) return;

    const list = document.getElementById(listId);
    if (!list) return;

    // Input changes
    list.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            container[propertyName][index] = e.target.value;
            updatePreviews();
        });
    });

    // Remove buttons
    list.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            container[propertyName].splice(index, 1);
            renderDynamicList(listId, container[propertyName], '');
            attachDynamicListListeners(listId, propertyName);
            updatePreviews();
        });
    });
}

function attachEnvListListeners() {
    const container = state.getCurrentContainer();
    if (!container) return;

    const list = document.getElementById('envList');
    if (!list) return;

    // Input changes
    list.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            const part = e.target.dataset.part;

            const currentEnv = container.environment[index] || '=';
            const [currentKey, ...currentValueParts] = currentEnv.split('=');
            const currentValue = currentValueParts.join('=');

            if (part === 'key') {
                container.environment[index] = `${e.target.value}=${currentValue}`;
            } else {
                container.environment[index] = `${currentKey}=${e.target.value}`;
            }
            updatePreviews();
        });
    });

    // Remove buttons
    list.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            container.environment.splice(index, 1);
            renderEnvList('envList', container.environment);
            attachEnvListListeners();
            updatePreviews();
        });
    });
}

// ===== Preview Generation =====
function generateYAML() {
    if (state.containers.length === 0) {
        return '# Wähle ein Programm aus, um die Vorschau zu sehen';
    }

    let yaml = 'version: "3.8"\n\nservices:\n';

    state.containers.forEach(container => {
        yaml += `  ${container.name}:\n`;
        yaml += `    image: ${container.image}\n`;

        if (container.name !== container.serviceType) {
            yaml += `    container_name: ${container.name}\n`;
        }

        if (container.restart) {
            yaml += `    restart: ${container.restart}\n`;
        }

        if (container.networkMode) {
            yaml += `    network_mode: ${container.networkMode}\n`;
        }

        if (container.privileged) {
            yaml += `    privileged: true\n`;
        }

        if (container.ports.length > 0 && container.ports.some(p => p.trim())) {
            yaml += `    ports:\n`;
            container.ports.filter(p => p.trim()).forEach(port => {
                yaml += `      - "${port}"\n`;
            });
        }

        if (container.volumes.length > 0 && container.volumes.some(v => v.trim())) {
            yaml += `    volumes:\n`;
            container.volumes.filter(v => v.trim()).forEach(volume => {
                yaml += `      - ${volume}\n`;
            });
        }

        if (container.environment.length > 0 && container.environment.some(e => e.trim() && e !== '=')) {
            yaml += `    environment:\n`;
            container.environment.filter(e => e.trim() && e !== '=').forEach(env => {
                yaml += `      - ${env}\n`;
            });
        }

        if (container.devices.length > 0 && container.devices.some(d => d.trim())) {
            yaml += `    devices:\n`;
            container.devices.filter(d => d.trim()).forEach(device => {
                yaml += `      - ${device}\n`;
            });
        }

        if (container.capAdd.length > 0 && container.capAdd.some(c => c.trim())) {
            yaml += `    cap_add:\n`;
            container.capAdd.filter(c => c.trim()).forEach(cap => {
                yaml += `      - ${cap}\n`;
            });
        }

        if (container.command) {
            yaml += `    command: ${container.command}\n`;
        }

        if (container.healthcheck.enabled && container.healthcheck.test) {
            yaml += `    healthcheck:\n`;
            yaml += `      test: ["${container.healthcheck.test}"]\n`;
            yaml += `      interval: ${container.healthcheck.interval}\n`;
            yaml += `      timeout: ${container.healthcheck.timeout}\n`;
            yaml += `      retries: ${container.healthcheck.retries}\n`;
        }

        yaml += '\n';
    });

    return yaml;
}

function generateCLI() {
    if (state.containers.length === 0) {
        return '# Wähle ein Programm aus, um die Vorschau zu sehen';
    }

    let cli = '#!/bin/bash\n\n';
    cli += '# Docker Container Start Script\n';
    cli += '# Generiert mit Container Configurator\n\n';

    state.containers.forEach(container => {
        cli += `# ${container.name}\n`;
        cli += `docker run -d \\\n`;
        cli += `  --name ${container.name} \\\n`;

        if (container.restart) {
            cli += `  --restart ${container.restart} \\\n`;
        }

        if (container.networkMode) {
            cli += `  --network ${container.networkMode} \\\n`;
        }

        if (container.privileged) {
            cli += `  --privileged \\\n`;
        }

        container.ports.filter(p => p.trim()).forEach(port => {
            cli += `  -p ${port} \\\n`;
        });

        container.volumes.filter(v => v.trim()).forEach(volume => {
            cli += `  -v ${volume} \\\n`;
        });

        container.environment.filter(e => e.trim() && e !== '=').forEach(env => {
            cli += `  -e ${env} \\\n`;
        });

        container.devices.filter(d => d.trim()).forEach(device => {
            cli += `  --device ${device} \\\n`;
        });

        container.capAdd.filter(c => c.trim()).forEach(cap => {
            cli += `  --cap-add ${cap} \\\n`;
        });

        if (container.healthcheck.enabled && container.healthcheck.test) {
            cli += `  --health-cmd "${container.healthcheck.test}" \\\n`;
            cli += `  --health-interval ${container.healthcheck.interval} \\\n`;
            cli += `  --health-timeout ${container.healthcheck.timeout} \\\n`;
            cli += `  --health-retries ${container.healthcheck.retries} \\\n`;
        }

        cli += `  ${container.image}`;

        if (container.command) {
            cli += ` \\\n  ${container.command}`;
        }

        cli += '\n\n';
    });

    return cli;
}

function updatePreviews() {
    const yamlPreview = document.getElementById('yamlPreview');
    const cliPreview = document.getElementById('cliPreview');

    if (yamlPreview) {
        yamlPreview.textContent = generateYAML();
    }

    if (cliPreview) {
        cliPreview.textContent = generateCLI();
    }
}

// ===== Export Functions =====
function exportYAML() {
    const yaml = generateYAML();
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportScript() {
    const cli = generateCLI();
    const blob = new Blob([cli], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'start-containers.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== Event Handlers =====
function handleServiceSelect(serviceType) {
    const container = state.addContainer(serviceType);
    updateActiveContainersList();
    renderConfigPanel();
    updatePreviews();
}

function handleClearAll() {
    if (state.containers.length === 0) return;

    if (confirm('Möchtest du wirklich alle Programme zurücksetzen?')) {
        state.clear();
        updateActiveContainersList();
        renderConfigPanel();
        updatePreviews();
    }
}

function handleRemoveContainer() {
    const container = state.getCurrentContainer();
    if (!container) return;

    if (confirm(`Möchtest du das Programm "${container.name}" wirklich entfernen?`)) {
        state.removeContainer(container.id);
        updateActiveContainersList();
        renderConfigPanel();
        updatePreviews();
    }
}

function handleTabSwitch(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    // Service buttons
    document.querySelectorAll('.service-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceType = btn.dataset.service;
            handleServiceSelect(serviceType);
        });
    });

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', handleClearAll);

    // Remove container button
    document.getElementById('removeContainerBtn').addEventListener('click', handleRemoveContainer);

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleTabSwitch(btn.dataset.tab);
        });
    });

    // Export buttons
    document.getElementById('exportYaml').addEventListener('click', exportYAML);
    document.getElementById('exportScript').addEventListener('click', exportScript);

    // Initial render
    updatePreviews();
});
