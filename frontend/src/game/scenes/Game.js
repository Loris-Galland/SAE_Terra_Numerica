import { Scene } from 'phaser';
import { GameData } from '../GameData';
import { EventBus } from '../EventBus';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.inventory = []; 
        this.currentZoomId = null; 
        this.isFlipped = false; 

        // Pagination inventaire
        this.currentPage = 0;
        this.itemsPerPage = 4;

        // Timer 1h
        this.initialTime = 3600; 
        this.timerEvent = null;
    }

    create() {
        // Setup du fond
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'background').setAlpha(0.2);
        
        // On init l'inventaire sans doublons
        this.inventory = [...new Set(GameData.initialInventory)];

        this.cardsContainer = this.add.container(0, 0);
        
        // On lance tous les systèmes
        this.createUISystem(); // Barre recherche
        this.createNotebook(); // Notes
        this.createTimer();    
        this.refreshInventory(); 
        this.createZoomInterface(); 
        this.createNotificationSystem(); // Popups

        EventBus.emit('current-scene-ready', this);
    }

    // Gestion des notifications (Popups in-game)
    createNotificationSystem() {
        this.notificationContainer = this.add.container(this.scale.width / 2, -100).setDepth(2000);

        // Fond et texte
        this.notifBg = this.add.rectangle(0, 0, 600, 80, 0x000000, 0.9).setStrokeStyle(4, 0xffffff);
        this.notifText = this.add.text(0, 0, "", { font: 'bold 24px Arial', color: '#ffffff', align: 'center' }).setOrigin(0.5);

        this.notificationContainer.add([this.notifBg, this.notifText]);
    }

    showNotification(message, type = 'info') {
        let color = 0x333333; 
        let stroke = 0xffffff;

        // Choix couleur selon type
        if (type === 'success') { color = 0x2e7d32; stroke = 0x00ff00; }
        else if (type === 'error') { color = 0xc62828; stroke = 0xff0000; }
        else if (type === 'warning') { color = 0xff8f00; stroke = 0xffff00; } // Pour les pénalités

        this.notifBg.setFillStyle(color, 0.95).setStrokeStyle(4, stroke);
        this.notifText.setText(message);

        // Animation d'apparition
        this.tweens.killTweensOf(this.notificationContainer);
        this.notificationContainer.y = -100; 

        this.tweens.chain({
            targets: this.notificationContainer,
            tweens: [
                { y: 100, duration: 300, ease: 'Back.out' }, // Descend
                { delay: 2500, duration: 0 }, // Reste
                { y: -100, duration: 300, ease: 'Back.in' } // Remonte
            ]
        });
    }

    // Timer et Pénalités
    createTimer() {
        const bg = this.add.rectangle(this.scale.width - 100, 40, 180, 50, 0x000000, 0.7);
        this.timerText = this.add.text(this.scale.width - 100, 40, this.formatTime(this.initialTime), {
            font: 'bold 32px Arial', color: '#ff0000'
        }).setOrigin(0.5);

        // Tick chaque seconde
        this.timerEvent = this.time.addEvent({
            delay: 1000, callback: this.onTimerTick, callbackScope: this, loop: true
        });
    }

    onTimerTick() {
        this.initialTime--;
        if (this.initialTime < 0) this.initialTime = 0;
        this.timerText.setText(this.formatTime(this.initialTime));

        // Fin du jeu
        if (this.initialTime <= 0) {
            this.time.removeEvent(this.timerEvent);
            this.scene.start('GameOver');
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const partInSeconds = seconds % 60;
        return `${minutes}:${partInSeconds.toString().padStart(2, '0')}`;
    }

    // Retire du temps et flash rouge
    applyPenalty(minutes) {
        this.initialTime -= (minutes * 60);
        if (this.initialTime < 0) this.initialTime = 0;
        this.timerText.setText(this.formatTime(this.initialTime));
        this.cameras.main.flash(500, 255, 0, 0);
    }

    // Affichage Inventaire
    refreshInventory() {
        this.cardsContainer.removeAll(true);
        
        // Pagination
        const totalPages = Math.ceil(this.inventory.length / this.itemsPerPage);
        if (this.currentPage >= totalPages && totalPages > 0) this.currentPage = totalPages - 1;

        const startIndex = this.currentPage * this.itemsPerPage;
        const cardsOnPage = this.inventory.slice(startIndex, startIndex + this.itemsPerPage);

        const startX = 200; 
        const startY = this.scale.height - 200; 
        const gap = 200; 

        // Création des sprites
        cardsOnPage.forEach((id, index) => {
            const x = startX + (index * gap);
            const sprite = this.add.sprite(x, startY, `dos_${id}`).setInteractive();
            const scale = 150 / sprite.height; 
            sprite.setScale(scale);
            
            // Effets hover
            sprite.on('pointerover', () => {
                this.tweens.add({ targets: sprite, scale: scale * 1.1, y: startY - 10, duration: 100 });
                sprite.setTint(0xdddddd);
            });
            sprite.on('pointerout', () => {
                this.tweens.add({ targets: sprite, scale: scale, y: startY, duration: 100 });
                sprite.clearTint();
            });
            sprite.on('pointerdown', () => this.openZoom(id));
            this.cardsContainer.add(sprite);
        });

        this.createPaginationControls(totalPages);
    }

    createPaginationControls(totalPages) {
        const yPos = this.scale.height - 200;
        // Bouton Précédent
        if (this.currentPage > 0) {
            const prevBtn = this.add.text(50, yPos, "<", {
                font: 'bold 60px Arial', color: '#00ff00', backgroundColor: '#00000088', padding: 10
            }).setInteractive().setOrigin(0.5)
            .on('pointerdown', () => { this.currentPage--; this.refreshInventory(); });
            this.cardsContainer.add(prevBtn);
        }
        // Bouton Suivant
        if (this.currentPage < totalPages - 1) {
            const nextBtn = this.add.text(this.scale.width - 50, yPos, ">", {
                font: 'bold 60px Arial', color: '#00ff00', backgroundColor: '#00000088', padding: 10
            }).setInteractive().setOrigin(0.5)
            .on('pointerdown', () => { this.currentPage++; this.refreshInventory(); });
            this.cardsContainer.add(nextBtn);
        }
    }

    // Notes
    createNotebook() {
        if (document.getElementById('notebook-btn')) return;
        
        // Bouton HTML
        const btn = document.createElement('button');
        btn.id = 'notebook-btn';
        btn.innerHTML = '📒 NOTES';
        document.body.appendChild(btn);

        // Container HTML
        const container = document.createElement('div');
        container.id = 'notebook-container';
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
            const el = document.getElementById('notebook-container');
            el.style.display = (el.style.display === 'block') ? 'none' : 'block';
        };
    }

    // Zoom
    createZoomInterface() {
        this.zoomContainer = this.add.container(0, 0).setVisible(false).setDepth(100);
        this.zoomOverlay = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0x000000, 0.95).setInteractive();
        this.zoomCardSprite = this.add.sprite(this.scale.width/2, this.scale.height/2, '');

        const closeBtnText = this.add.text(this.scale.width - 80, 50, "FERMER X", { font: 'bold 20px Arial', color: '#ffffff', backgroundColor: '#cc0000', padding: 15 })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.closeZoom());

        this.zoomText = this.add.text(this.scale.width/2, this.scale.height - 120, '', { font: '24px Arial', color: '#fff', align: 'center', backgroundColor: '#000000aa', padding: 5 }).setOrigin(0.5);
        
        this.flipBtn = this.add.text(this.scale.width/2, this.scale.height - 60, 'RETOURNER ⟳', { font: 'bold 28px Arial', color: '#00ff00', backgroundColor: '#333', padding: 10 })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.flipCurrentCard());

        this.actionBtn = this.add.text(this.scale.width/2, this.scale.height - 180, 'ENTRER CODE', { font: 'bold 28px Arial', color: '#ffffff', backgroundColor: '#ff0000', padding: 10 })
            .setOrigin(0.5).setInteractive().setVisible(false);

        this.zoomContainer.add([this.zoomOverlay, this.zoomCardSprite, this.zoomText, this.flipBtn, this.actionBtn, closeBtnText]);
    }

    openZoom(id) {
        this.currentZoomId = id;
        this.isFlipped = false;
        const cardData = GameData.cards[id] || { name: "Carte inconnue" };
        
        this.zoomCardSprite.setTexture(`dos_${id}`);
        this.zoomText.setText(cardData.name);
        this.adjustZoomScale();
        
        this.zoomContainer.setVisible(true);
        this.checkActionAvailability(id);
        
        // Cache la barre de recherche
        document.getElementById('ui-search-container').style.display = 'none';
    }

    adjustZoomScale() {
        const availableWidth = this.scale.width - 100;
        const availableHeight = this.scale.height - 250; 
        const scale = Math.min(availableWidth / this.zoomCardSprite.width, availableHeight / this.zoomCardSprite.height, 1.2); 
        this.zoomCardSprite.setScale(scale);
    }

    closeZoom() {
        this.zoomContainer.setVisible(false);
        this.currentZoomId = null;
        
        // Cache input code et réaffiche recherche
        const inputDiv = document.getElementById('game-input-div');
        if (inputDiv) inputDiv.style.display = 'none';
        
        const searchUI = document.getElementById('ui-search-container');
        if (searchUI) searchUI.style.display = 'flex';
    }

    flipCurrentCard() {
        if (!this.currentZoomId) return;
        
        // Anim flip
        this.tweens.add({
            targets: this.zoomCardSprite, scaleX: 0, duration: 150,
            onComplete: () => {
                this.isFlipped = !this.isFlipped;
                this.zoomCardSprite.setTexture(this.isFlipped ? `devant_${this.currentZoomId}` : `dos_${this.currentZoomId}`);
                
                const data = GameData.cards[this.currentZoomId];
                this.zoomText.setText((this.isFlipped && data) ? (data.text || "") : data.name);
                
                this.adjustZoomScale();
                this.tweens.add({ targets: this.zoomCardSprite, scaleX: this.zoomCardSprite.scaleY, duration: 150 });
                this.checkActionAvailability(this.currentZoomId);
            }
        });
    }

    checkActionAvailability(id) {
        const data = GameData.cards[id];
        // Action dispo seulement si recto et type machine
        if (this.isFlipped && data && data.type === 'machine') {
            this.actionBtn.setVisible(true);
            this.actionBtn.off('pointerdown').on('pointerdown', () => this.triggerMachine(id));
        } else {
            this.actionBtn.setVisible(false);
        }
    }

    triggerMachine(id) {
        const data = GameData.cards[id];
        const inputDiv = document.getElementById('game-input-div');
        const prompt = document.getElementById('game-input-prompt');
        const field = document.getElementById('game-input-field');
        
        if (inputDiv) {
            prompt.innerText = data.prompt;
            field.value = '';
            inputDiv.style.display = 'block';
            field.focus();
            
            window.validateCode = () => {
                const val = field.value.toUpperCase().trim();
                
                // Si le code est bon
                if (val === data.code) {
                    inputDiv.style.display = 'none';
                    let added = 0;
                    data.rewards.forEach(r => {
                        if (!this.inventory.includes(r)) { this.inventory.push(r); added++; }
                    });
                    
                    if (added > 0) {
                        this.showNotification("CODE VALIDE ! Nouvelles cartes.", 'success');
                        this.closeZoom();
                        this.refreshInventory();
                    } else {
                        this.showNotification("Code déjà utilisé.", 'info');
                        this.closeZoom();
                    }
                } 
                // Si c'est un piège connu
                else if (GameData.penalties[val]) { 
                     this.applyPenalty(5);
                     this.showNotification("PIÈGE ! -5 minutes !", 'warning');
                }
                // Si c'est juste faux
                else {
                    this.applyPenalty(1);
                    this.showNotification("Code Incorrect (-1 min)", 'error');
                }
            };
        }
    }

    // Barre de recherche
    createUISystem() {
        const oldDiv = document.getElementById('ui-search-container');
        if (oldDiv) oldDiv.remove();

        const div = document.createElement('div');
        div.id = 'ui-search-container';
        div.style = "position:absolute; bottom:20px; left:50%; transform:translateX(-50%); z-index:50; background:rgba(0,0,0,0.8); padding:15px; border-radius:15px; display:flex; gap:10px;";
        div.innerHTML = `
            <input type="text" id="search-card" placeholder="N°..." style="padding:10px; font-size:18px; width:100px; text-align:center; border-radius:5px; border:none;">
            <button id="btn-search" style="padding:10px 20px; font-size:18px; cursor:pointer; background:#00ff00; border:none; border-radius:5px; font-weight:bold;">PRENDRE</button>
        `;
        document.body.appendChild(div);

        const takeCard = () => {
            const val = document.getElementById('search-card').value.trim();

            // Check piège
            if (GameData.penalties[val]) {
                const p = GameData.penalties[val];
                this.applyPenalty(p.time);
                this.showNotification(p.message, 'warning');
                document.getElementById('search-card').value = '';
                return;
            }

            // Check existe pas
            if (!GameData.cardIds.includes(val)) {
                this.showNotification(`Numéro ${val} introuvable.`, 'error');
                return;
            }

            // Check doublon
            if (this.inventory.includes(val)) {
                this.showNotification(`Déjà possédé : ${val}.`, 'info');
                return;
            }

            // Ajout valide
            this.inventory.push(val);
            this.currentPage = Math.ceil(this.inventory.length / this.itemsPerPage) - 1;
            this.refreshInventory();
            this.showNotification(`Carte ${val} récupérée !`, 'success');
            document.getElementById('search-card').value = '';
        };

        document.getElementById('search-card').addEventListener("keypress", (e) => { if (e.key === "Enter") takeCard(); });
        document.getElementById('btn-search').onclick = takeCard;
    }
}