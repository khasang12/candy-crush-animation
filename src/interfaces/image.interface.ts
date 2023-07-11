export interface IImageConstructor {
    scene: Phaser.Scene
    x: number
    y: number
    texture: string
    delay?: number
    frame?: string | number
}
