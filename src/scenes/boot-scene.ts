export class BootScene extends Phaser.Scene {
    private loadingBar: Phaser.GameObjects.Graphics
    private progressBar: Phaser.GameObjects.Graphics

    constructor() {
        super({
            key: 'BootScene',
        })
    }

    preload(): void {
        // set the background and create loading bar
        this.cameras.main.setBackgroundColor(0x98d687)
        this.createLoadingbar()

        // pass value to change the loading bar fill
        this.load.on(
            'progress',
            (value: number) => {
                this.progressBar.clear()
                this.progressBar.fillStyle(0xfff6d3, 1)
                this.progressBar.fillRect(
                    this.cameras.main.width / 4,
                    this.cameras.main.height / 2 - 16,
                    (this.cameras.main.width / 2) * value,
                    16
                )
            },
            this
        )

        // delete bar graphics, when loading complete
        this.load.on(
            'complete',
            () => {
                this.progressBar.destroy()
                this.loadingBar.destroy()
            },
            this
        )

        // load out package
        this.load.pack('preload', './assets/pack.json', 'preload')
        this.load.atlas('flares', 'assets/particles/flares.png', 'assets/particles/flares.json')
        this.load.atlas(
            'confetti',
            'assets/particles/confetti.png',
            'assets/particles/confetti.json'
        )
        this.load.atlas('ui', 'assets/ui/nine-slice.png', 'assets/ui/nine-slice.json')
        this.load.image('flare', 'assets/particles/white-flare.png')
        this.load.atlas('tiles', 'assets/images/tiles.png', 'assets/images/tiles.json')
    }

    init(): void {
        this.registry.set('level', 1)
        this.registry.set('score', 0)
    }

    update(): void {
        this.scene.start('HUDScene')
        this.scene.start('GameScene')
        this.scene.bringToTop('HUDScene')
    }

    private createLoadingbar(): void {
        this.loadingBar = this.add.graphics()
        this.loadingBar.fillStyle(0x5dae47, 1)
        this.loadingBar.fillRect(
            this.cameras.main.width / 4 - 2,
            this.cameras.main.height / 2 - 18,
            this.cameras.main.width / 2 + 4,
            20
        )
        this.progressBar = this.add.graphics()
    }
}
