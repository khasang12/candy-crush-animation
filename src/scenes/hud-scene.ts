export class HUDScene extends Phaser.Scene {
    private textElements: Map<string, Phaser.GameObjects.BitmapText>
    private loadingBar: Phaser.GameObjects.Graphics
    private progressBar: Phaser.GameObjects.Graphics
    private progressParticle: Phaser.GameObjects.Particles.ParticleEmitter
    private textLock: boolean
    private target: number

    constructor() {
        super({
            key: 'HUDScene',
        })
    }

    create(): void {
        this.target = 500
        this.createLoadingbar()
        this.progressParticle = this.add
            .particles(520, 160, 'flares', {
                frame: 'white',
                color: [0xaec6cf, 0x96e0da, 0x937ef3],
                colorEase: 'quart.out',
                lifespan: 200,
                angle: { min: -15 + 180, max: 15 + 180 },
                scale: { start: 0.25, end: 0, ease: 'sine.in' },
                speed: { min: 150, max: 250 },
                advance: 2000,
                blendMode: 'ADD',
            })
            .setAlpha(0)

        this.textElements = new Map([
            ['TARGET', this.addText(520, 8, `Goal: ${this.registry.get('level') * 500}`)],
            ['LEVEL', this.addText(520, 48, `Level: ${this.registry.get('level')}`)],
            ['SCORE', this.addText(520, 88, `Score: ${this.registry.get('score')}`)],
        ])

        // create events
        const level = this.scene.get('GameScene')
        level.events.on('scoreChanged', this.updateScore, this)
        level.events.on('levelChanged', this.updateLevel, this)
    }

    private addText(x: number, y: number, value: string): Phaser.GameObjects.BitmapText {
        return this.add.bitmapText(x, y, 'font', value, 35)
    }

    private updateProgress() {
        this.progressBar.clear()
        this.progressBar.fillStyle(0xfff6d3, 1)
        this.progressBar.fillRect(522, 152, (180 * this.registry.get('score')) / this.target, 16)
        this.progressParticle.setAlpha(1)
        this.progressParticle.setX(522 + (180 * this.registry.get('score')) / this.target)
    }

    private updateScore() {
        this.textElements.get('SCORE')?.setText(`Score: ${this.registry.get('score')}`)
        this.updateProgress()
        if (
            (!this.textLock &&
                this.registry.get('score') % 500 == 0 &&
                this.registry.get('score') > 0) ||
            this.registry.get('score') > this.registry.get('level') * 500
        ) {
            this.registry.values.level += 1
            this.textLock = true
            this.time.delayedCall(300, () => {
                this.updateLevel()
                this.updateScore()
                this.progressParticle.setAlpha(0)
            })
        } else {
            this.textLock = false
        }
    }

    private updateLevel() {
        // Create the tweens
        this.textElements.get('LEVEL')?.setAlpha(0)
        this.tweens.add({
            targets: this.textElements.get('TARGET'),
            x: 100,
            y: 150,
            scale: 3,
            duration: 500,
            ease: 'cubic.out',
            delay: 500,
            yoyo: true,
            onComplete: () => {
                this.target += 500
                this.textElements.get('TARGET')?.setText(`Goal: ${this.target}`)
                this.textElements
                    .get('LEVEL')
                    ?.setAlpha(1)
                    .setText(`Level: ${this.registry.get('level')}`)
                this.updateProgress()
            },
        })
    }

    private createLoadingbar(): void {
        this.loadingBar = this.add.graphics()
        this.loadingBar.fillStyle(0x004c8d, 1)
        this.loadingBar.fillRect(520, 150, 182, 20)
        this.progressBar = this.add.graphics()
    }
}
