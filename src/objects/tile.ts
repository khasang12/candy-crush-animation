import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Sprite {
    private selectedShader: Phaser.GameObjects.Shader
    private tileGraphics: Phaser.GameObjects.Graphics

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
                duration: 300,
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
    }

    public revealImage(initYPos: number, delay: number): void {
        this.scene.tweens.add({
            targets: this,
            y: initYPos,
            alpha: 1,
            ease: 'Power3',
            duration: 800,
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
