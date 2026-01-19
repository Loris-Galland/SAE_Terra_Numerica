import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        // Fond d'écran
        this.add.image(width / 2, height / 2, 'background').setAlpha(0.4);

        // Titre
        this.add.text(width / 2, 150, 'ESCAPE GAME\nTERRA NUMERICA', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Bouton Jouer
        const startBtn = this.add.text(width / 2, height / 2 + 100, 'COMMENCER', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        startBtn.on('pointerdown', () => {
            this.scene.start('Game');
        });
        
        startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ffff00' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ fill: '#00ff00' }));

        // On affiche une carte qui se retourne toute seule 
        this.createDemoCard(width - 150, height - 200, '1'); 

        EventBus.emit('current-scene-ready', this);
    }

    createDemoCard(x, y, id) {
        // Commence par le DOS
        const card = this.add.image(x, y, `dos_${id}`).setScale(0.4);
        
        // Animation de retournement infinie
        this.tweens.add({
            targets: card,
            scaleX: 0, 
            duration: 1000,
            yoyo: true,
            repeat: -1,
            hold: 500, 
            onYoyo: () => {
                // Au moment où la carte est invisible (scaleX = 0), on change la texture
                const currentKey = card.texture.key;
                const newKey = currentKey === `dos_${id}` ? `devant_${id}` : `dos_${id}`;
                card.setTexture(newKey);
            }
        });
    }
}