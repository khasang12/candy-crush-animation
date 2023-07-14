export default class ConfettiParticle extends Phaser.GameObjects.Particles.Particle {
    private windVelocity: number
    constructor(emitter: Phaser.GameObjects.Particles.ParticleEmitter) {
        super(emitter)
    }
    public update(
        delta: number,
        step: number,
        processors: Phaser.GameObjects.Particles.ParticleProcessor[]
    ) {
        const result = super.update(delta, step, processors)
        this.accelerationY = -this.velocityY
        return result
    }
}
