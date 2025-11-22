# Container Configurator

Eine moderne, interaktive WebGUI zum Erstellen von Docker-Compose- und Docker-CLI-Konfigurationen.

## Features

- **Dark Mode UI** - Modernes, flaches Design im Stil von GitHub / Portainer
- **Service-Templates** - Vorkonfigurierte Templates für beliebte Container:
  - Linuxserver.io Container (Nextcloud, Jellyfin, qBittorrent, SWAG, MariaDB, Nginx, Plex, Heimdall)
  - Generic Container (PostgreSQL, Redis, Traefik)
  - Custom Container (freie Konfiguration)
- **Live-Preview** - Echtzeit-Generierung von:
  - `docker-compose.yml` (YAML Format)
  - `docker run` CLI-Befehle
- **Vollständige Konfiguration**:
  - Container-Name & Image
  - Ports (dynamisch hinzufügen/entfernen)
  - Volumes (dynamisch hinzufügen/entfernen)
  - Environment Variablen
  - Restart Policy
  - Network Mode
  - Privileged Mode
  - Devices
  - Capabilities
  - Health Checks
- **Export-Funktionen**:
  - Download als `docker-compose.yml`
  - Download als Shell-Script (`.sh`)

## Installation

### Voraussetzungen
- Debian 13 LXC unter Proxmox
- Webserver (nginx, Apache, oder Python SimpleHTTPServer)

### Setup

1. **Dateien in Webserver-Verzeichnis kopieren**:
   ```bash
   # Beispiel für nginx
   sudo cp -r Container-Configurator /var/www/html/

   # Oder für Apache
   sudo cp -r Container-Configurator /var/www/html/
   ```

2. **Mit Python SimpleHTTPServer (Entwicklung)**:
   ```bash
   cd Container-Configurator
   python3 -m http.server 8000
   ```

3. **Im Browser öffnen**:
   ```
   http://localhost:8000
   ```

## Nutzung

### 1. Service auswählen
- Klicke auf einen Service aus der linken Sidebar
- Der Service wird zur Liste der aktiven Container hinzugefügt
- Die Konfigurationsoptionen werden angezeigt

### 2. Container konfigurieren
- **Basis-Konfiguration**: Name, Image, Restart Policy, Network Mode
- **Ports**: Klicke auf "Port hinzufügen" und trage das Port-Mapping ein (z.B. `8080:80`)
- **Volumes**: Füge Volume-Mappings hinzu (z.B. `./data:/data`)
- **Environment**: Setze Umgebungsvariablen (KEY=VALUE)
- **Erweitert**: Devices, Capabilities, Health Checks

### 3. Live-Preview ansehen
- Die Preview wird automatisch in Echtzeit aktualisiert
- Wechsel zwischen `docker-compose.yml` und `docker CLI` Tabs
- Kopiere die Konfiguration direkt aus der Preview

### 4. Exportieren
- **YAML Export**: Lädt eine fertige `docker-compose.yml` herunter
- **Script Export**: Lädt ein `start-containers.sh` Shell-Script herunter

### 5. Mehrere Container
- Füge beliebig viele Container hinzu
- Wechsle zwischen Containern in der "Aktive Container" Liste
- Alle Container werden in einer gemeinsamen `docker-compose.yml` kombiniert

## Projektstruktur

```
Container-Configurator/
├── index.html           # Haupt-HTML-Datei
├── assets/
│   ├── style.css       # Dark Mode Styling
│   ├── app.js          # Vollständige JavaScript-Logik
│   └── icons/          # (Optional) SVG Icons
└── README.md           # Diese Datei
```

## Technologie-Stack

- **HTML5** - Semantisches Markup
- **CSS3** - Custom Properties, Flexbox, Grid
- **Vanilla JavaScript** - Keine Frameworks
- **Keine Dependencies** - Läuft direkt im Browser

## Browser-Kompatibilität

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Beispiel-Workflow

1. Service "Nextcloud" auswählen
2. Ports anpassen: `8080:80`, `8443:443`
3. Volumes hinzufügen: `./nextcloud/config:/config`
4. Environment-Variable ändern: `TZ=Europe/Berlin`
5. YAML exportieren
6. Auf Server hochladen: `scp docker-compose.yml user@server:/opt/nextcloud/`
7. Container starten: `docker-compose up -d`

## Tipps

- **Mehrere Container**: Die GUI kombiniert alle Container in einer einzigen `docker-compose.yml`
- **Custom Container**: Nutze "Custom Container" für Container, die nicht in den Templates sind
- **Health Checks**: Aktiviere Health Checks für automatische Container-Überwachung
- **Privileged Mode**: Nur aktivieren, wenn wirklich benötigt (Sicherheitsrisiko)

## Support

Bei Fragen oder Problemen:
1. Überprüfe die Browser-Konsole (F12) auf Fehler
2. Stelle sicher, dass alle Dateien korrekt geladen wurden
3. Teste in einem anderen Browser

## Lizenz

Freie Nutzung für private und kommerzielle Projekte.

---

**Erstellt für Debian 13 LXC unter Proxmox**
