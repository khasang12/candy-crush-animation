import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Sprite {
    private selectedAnim: Phaser.Tweens.Tween

    constructor(aParams: IImageConstructor) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        // set image settings
        this.setOrigin(0, 0)
        this.setInteractive()

        this.scene.add.existing(this)
    }

    public getSelected(): void {
        if (!this.selectedAnim) {
            this.selectedAnim = this.scene.tweens.add({
                targets: this,
                scale: 0.96,
                duration: 500,
                yoyo: true,
                ease: 'sine.inout',
                repeat: -1,
            })
            console.log(123)
        } else this.selectedAnim.resume()
    }

    public getDeselected(): void {
        if (this.selectedAnim) this.selectedAnim.pause()
    }
}
