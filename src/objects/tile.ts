import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Sprite {
    private isGlow4: boolean
    private isGlow5: boolean
    private matchExplode3: Phaser.GameObjects.Particles.ParticleEmitter
    private matchGlow4: Phaser.GameObjects.Particles.ParticleEmitter
    private matchGlow5: Phaser.GameObjects.Particles.ParticleEmitter
    private selectedShader: Phaser.GameObjects.Shader

    private suggestedTween: Phaser.Tweens.Tween | undefined
    private match4Tween: Phaser.Tweens.Tween | undefined
    private match5Tween: Phaser.Tweens.Tween | undefined

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
        // Tile Selected
        if (!this.selectedShader) {
            const basesShader2 = new Phaser.Display.BaseShader('BufferShader2', fragmentShader3)
            this.selectedShader = this.scene.add
                .shader(basesShader2, this.x - 5, this.y, this.width * 1.2, this.height * 1.2)
                .setDepth(-1)
                .setActive(false)
                .setVisible(false)
        }

        this.selectedShader.setX(this.x - 5)
        this.selectedShader.setY(this.y)
        this.selectedShader.setActive(true).setVisible(true)
    }

    public getDeselected(): void {
        this.selectedShader.setActive(false).setVisible(false)
    }

    public getAttracted(direction: string): void {
        let data
        if (direction == 'LEFT') data = { x: this.x - 10 }
        else if (direction == 'RIGHT') data = { x: this.x + 10 }
        else if (direction == 'UP') data = { y: this.y - 10 }
        else if (direction == 'DOWN') data = { y: this.y + 10 }

        if (!this.suggestedTween) {
            this.suggestedTween = this.scene.tweens.add({
                targets: this,
                yoyo: true,
                ease: 'sine.in',
                autoDestroy: true,
                repeat: 0,
                duration: 500,
                onComplete: () => {
                    this.suggestedTween?.stop()
                    this.suggestedTween = undefined
                    this.setAlpha(1)
                },
                scale: 0.9,
            })
        }
    }

    public enableExplode3(): void {
        if (!this.matchExplode3)
            this.matchExplode3 = this.scene.add
                .particles(this.x, this.y, 'flare', {
                    speed: 50,
                    advance: 20,
                    duration: 100,
                    lifespan: 250,
                    scale: 0.5,
                    emitting: false,
                    maxAliveParticles: 5,
                    delay: 20,
                })
                .setActive(false)
                .startFollow(this, -this.x, -this.y)
        this.matchExplode3.setActive(true)
        this.matchExplode3.start()
    }

    public enableGlow4(): void {
        if (!this.matchGlow4)
            this.matchGlow4 = this.scene.add
                .particles(this.x, this.y, 'flares', {
                    frame: 'white',
                    color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
                    colorEase: 'quad.out',
                    lifespan: 500,
                    angle: { min: -0, max: -360 },
                    scale: { start: 0.5, end: 0, ease: 'sine.out' },
                    speed: 100,
                    blendMode: 'ADD',
                    emitting: false,
                })
                .setActive(false)
                .setDepth(-1)
                .startFollow(this, -this.x, -this.y)
        this.isGlow4 = true
        this.matchGlow4.setActive(true)
        this.scene.time.delayedCall(300, () => this.matchGlow4.start())
    }

    public enableGlow5(): void {
        if (!this.matchGlow5)
            this.matchGlow5 = this.scene.add
                .particles(this.x, this.y, 'flares', {
                    frame: 'white',
                    color: [0x96e0da, 0x937ef3],
                    colorEase: 'quart.out',
                    lifespan: 500,
                    angle: [0 + 45, 90 + 45, 180 + 45, 270 + 45],
                    scale: { start: 0.5, end: 0, ease: 'sine.in' },
                    speed: 100,
                    blendMode: 'ADD',
                    emitting: false,
                })
                .setActive(false)
                .setDepth(-1)
                .startFollow(this, -this.x, -this.y)
        this.isGlow5 = true
        this.matchGlow5.setActive(true)
        this.scene.time.delayedCall(300, () => this.matchGlow5.start())
    }

    public disableGlow(): void {
        if (this.matchExplode3) this.matchExplode3.stop()
        if (this.matchGlow4) this.matchGlow4.stop()
        if (this.matchGlow5) this.matchGlow5.stop()
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
