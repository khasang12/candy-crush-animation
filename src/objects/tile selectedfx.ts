import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Sprite {
    private selected: Phaser.FX.Glow
    private selectedAnim: Phaser.Tweens.Tween

    constructor(aParams: IImageConstructor) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        // set image settings
        this.setOrigin(0.5, 0.5)
        this.setInteractive()

        this.scene.add.existing(this)
        /* this.preFX?.setPadding(30)
        this.selectedFX = this.preFX?.addGlow().setActive(false) as Phaser.FX.Glow */
        const basesShader2 = new Phaser.Display.BaseShader('BufferShader2', fragmentShader3)
         const shader2 = this.scene.add.shader(basesShader2, 400, 300, 256, 256)
    }

    public getSelected(): void {
        //this.selectedFX.setActive(true)
        if (!this.selectedAnim) {
            this.selectedAnim = this.scene.tweens.add({
                /* targets: this.selectedFX,
                outerStrength: 10, */
                targets: this,
                scale: 0.9,
                yoyo: true,
                ease: 'sine.inout',
                repeat: -1,
            })
        } else this.selectedAnim.resume()
    }

    public getDeselected(): void {
        //this.selectedFX.setActive(false)
        if (this.selectedAnim) this.selectedAnim.pause()
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

    gl_FragColor = vec4(clamp(intensity * vec3(0.0777, 0.196, 0.27), vec3(0.), vec3(1.)), 0.);
}
`
