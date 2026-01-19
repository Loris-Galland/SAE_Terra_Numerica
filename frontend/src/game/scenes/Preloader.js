import { Scene } from 'phaser';
import { GameData } from '../GameData';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        this.load.setPath('assets');

        // Charger le fond du menu
        this.load.image('background', 'background.jpg'); 

        // Chargement Automatique des Cartes (Recto et Verso)
        GameData.cardIds.forEach(id => {
            // Charge "devant_X.png"
            this.load.image(`devant_${id}`, `devant_${id}.png`);
            // Charge "dos_X.png"
            this.load.image(`dos_${id}`, `dos_${id}.png`);
        });

        // Barre de chargement visuelle
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1); 
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            this.scene.start('MainMenu');
        });
    }
}