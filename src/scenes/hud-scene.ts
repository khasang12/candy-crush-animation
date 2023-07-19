import { CONST } from '../const/const'

export class HUDScene extends Phaser.Scene {
    private textElements: Map<string, Phaser.GameObjects.BitmapText>
    private loadingBar: Phaser.GameObjects.NineSlice
    private progressBar: Phaser.GameObjects.NineSlice
    private progressParticle: Phaser.GameObjects.Particles.ParticleEmitter
    private textLock: boolean
    private target: number

    constructor() {
        super({
            key: 'HUDScene',
        })
    }

    create(): void {
        this.target = CONST.milestone
        this.createLoadingbar()
        this.progressParticle = this.add
            .particles(525, 157.5, 'flares', {
                frame: 'white',
                color: [0xaec6cf, 0x96e0da, 0x937ef3],
                lifespan: 800,
                angle: { min: -90 + 180, max: 90 + 180 },
                scale: { start: 0.13, end: 0, ease: 'sine.in' },
                speed: { min: 20, max: 30 },
                blendMode: 'ADD',
            })
            .setAlpha(0)
            .setDepth(2)

        this.textElements = new Map([
            [
                'TARGET',
                this.addText(520, 8, `Goal: ${this.registry.get('level') * CONST.milestone}`),
            ],
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
        this.tweens.add({
            targets: this.progressBar,
            width: (228 * this.registry.get('score')) / this.target,
            duration: 200,
            ease: 'sine.inout',
            onComplete:()=>{
                this.progressParticle.setAlpha(1)
                this.progressParticle.setX(528 + (180 * this.registry.get('score')) / this.target)
            }
        })
        
    }

    private updateScore() {
        console.log(this.registry.get('score'))
        this.textElements.get('SCORE')?.setText(`Score: ${this.registry.get('score')}`)
        this.updateProgress()
        if (
            (!this.textLock &&
                this.registry.get('score') % CONST.milestone == 0 &&
                this.registry.get('score') > 0) ||
            this.registry.get('score') > this.registry.get('level') * CONST.milestone
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
        this.textElements.get('LEVEL')?.setAlpha(0)
        this.target += CONST.milestone
        this.textElements.get('TARGET')?.setText(`Goal: ${this.target}`)
        this.textElements
            .get('LEVEL')
            ?.setAlpha(1)
            .setText(`Level: ${this.registry.get('level')}`)
        this.updateProgress()
    }

    private createLoadingbar(): void {
        this.loadingBar = this.add.nineslice(520, 160, 'ui', 'ButtonOrange')
        this.progressBar = this.add.nineslice(528, 158, 'ui', 'ButtonOrangeFill1', 0, 16, 6, 6)
        this.loadingBar.setOrigin(0, 0.5).setScale(0.75, 0.6)
        this.progressBar.setOrigin(0, 0.5).setScale(0.75, 0.6)
    }
}
