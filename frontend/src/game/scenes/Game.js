import { Scene } from "phaser";
import { GameData } from "../GameData";
import { EventBus } from "../EventBus";

/**
 * SCÈNE PRINCIPALE DU JEU
 * Gère l'inventaire, les énigmes, le timer et les interactions.
 */
export class Game extends Scene {
    constructor() {
        super("Game");

        // --- ÉTATS DU JEU ---
        this.inventory = [];
        this.currentZoomId = null;
        this.isFlipped = false;

        // Gestion erreurs puzzle T9
        this.errorCount = 0;

        // --- TIMER ---
        // 1 heure = 3600 secondes
        this.initialTime = 3600;
        this.timerEvent = null;

        // --- ÉTAT DES CARTES (Logique conservée) ---
        // Cartes dont l'énigme est résolue (grisées)
        this.completedCards = [];
        // Cartes retournées au moins une fois (restent face visible)
        this.revealedCards = [];

        // --- THEME GRAPHIQUE ---
        this.theme = {
            gold: 0xc5a059,
            dark: 0x12100e,
            red: 0x8a0303
        };
    }

    /**
     * INITIALISATION DE LA SCÈNE
     */
    create() {
        const { width, height } = this.scale;

        // ---------------------------------------------------------
        // 1. MISE EN PLACE DU DÉCOR (NOUVEAU FORMAT)
        // ---------------------------------------------------------

        // A. BACKGROUND "COVER" (Prend tout l'écran sans déformation)
        if (this.textures.exists("background")) {
            const bg = this.add.image(width / 2, height / 2, "background");

            // Calcul du ratio pour couvrir tout l'écran
            const scaleX = width / bg.width;
            const scaleY = height / bg.height;
            const scale = Math.max(scaleX, scaleY);

            bg.setScale(scale).setScrollFactor(0);
            bg.setAlpha(0.3); // Assombri pour lisibilité
            bg.setTint(0x888888); // Légère teinte froide
        } else {
            // Fallback
            this.add.rectangle(0, 0, width, height, 0x1a1a1a).setOrigin(0);
        }

        // B. LE BUREAU (Zone d'inventaire en bas)
        // On définit une zone dédiée aux cartes pour qu'elles soient lisibles
        const deskHeight = 320;
        const deskY = height - deskHeight;

        // Dégradé sombre pour le fond du bureau
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x000000, 0x000000, 0x1a1512, 0x1a1512, 0.1, 0.1, 0.95, 0.95);
        graphics.fillRect(0, deskY, width, deskHeight);

        // Ligne de séparation dorée
        this.add.rectangle(width / 2, deskY, width, 3, this.theme.gold).setAlpha(0.6);

        // ---------------------------------------------------------
        // 2. INITIALISATION DES DONNÉES
        // ---------------------------------------------------------

        // On init l'inventaire sans doublons
        this.inventory = [...new Set(GameData.initialInventory)];

        // Conteneur des cartes
        this.cardsContainer = this.add.container(0, 0);

        // ---------------------------------------------------------
        // 3. LANCEMENT DES SYSTÈMES
        // ---------------------------------------------------------

        this.createUISystem();           // Barre recherche
        this.createNotebook();           // Notes HTML
        this.createHintSystem();         // Indices
        this.createTimer();              // Timer
        
        // Affiche l'inventaire (Adapté en Grille sans pagination)
        this.refreshInventory();
        
        this.createZoomInterface();      // Zoom Overlay
        this.createNotificationSystem(); // Popups

