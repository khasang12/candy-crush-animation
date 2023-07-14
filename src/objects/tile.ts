import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Sprite {
    private isGlow4: boolean
    private isGlow5: boolean
    private matchGlow4FX: Phaser.FX.Glow
    private matchGlow5FX: Phaser.FX.Glow
    private selectedShader: Phaser.GameObjects.Shader
    private tileGraphics: Phaser.GameObjects.Graphics

    private suggestedTween: Phaser.Tweens.Tween | undefined
    private match4Tween: Phaser.Tweens.Tween | undefined

    constructor(aParams: IImageConstructor) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        // set image settings
        this.setOrigin(0.5, 0.5)
        this.setScale(0.8)
        this.setInteractive()

        // Tile Spawned
        if (aParams.delay) {
            const initYPos = this.y
            this.y = initYPos - this.height
            this.scene.tweens.add({
                targets: this,
                y: initYPos,
                ease: 'Power3',
                autoDestroy: true,
                duration: 200,
                delay: aParams.delay,
            })
        }
        this.scene.add.existing(this)

        // Tile Selected
        const basesShader2 = new Phaser.Display.BaseShader('BufferShader2', fragmentShader3)
        this.selectedShader = this.scene.add
            .shader(basesShader2, this.x - 5, this.y, this.width * 1.2, this.height * 1.2)
            .setDepth(-1)
            .setVisible(false)

        // Tile Border
        this.tileGraphics = this.scene.add.graphics().setDepth(-1).setVisible(true)
        const borderWidth = 2
        this.tileGraphics.lineStyle(borderWidth, 0xffffff, 1)
        this.tileGraphics.strokeRoundedRect(
            this.x - this.width / 2 - borderWidth / 2 + 4,
            this.y - this.height / 2 - borderWidth / 2 + 4,
            this.width + borderWidth - 8,
            this.height + borderWidth - 8,
            12
        )

        // Tile Glowed
        this.preFX?.setPadding(32)
        this.matchGlow4FX = this.preFX?.addGlow() as Phaser.FX.Glow
        this.matchGlow4FX.setActive(false)
        this.matchGlow5FX = this.preFX?.addGlow(0xffff00, 4, 0, false, 0.1, 32) as Phaser.FX.Glow
        this.matchGlow5FX.setActive(false)
    }

    public revealImageWithDelay(x: number, y: number, delay: number): void {
        this.scene.tweens.add({
            targets: this,
            x: x,
            y: y,
            alpha: 1,
            ease: 'Power3',
            autoDestroy: true,
            duration: 400,
            delay: delay,
        })
    }

    public getSelected(): void {
        this.selectedShader.setX(this.x - 5)
        this.selectedShader.setY(this.y)
        this.selectedShader.setVisible(true)
        this.tileGraphics.setVisible(true)
    }

    public getDeselected(): void {
        this.selectedShader.setVisible(false)
    }

    public getAttracted(): void {
        if (!this.suggestedTween) {
            this.suggestedTween = this.scene.tweens.add({
                targets: this,
                scale: 0.9,
                yoyo: true,
                ease: 'bounce.in',
                autoDestroy: true,
                repeat: 0,
                duration: 500,
                onComplete: () => {
                    this.suggestedTween?.stop()
                    this.suggestedTween = undefined
                    this.setAlpha(1)
                },
            })
        }
    }

    public enableGlow4(): void {
        this.isGlow4 = true
        this.matchGlow4FX.setActive(true)
        this.match4Tween = this.scene?.tweens.add({
            targets: this.matchGlow4FX,
            outerStrength: 15,
            yoyo: true,
            loop: -1,
            ease: 'sine.inout',
        })
    }

    public enableGlow5(): void {
        this.isGlow5 = true
        this.matchGlow5FX.setActive(true)
        this.match4Tween = this.scene?.tweens.add({
            targets: this.matchGlow5FX,
            outerStrength: 25,
            yoyo: true,
            loop: -1,
            ease: 'sine.inout',
        })
    }

    public disableGlow(): void {
        this.matchGlow4FX.setActive(false)
        this.matchGlow5FX.setActive(false)
        this.match4Tween?.destroy()
        this.match4Tween = undefined
        this.isGlow4 = false
        this.isGlow5 = false
    }

    public isGlowed4(): boolean {
        return this.isGlow4
    }

    public isGlowed5(): boolean {
        return this.isGlow5
    }

    public shake(): void {
        this.scene.tweens.add({
            targets: this,
            scale: 0,
            ease: 'bounce.inout',
            autoDestroy: true,
            duration: 50,
            onComplete: () => {
                this.destroy()
            },
        })
    }

    public wipe(direction: string, delay: number): void {
        if (direction == 'LEFT')
            this.scene.tweens.add({
                targets: this,
                progress: 1,
                x: this.x - 15,
                alpha: 0,
                duration: 100,
                easing: 'quint.out',
                delay: delay,
                onComplete: () => {
                    this.setActive(false)
                    this.setAlpha(0)
                },
            })
        else if (direction == 'RIGHT')
            this.scene.tweens.add({
                targets: this,
                progress: 1,
                x: this.x + 15,
                alpha: 0,
                duration: 100,
                easing: 'quint.out',
                delay: delay,
                onComplete: () => {
                    this.setActive(false)
                    this.setAlpha(0)
                },
            })
        else if (direction == 'UP')
            this.scene.tweens.add({
                targets: this,
                progress: 1,
                y: this.y - 15,
                alpha: 0,
                duration: 100,
                easing: 'quint.out',
                delay: delay,
                onComplete: () => {
                    this.setActive(false)
                    this.setAlpha(0)
                },
            })
        else if (direction == 'DOWN')
            this.scene.tweens.add({
                targets: this,
                progress: 1,
                y: this.y + 15,
                alpha: 0,
                duration: 100,
                easing: 'quint.out',
                delay: delay,
                onComplete: () => {
                    this.setActive(false)
                    this.setAlpha(0)
                },
            })
    }
}

const fragmentShader3 = `
precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

varying vec2 fragCoord;

void main (void)
{
    float intensity = 0.;

    for (float i = 0.; i < 54.; i++)
    {
        float angle = i/27. * 3.14159;
        vec2 xy = vec2(0.27 * cos(angle), 0.27 * sin(angle));
        xy += fragCoord.xy/resolution.y-0.5;
        intensity += pow(1000000., (0.77 - length(xy) * 1.9) * (1. + 0.275 * fract(-i / 27. - time))) / 80000.;
    }

    gl_FragColor = vec4(clamp(intensity * vec3(0.0927, 0.396, 0.17), vec3(0.), vec3(0.5)), 0.);
}
`
