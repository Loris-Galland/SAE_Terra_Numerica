import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);
        if (this.textures.exists('background')) {
            const bg = this.add.image(width / 2, height / 2, 'background');
            const scaleX = width / bg.width;
            const scaleY = height / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale).setScrollFactor(0);
            bg.setAlpha(0.3);
            bg.setTint(0xaaaaaa);
        }
        const spotLight = this.add.circle(width / 2, height / 2 - 100, 400, 0xffffff, 0.05);
        this.tweens.add({
            targets: spotLight,
            alpha: 0.08,
            scale: 1.1,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        const titleText = "DOSSIER:\nTERRA NUMERICA";
        const titleObj = this.add.text(width / 2, height / 3, '', {
            fontFamily: 'Courier New',
            fontSize: 84,
            color: '#ffffff',
            align: 'center',
            fontStyle: 'bold',
            shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 0, fill: true }
        }).setOrigin(0.5);

        let i = 0;
        this.time.addEvent({
            delay: 150,
            callback: () => {
                titleObj.text += titleText[i];
                i++;
            },
            repeat: titleText.length - 1
        });
        this.add.text(width - 50, height - 50, 'REF: CASE #99-2024\nSTATUS: NON RESOLU', {
            fontFamily: 'Courier New',
            fontSize: 18,
            color: '#cc0000',
            align: 'right'
        }).setOrigin(1, 1).setAlpha(0.7);
        const btnContainer = this.add.container(width / 2, height * 0.7);
        const folder = this.add.rectangle(0, 0, 300, 80, 0xd2b48c).setStrokeStyle(4, 0x5d4037); // Couleur Kraft
        const paperClip = this.add.rectangle(-130, -30, 20, 40, 0xc0c0c0).setStrokeStyle(2, 0x555555); // Trombone
        const btnText = this.add.text(0, 0, "OUVRIR L'ENQUÊTE", {
            fontFamily: 'Courier New',
            fontSize: 28,
            color: '#3e2723',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const stamp = this.add.text(100, -20, "CONFIDENTIEL", {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#cc0000',
            backgroundColor: null
        }).setOrigin(0.5).setRotation(0.2).setAlpha(0.8);
        const stampBorder = this.add.rectangle(100, -20, 140, 30).setStrokeStyle(2, 0xcc0000).setRotation(0.2).setAlpha(0.8);
        btnContainer.add([folder, paperClip, btnText, stampBorder, stamp]);
        folder.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                btnContainer.setScale(1.05);
                folder.setFillStyle(0xe0c090);
            })
            .on('pointerout', () => {
                btnContainer.setScale(1);
                folder.setFillStyle(0xd2b48c);
            })
            .on('pointerdown', () => {
                this.cameras.main.fadeOut(1000, 0, 0, 0);
                this.time.delayedCall(1000, () => {
                    this.scene.start('Game');
                });
            });
        EventBus.emit('current-scene-ready', this);
    }
}