        EventBus.emit("current-scene-ready", this);
    }

    // =================================================================
    // GESTION DE L'INVENTAIRE (GRILLE DYNAMIQUE - LOGIQUE CONSERVÉE)
    // =================================================================

    refreshInventory() {
        this.cardsContainer.removeAll(true);
        const { width, height } = this.scale;

        // Configuration de la grille (Au lieu de la pagination)
        const cardTargetWidth = 140; // Largeur visuelle
        const gapX = 40;             // Espace horizontal
        
        // Calcul pour centrer la grille
        const availableWidth = width - 100; // Marges
        const cardsPerRow = Math.floor(availableWidth / (cardTargetWidth + gapX));
        
        // Position de départ (Zone bureau)
        const deskY = height - 280; 

        this.inventory.forEach((id, index) => {
            // Calcul Ligne / Colonne
            const col = index % cardsPerRow;
            const row = Math.floor(index / cardsPerRow);

            // Centrage de la ligne actuelle
            const currentLineCount = (row === Math.floor((this.inventory.length - 1) / cardsPerRow)) 
                ? (this.inventory.length % cardsPerRow) || cardsPerRow 
                : cardsPerRow;
            
            const lineWidth = (currentLineCount * cardTargetWidth) + ((currentLineCount - 1) * gapX);
            const startX = (width / 2) - (lineWidth / 2) + (cardTargetWidth / 2);

            const x = startX + (col * (cardTargetWidth + gapX));
            const y = deskY + (row * 100); // Décalage vertical si plusieurs lignes

            // -----------------------------------------------------
            // LOGIQUE DE LA CARTE (CONSERVÉE DU FICHIER ORIGINAL)
            // -----------------------------------------------------

            const isRevealed = this.revealedCards.includes(id);
            const isCompleted = this.completedCards.includes(id);

            // Si révélée, on affiche directement le devant, sinon le dos
            const initialTexture = isRevealed ? `devant_${id}` : `dos_${id}`;

            const sprite = this.add
                .sprite(x, y, initialTexture)
                .setInteractive();
            
            // Mise à l'échelle uniforme
            const scale = 150 / sprite.height;
            sprite.setScale(scale);

            // Si la carte est finie (ex: énigme résolue)
            if (isCompleted) {
                sprite.setTint(0x555555); // On grise
                sprite.disableInteractive(); // On empêche le clic
            } else {
                // Gestion du survol (Hover)
                sprite.on("pointerover", () => {
                    this.tweens.add({
                        targets: sprite,
                        scale: scale * 1.15, // Zoom léger
                        y: y - 15,          // Monte un peu
                        duration: 100,
                        ease: 'Back.out'
                    });
                    sprite.setTint(0xdddddd); // Surbrillance

                    // Si elle n'est pas déjà révélée définitivement, on montre le devant au survol (Aperçu)
                    if (!isRevealed) {
                        sprite.setTexture(`devant_${id}`);
                    }
                    
                    this.cardsContainer.bringToTop(sprite);
                });

                sprite.on("pointerout", () => {
                    this.tweens.add({
                        targets: sprite,
                        scale: scale,
                        y: y,
                        duration: 100,
                        ease: 'Quad.out'
                    });
                    sprite.clearTint();

                    // Si elle n'est pas révélée définitivement, on remet le dos
                    if (!isRevealed) {
                        sprite.setTexture(`dos_${id}`);
                    }
                });

                sprite.on("pointerdown", () => this.openZoom(id));
            }

            this.cardsContainer.add(sprite);
        });
    }

    // =================================================================
    // SYSTÈME DE NOTIFICATIONS (POPUPS)
    // =================================================================

    createNotificationSystem() {
        this.notificationContainer = this.add
            .container(this.scale.width / 2, -100)
            .setDepth(2000);

        // Fond et texte
        this.notifBg = this.add
            .rectangle(0, 0, 600, 80, 0x000000, 0.9)
            .setStrokeStyle(4, 0xffffff);
            
        this.notifText = this.add
            .text(0, 0, "", {
                font: "bold 24px Arial",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);

        this.notificationContainer.add([this.notifBg, this.notifText]);
    }

    showNotification(message, type = "info") {
        let color = 0x333333;
        let stroke = 0xffffff;

        // Choix couleur selon type
        if (type === "success") {
            color = 0x2e7d32;
            stroke = 0x00ff00;
        } else if (type === "error") {
            color = 0xc62828;
            stroke = 0xff0000;
        } else if (type === "warning") {
            color = 0xff8f00;
            stroke = 0xffff00;
        }

        this.notifBg.setFillStyle(color, 0.95).setStrokeStyle(4, stroke);
        this.notifText.setText(message);

        // Animation d'apparition
        this.tweens.killTweensOf(this.notificationContainer);
        this.notificationContainer.y = -100;

        this.tweens.chain({
            targets: this.notificationContainer,
            tweens: [
                { y: 100, duration: 300, ease: "Back.out" }, // Descend
                { delay: 4000, duration: 0 }, // Reste
                { y: -100, duration: 300, ease: "Back.in" }, // Remonte
            ],
        });
    }

    // =================================================================
    // SYSTÈME D'INDICES (HAUT DROITE)
    // =================================================================

    createHintSystem() {
        this.hintContainer = this.add.container(this.scale.width - 250, 20);

        const bg = this.add
            .rectangle(0, 0, 240, 100, 0x000000, 0.6)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0xffd700);
            
        const title = this.add.text(10, 5, "INDICES DISPONIBLES", {
            font: "bold 16px Arial",
            color: "#ffd700",
        });

        // Texte modifiable
        this.hintTextObj = this.add.text(
            10,
            30,
            "Aucun indice pour l'instant.",
            { font: "14px Arial", color: "#ffffff", wordWrap: { width: 220 } },
        );

        this.hintContainer.add([bg, title, this.hintTextObj]);
    }

    showHint(text) {
        this.hintTextObj.setText(text);
        // Petit flash pour attirer l'attention
        this.tweens.add({
            targets: this.hintContainer,
            alpha: 0.5,
            yoyo: true,
            repeat: 3,
            duration: 200,
        });
    }

    // =================================================================
    // TIMER ET PÉNALITÉS (HAUT GAUCHE)
    // =================================================================

    createTimer() {
        // Décalé à gauche pour laisser place aux indices
        const bg = this.add.rectangle(
            this.scale.width - 350,
            40,
            180,
            50,
            0x000000,
            0.7,
        );
        this.timerText = this.add
            .text(
                this.scale.width - 350,
                40,
                this.formatTime(this.initialTime),
                {
                    font: "bold 32px Arial",
                    color: "#ff0000",
                },
            )
            .setOrigin(0.5);

        // Tick chaque seconde
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.onTimerTick,
            callbackScope: this,
            loop: true,
        });
    }

    onTimerTick() {
        this.initialTime--;
        if (this.initialTime < 0) this.initialTime = 0;
        this.timerText.setText(this.formatTime(this.initialTime));

        // Fin du jeu
        if (this.initialTime <= 0) {
            this.time.removeEvent(this.timerEvent);
            this.scene.start("GameOver");
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const partInSeconds = seconds % 60;
        return `${minutes}:${partInSeconds.toString().padStart(2, "0")}`;
    }

    // Retire du temps et flash rouge
    applyPenalty(minutes) {
        this.initialTime -= minutes * 60;
        if (this.initialTime < 0) this.initialTime = 0;
        this.timerText.setText(this.formatTime(this.initialTime));
        this.cameras.main.flash(500, 255, 0, 0);
    }

    // =================================================================
    // CARNET DE NOTES (HTML)
    // =================================================================

    createNotebook() {
        if (document.getElementById("notebook-btn")) return;

        // Bouton HTML
        const btn = document.createElement("button");
        btn.id = "notebook-btn";
        btn.innerHTML = "📒 NOTES";
        document.body.appendChild(btn);

        // Container HTML
        const container = document.createElement("div");
        container.id = "notebook-container";
        container.innerHTML = `
            <h3 style="margin:0 0 10px 0; text-align:center; color:#5d4037; border-bottom:1px solid #5d4037;">Enquête</h3>
            <textarea id="notebook-area" placeholder="- Code porte ?"></textarea>
            <div style="text-align:right; margin-top:5px;">
                <button onclick="document.getElementById('notebook-container').style.display='none'" style="cursor:pointer; padding:5px;">Fermer</button>
            </div>
        `;
        document.body.appendChild(container);

        // Toggle
        btn.onclick = () => {
            const el = document.getElementById("notebook-container");
            el.style.display = el.style.display === "block" ? "none" : "block";
        };
    }

    // =================================================================
    // INTERFACE DE ZOOM & PUZZLES
    // =================================================================

    createZoomInterface() {
        this.zoomContainer = this.add
            .container(0, 0)
            .setVisible(false)
            .setDepth(100);

        this.zoomOverlay = this.add
            .rectangle(
                this.scale.width / 2,
                this.scale.height / 2,
                this.scale.width,
                this.scale.height,
                0x000000,
                0.95,
            )
            .setInteractive();
            
        this.zoomCardSprite = this.add.sprite(
            this.scale.width / 2,
            this.scale.height / 2,
            "",
        );

        const closeBtnText = this.add
            .text(this.scale.width - 80, 50, "FERMER X", {
                font: "bold 20px Arial",
                color: "#ffffff",
                backgroundColor: "#cc0000",
                padding: 15,
            })
            .setOrigin(0.5)
            .setInteractive()
            .on("pointerdown", () => this.closeZoom());

        this.zoomText = this.add
            .text(this.scale.width / 2, this.scale.height - 120, "", {
                font: "24px Arial",
                color: "#fff",
                align: "center",
                backgroundColor: "#000000aa",
                padding: 5,
            })
            .setOrigin(0.5);

        this.flipBtn = this.add
            .text(this.scale.width / 2, this.scale.height - 60, "RETOURNER ⟳", {
                font: "bold 28px Arial",
                color: "#00ff00",
                backgroundColor: "#333",
                padding: 10,
            })
            .setOrigin(0.5)
            .setInteractive()
            .on("pointerdown", () => this.flipCurrentCard());

        this.actionBtn = this.add
            .text(
                this.scale.width / 2,
                this.scale.height - 180,
                "ENTRER CODE",
                {
                    font: "bold 28px Arial",
                    color: "#ffffff",
                    backgroundColor: "#ff0000",
                    padding: 10,
                },
            )
            .setOrigin(0.5)
            .setInteractive()
            .setVisible(false);

        this.zoomContainer.add([
            this.zoomOverlay,
            this.zoomCardSprite,
            this.zoomText,
            this.flipBtn,
            this.actionBtn,
            closeBtnText,
        ]);
    }

    openZoom(id) {
        this.currentZoomId = id;
        this.errorCount = 0;
        const cardData = GameData.cards[id] || { name: "Carte inconnue" };

        // Si déjà révélée, on commence face visible
        if (this.revealedCards.includes(id)) {
            this.isFlipped = true;
            this.zoomCardSprite.setTexture(`devant_${id}`);
        } else {
            this.isFlipped = false;
            this.zoomCardSprite.setTexture(`dos_${id}`);
        }

        this.zoomCardSprite.setPosition(
            this.scale.width / 2,
            this.scale.height / 2,
        );
        this.zoomText.setText(cardData.name);
        this.adjustZoomScale();

        this.zoomContainer.setVisible(true);
        this.checkActionAvailability(id);

        // Si Puzzle T9, on décale et on affiche le clavier
        if (cardData.puzzleType === "t9") {
            this.tweens.add({
                targets: this.zoomCardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: "Power2",
            });
            this.renderPhonePuzzle(id);
        }

        // Cache la barre de recherche
        document.getElementById("ui-search-container").style.display = "none";
    }

    closeZoom() {
        this.zoomContainer.setVisible(false);
        this.currentZoomId = null;

        // Nettoyage interfaces HTML
        const inputDiv = document.getElementById("game-input-div");
        if (inputDiv) inputDiv.style.display = "none";

        const puzzleDiv = document.getElementById("puzzle-container");
        if (puzzleDiv) puzzleDiv.remove();

        const searchUI = document.getElementById("ui-search-container");
        if (searchUI) searchUI.style.display = "flex";

        // Refresh pour update les cartes retournées (si changées pendant le zoom)
        this.refreshInventory();
    }

    renderPhonePuzzle(cardId) {
        const div = document.createElement("div");
        div.id = "puzzle-container";
        div.style.display = "block";

        div.innerHTML = `
            <div class="phone-interface">
                <div id="phone-display" class="phone-screen"></div>
                <div class="phone-grid">
                    <button class="phone-btn" data-k="1">1<span>&nbsp;</span></button>
                    <button class="phone-btn" data-k="2">2<span>ABC</span></button>
                    <button class="phone-btn" data-k="3">3<span>DEF</span></button>
                    <button class="phone-btn" data-k="4">4<span>GHI</span></button>
                    <button class="phone-btn" data-k="5">5<span>JKL</span></button>
                    <button class="phone-btn" data-k="6">6<span>MNO</span></button>
                    <button class="phone-btn" data-k="7">7<span>PQRS</span></button>
                    <button class="phone-btn" data-k="8">8<span>TUV</span></button>
                    <button class="phone-btn" data-k="9">9<span>WXYZ</span></button>
                    <button class="phone-btn" data-k="*">*<span></span></button>
                    <button class="phone-btn" data-k="0">0<span>+</span></button>
                    <button class="phone-btn" data-k="#">#<span></span></button>
                    
                    <button id="btn-validate-phone" class="phone-btn phone-validate">APPELER 📞</button>
                    <button id="btn-clear-phone" class="phone-btn" style="background:#800; grid-column:span 3; margin-top:5px;">EFFACER</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        const display = document.getElementById("phone-display");
        const keys = document.querySelectorAll(".phone-btn[data-k]");

        keys.forEach((btn) => {
            btn.onclick = () => {
                if (display.innerText.length < 12) {
                    display.innerText += btn.getAttribute("data-k");
                }
            };
        });

        document.getElementById("btn-clear-phone").onclick = () => {
            display.innerText = "";
        };

        document.getElementById("btn-validate-phone").onclick = () => {
            const codeEntered = display.innerText;
            const targetData = GameData.cards[cardId];

            if (codeEntered === targetData.solution) {
                // Anti-spam
                if (this.inventory.includes(targetData.rewards[0])) {
                    this.showNotification("Déjà déverrouillé !", "info");
                    return;
                }

                this.showNotification(targetData.successMessage, "success");
                targetData.rewards.forEach((r) => {
                    if (!this.inventory.includes(r)) this.inventory.push(r);
                });

                // Cartes complétées
                if (targetData.linkedIds) {
                    this.completedCards.push(...targetData.linkedIds);
                }

                this.refreshInventory();
                this.closeZoom();
            } else {
                this.errorCount++;
                display.innerText = "ERREUR";
                display.style.color = "red";
                this.cameras.main.flash(200, 255, 0, 0);

                setTimeout(() => {
                    display.innerText = "";
                    display.style.color = "black";
                }, 1000);

                // Indice après 3 erreurs
                if (this.errorCount >= 3) {
                    this.showNotification(
                        "INDICE DÉBLOQUÉ (Haut Droite)",
                        "warning",
                    );
                    this.showHint(targetData.hint); // Affiche dans la zone fixe
                } else {
                    this.showNotification(
                        `Faux... ${this.errorCount}/3`,
                        "error",
                    );
                }
            }
        };
    }

    adjustZoomScale() {
        // Demi-écran si T9, sinon plein écran
        const availableWidth =
            this.currentZoomId &&
            GameData.cards[this.currentZoomId].puzzleType === "t9"
                ? this.scale.width / 2 - 50
                : this.scale.width - 100;

        const availableHeight = this.scale.height - 250;
        const scale = Math.min(
            availableWidth / this.zoomCardSprite.width,
            availableHeight / this.zoomCardSprite.height,
            1.2,
        );
        this.zoomCardSprite.setScale(scale);
    }

    flipCurrentCard() {
        if (!this.currentZoomId) return;

        this.tweens.add({
            targets: this.zoomCardSprite,
            scaleX: 0,
            duration: 150,
            onComplete: () => {
                this.isFlipped = !this.isFlipped;
                this.zoomCardSprite.setTexture(
                    this.isFlipped
                        ? `devant_${this.currentZoomId}`
                        : `dos_${this.currentZoomId}`,
                );

                // Sauvegarde état révélé
                if (
                    this.isFlipped &&
                    !this.revealedCards.includes(this.currentZoomId)
                ) {
                    this.revealedCards.push(this.currentZoomId);
                }

                const data = GameData.cards[this.currentZoomId];
                this.zoomText.setText(
                    this.isFlipped && data ? data.text || "" : data.name,
                );

                this.adjustZoomScale();
                this.tweens.add({
                    targets: this.zoomCardSprite,
                    scaleX: this.zoomCardSprite.scaleY,
                    duration: 150,
                });
                this.checkActionAvailability(this.currentZoomId);
            },
        });
    }

    checkActionAvailability(id) {
        const data = GameData.cards[id];
        // Action dispo seulement si recto et type machine (pas puzzle)
        if (this.isFlipped && data && data.type === "machine") {
            this.actionBtn.setVisible(true);
            this.actionBtn
                .off("pointerdown")
                .on("pointerdown", () => this.triggerMachine(id));
        } else {
            this.actionBtn.setVisible(false);
        }
    }

    triggerMachine(id) {
        const data = GameData.cards[id];
        const inputDiv = document.getElementById("game-input-div");
        const field = document.getElementById("game-input-field");

        if (inputDiv) {
            document.getElementById("game-input-prompt").innerText =
                data.prompt;
            field.value = "";
            inputDiv.style.display = "block";
            field.focus();

            window.validateCode = () => {
                const val = field.value.toUpperCase().trim();

                // Si le code est bon
                if (val === data.code) {
                    // Anti-Spam
                    if (this.inventory.includes(data.rewards[0])) {
                        this.showNotification("Déjà ouvert !", "info");
                        inputDiv.style.display = "none";
                        return;
                    }

                    inputDiv.style.display = "none";
                    let added = 0;
                    data.rewards.forEach((r) => {
                        if (!this.inventory.includes(r)) {
                            this.inventory.push(r);
                            added++;
                        }
                    });

                    // Complétion
                    if (data.linkedIds) {
                        this.completedCards.push(...data.linkedIds);
                    } else {
                        this.completedCards.push(id);
                    }

                    if (added > 0) {
                        this.showNotification(
                            "CODE VALIDE ! Nouvelles cartes.",
                            "success",
                        );
                        this.closeZoom();
                        this.refreshInventory();
                    }
                }
                // Si c'est un piège connu
                else if (GameData.penalties[val]) {
                    this.applyPenalty(5);
                    this.showNotification("PIÈGE ! -5 minutes !", "warning");
                }
                // Si c'est juste faux
                else {
                    this.applyPenalty(1);
                    this.showNotification("Code Incorrect (-1 min)", "error");
                }
            };
        }
    }
    
    // =================================================================
    // BARRE DE RECHERCHE (UI)
    // =================================================================

    createUISystem() {
        const oldDiv = document.getElementById("ui-search-container");
        if (oldDiv) oldDiv.remove();

        const div = document.createElement("div");
        div.id = "ui-search-container";
        div.style =
            "position:absolute; bottom:20px; left:50%; transform:translateX(-50%); z-index:50; background:rgba(0,0,0,0.8); padding:15px; border-radius:15px; display:flex; gap:10px;";
        div.innerHTML = `
            <input type="text" id="search-card" placeholder="N°..." style="padding:10px; font-size:18px; width:100px; text-align:center; border-radius:5px; border:none;">
            <button id="btn-search" style="padding:10px 20px; font-size:18px; cursor:pointer; background:#00ff00; border:none; border-radius:5px; font-weight:bold;">PRENDRE</button>
        `;
        document.body.appendChild(div);

        const takeCard = () => {
            const val = document.getElementById("search-card").value.trim();

            // Check piège
            if (GameData.penalties[val]) {
                const p = GameData.penalties[val];
                this.applyPenalty(p.time);
                this.showNotification(
                    `CARTE PIÈGE ! (-${p.time} min)`,
                    "warning",
                );

                if (GameData.cards[val] && !this.inventory.includes(val)) {
                    this.inventory.push(val);
                    // Pas de pagination, on refresh juste la grille
                    this.refreshInventory();
                }
                document.getElementById("search-card").value = "";
                return;
            }

            // Check existence
            if (!GameData.cardIds.includes(val)) {
                this.showNotification(`Numéro ${val} introuvable.`, "error");
                return;
            }

            // Check les doublon
            if (this.inventory.includes(val)) {
                this.showNotification(`Déjà possédé : ${val}.`, "info");
                return;
            }

            // Check les dépendances
            const cardData = GameData.cards[val];
            if (cardData && cardData.requires) {
                const hasRequirement = cardData.requires.some((reqId) =>
                    this.inventory.includes(reqId),
                );
                if (!hasRequirement) {
                    this.showNotification(
                        `Impossible de prendre ${val} maintenant.`,
                        "error",
                    );
                    return;
                }
            }

            // Ajout valide
            this.inventory.push(val);
            this.refreshInventory();
            this.showNotification(`Carte ${val} récupérée !`, "success");
            document.getElementById("search-card").value = "";
        };

        document
            .getElementById("search-card")
            .addEventListener("keypress", (e) => {
                if (e.key === "Enter") takeCard();
            });
        document.getElementById("btn-search").onclick = takeCard;
    }
}