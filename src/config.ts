import { BootScene } from './scenes/boot-scene'
import { GameScene } from './scenes/game-scene'
import { HUDScene } from './scenes/hud-scene'

export const GameConfig: Phaser.Types.Core.GameConfig = {
    title: 'Candy crush',
    url: 'https://github.com/digitsensitive/phaser3-typescript',
    version: '2.0',
    width: 715,
    height: 575,
    type: Phaser.AUTO,
    parent: 'game',
    scene: [BootScene, GameScene, HUDScene],
    scale: {
        parent: 'phaser-game',
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    backgroundColor: '#ffd1dc',
    render: { pixelArt: false, antialias: true },
    fps: {
        target: 60,
        forceSetTimeOut: true,
    },
}
