import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Sprite {
    private selectedShader: Phaser.GameObjects.Shader
    private tileGraphics: Phaser.GameObjects.Graphics

    constructor(aParams: IImageConstructor) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        // set image settings
        this.setOrigin(0.5, 0.5)
        this.setInteractive()

        this.scene.add.existing(this)

        // Tile Selected
        const basesShader2 = new Phaser.Display.BaseShader('BufferShader2', fragmentShader3)
        this.selectedShader = this.scene.add
            .shader(basesShader2, this.x - 5, this.y, this.width * 1.2, this.height * 1.2)
            .setVisible(false)

        // Tile Border
        this.tileGraphics = this.scene.add.graphics().setDepth(-1)
        const borderWidth = 2
        this.tileGraphics.lineStyle(borderWidth, 0xffffff, 1)
        this.tileGraphics.strokeRect(
            this.x - this.width / 2 - borderWidth / 2,
            this.y - this.height / 2 - borderWidth / 2,
            this.width + borderWidth - 1,
            this.height + borderWidth - 1
        )
    }

    public getSelected(): void {
        this.selectedShader.setVisible(true)
    }

    public getDeselected(): void {
        //this.selectedFX.setActive(false)
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
