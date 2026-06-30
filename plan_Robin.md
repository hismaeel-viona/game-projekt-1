# Entwicklungsplan Reaktionsjäger
 
## Ausgangslage
 
Das Spiel "Reaktionsjäger" ist ein Browser-Klickspiel in Vanilla JavaScript. Es existieren zwei parallele Implementierungen:
1. Ein inline `<script>` in `index.html` (monolithisch, globaler Scope)
2. Ein modulares System in `js/` (ES-Module)
 
Beide laden gleichzeitig → doppelte Event-Listener, potenzielle Konflikte.
 
---
 
## Stufe 1: Aufräumen der doppelten Implementierung
 
**Priorität:** Hoch
 
### Ziel
Das inline `<script>` aus `index.html` entfernen, damit nur noch die modulare JS-Struktur verwendet wird.
 
### Wegbeschreibung
1. Datei `index.html` öffnen
2. Zeilen 80-483 löschen (den kompletten `<script>`-Block bis auf den Module-Import)
3. Sicherstellen, dass Zeile 484 erhalten bleibt:
   ```html
   <script type="module" src="js/main.js"></script>
   ```
4. Prüfen ob `js/main.js` alle Event-Listener korrekt bindet:
   - `#ziel` → `handlePinkClick`
   - `#zielRot` → `handleRedClick`
   - `#start` → `spielStarten`
   - `#pause` → `togglePause`
   - `#stop` → `spielBeenden(false)`
   - `.level-button` → `handleLevelSelection`
   - `#highscoreButton` → Toggle
 
### Prüfungsmethodik
| Test | Erwartung |
|---|---|
| `npm run dev` starten | Server startet ohne Fehler |
| Spiel starten | Ziel erscheint, Timer läuft |
| Pinkes Ziel klicken | +1 Punkt, Ziel bewegt sich |
| Rotes Ziel klicken | -1 Punkt, Ziel verschwindet |
| Pause-Button klicken | Spiel pausiert, Overlay erscheint |
| Spiel beenden | Spiel stoppt, Level-Auswahl erscheint |
| `npm run build` | Build erfolgreich |
| `dist/index.html` öffnen | Spiel funktioniert |
 
---
 
## Stufe 2: Statistik-Feature
 
**Priorität:** Mittel
**Status:** ✅ Bereits umgesetzt
 
### Ziel
Nach Spielende erscheint ein Overlay mit Spielstatistik.
 
### Umgesetzte Funktionen
- **State-Erweiterung:** `totalClicks`, `hitClicks`, `fehlKlicks`, `startTime`
- **Tracking:** Klicks werden während des Spiels gezählt
- **Berechnung:** `calculateStatistics()` bei Spielende
- **Anzeige:** `showStatistik()` zeigt Overlay
 
### Enthaltene Werte
| Feld | Inhalt |
|---|---|
| Punkte | Erreichte Punktzahl |
| Level | Höchstes erreichtes Level |
| Dauer | Gesamtspielzeit in Sekunden |
| Gesamtklicks | Alle Klicks (Ziel + rot + Hintergrund) |
| Trefferquote | `hitClicks / totalClicks` |
| Fehlklicks | Klicks auf Hintergrund |
 
### Dateien
- `js/game.js` – State, Tracking, `calculateStatistics()`
- `js/ui.js` – `showStatistik()`, `hideStatistik()`
- `js/main.js` – Event-Listener für Schließen-Button
- `index.html` – Statistik-Overlay-HTML
- `css/styles.css` – Overlay-Styles
- `tests/statistics.test.js` – 3 Tests
 
---
 
## Stufe 3: Tastatursteuerung
 
**Priorität:** Mittel
 
### Ziel
Spiel vollständig über Tastatur bedienbar machen.
 
### Tastenbelegung
| Taste | Aktion |
|---|---|
| `Leertaste` | Klick auf pinkes Ziel |
| `P` | Pause / Fortsetzen |
| `Escape` | Spiel beenden |
 
### Wegbeschreibung
1. In `js/main.js` einen `keydown`-Event-Listener hinzufügen:
   ```javascript
   document.addEventListener('keydown', handleKeyboard);
   ```
2. Funktion `handleKeyboard(event)` implementieren:
   ```javascript
   function handleKeyboard(event) {
       if (!state.spielLaeuft) return;
 
       switch (event.key) {
           case ' ':
               event.preventDefault();
               // Klick auf pinkes Ziel simulieren
               break;
           case 'p':
           case 'P':
               togglePause();
               break;
           case 'Escape':
               spielBeenden(false);
               break;
       }
   }
   ```
3. `handleKeyboard` in `game.js` exportieren oder Logik direkt in `main.js` halten
 
### Prüfungsmethodik
| Test | Erwartung |
|---|---|
| Spiel starten, Leertaste drücken | +1 Punkt, Ziel bewegt sich |
| P-Taste drücken | Spiel pausiert |
| Nochmal P-Taste | Spiel läuft weiter |
| Escape drücken | Spiel stoppt |
| Taste im Menü (Spiel läuft nicht) | Keine Aktion |
 
---
 
## Stufe 4: Keyboard-Shortcuts-Hinweis
 
**Priorität:** Niedrig
 
### Ziel
Kleine Hilfestellung für Tastaturbelegung im UI anzeigen.
 
### Wegbeschreibung
1. In `index.html` nach den Steuerungs-Buttons einfügen:
   ```html
   <p class="tastatur-hinweis">
       Tastatur: Leertaste = Klick | P = Pause | ESC = Beenden
   </p>
   ```
2. In `css/styles.css` Styling hinzufügen:
   ```css
   .tastatur-hinweis {
       text-align: center;
       font-size: 0.8rem;
       color: #666;
       margin-top: 8px;
   }
   ```
 
### Prüfungsmethodik
| Test | Erwartung |
|---|---|
| Seite laden | Hinweis sichtbar unter Steuerungs-Buttons |
| Text lesen | Tastaturbelegung korrekt angezeigt |
 
---
 
## Stufe 5: Fehlklicks (Verworfen)
 
**Priorität:** Keine
**Status:** ❌ Abgelehnt
 
### Begründung
Klicks ins Spielfeld als "Fehlklick" zu zählen hat keinen Mehrwert:
- Spieler klicken ohnehin nur auf das Ziel
- Die Metrik ist nichtssagend für Spielerlebnis
- Rotes "X" bringt keinen Spielspaß
 
### Empfehlung
Bestehenden Code für Fehlklicks entfernen:
- `handleFieldClick()` in `game.js`
- `fehlKlicks` im State
- `.fehlklick-feedback` CSS
- Fehlklick-Zeile im Statistik-Overlay
 
---
 
## Zusammenfassung
 
| Stufe | Feature | Status | Aufwand |
|---|---|---|---|
| 1 | Inline-Script entfernen | Offen | Klein |
| 2 | Statistik | ✅ Fertig | – |
| 3 | Tastatursteuerung | Offen | Mittel |
| 4 | Keyboard-Hinweis | Offen | Klein |
| 5 | Fehlklicks | Verworfen | – |
 
## Empfohlene Reihenfolge
 
1. **Stufe 1** – Grundlage schaffen (kein duplizierter Code)
2. **Stufe 3** – Tastatursteuerung (wichtige Barrierefreiheit)
3. **Stufe 4** – Hinweis (optional, aber schnell)
4. **Stufe 5** – Aufräumen (Fehlklicks-Code entfernen)
 
 