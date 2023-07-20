import { Tile } from '../Tile'
import ConfettiParticle from './ConfettiParticle'

export default class ParticleManager {
    private scene: Phaser.Scene
    public matchParticle: Phaser.GameObjects.Particles.ParticleEmitter
    public confettiParticle: Phaser.GameObjects.Particles.ParticleEmitter
    public explodeParticle: Phaser.GameObjects.Particles.ParticleEmitter
    public match3x3Particle: Phaser.GameObjects.Particles.ParticleEmitter

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.confettiParticle = scene.add.particles(0, 585, 'confetti', {
            frame: {
                frames: ['blue.png', 'green.png', 'red.png'],
                cycle: true,
            },
            lifespan: 5000,
            speed: { min: 650, max: 1200 },
            angle: { min: -60, max: -50 },
            scale: { start: 0.3, end: 0 },
            gravityY: 300,
            emitting: false,
            frequency: 60,
            quantity: 5,
            particleClass: ConfettiParticle,
            collideBottom: true,
        })

        this.matchParticle = scene.add.particles(0, 0, 'flares', {
            frame: { frames: ['red', 'green', 'blue'], cycle: true },
            lifespan: 500,
            emitting: false,
            scale: { start: 0.5, end: 0.1 },
            duration: 500,
        })

        this.explodeParticle = scene.add.particles(0, 0, 'flare', {
            speed: 24,
            lifespan: 1500,
            quantity: 10,
            scale: { start: 0.3, end: 0 },
            emitting: false,
            duration: 300,
        })

        this.match3x3Particle = scene.add.particles(0, 0, 'flares', {
            frame: { frames: ['red', 'green', 'blue'], cycle: true },
            lifespan: 250,
            emitting: false,
            scale: { start: 0.5, end: 0.1 },
            duration: 300,
        })
    }

    public emitGlow4(tempArr: Tile[]) {
        // Explode
        const peri = new Phaser.Geom.Rectangle(
            tempArr[1].x - (3 * tempArr[0].width) / 2,
            tempArr[1].y - (3 * tempArr[0].height) / 2,
            3 * tempArr[0].width,
            3 * tempArr[0].height
        )

        const zone = this.explodeParticle.addEmitZone({
            type: 'edge',
            source: peri,
            quantity: 22,
        })
        this.explodeParticle.start(0, 300)
        this.scene.time.delayedCall(300, () => {
            this.explodeParticle.removeEmitZone(zone[0])
        })
    }

    public emitLineToScoreboard(tempArr: Tile[]) {
        const line = new Phaser.Geom.Line(0, 0, -tempArr[0].x + 520, -tempArr[0].y + 100)
        this.match3x3Particle.setPosition(tempArr[0].x, tempArr[0].y)
        const zone = this.match3x3Particle.addEmitZone({
            type: 'edge',
            source: line,
            quantity: 32,
            total: 1,
        })
        this.match3x3Particle.start(300)
        this.scene.time.delayedCall(500, () => {
            this.match3x3Particle.removeEmitZone(zone[0])
        })
    }

    public stopMatchParticle(start: boolean) {
        this.matchParticle.stop(true)
        if (start) {
            this.matchParticle.setAlpha(0)
        } else {
            this.matchParticle.setAlpha(1)
        }
    }

    public emitConfetti(num: number) {
        this.confettiParticle.explode(num)
    }
}
