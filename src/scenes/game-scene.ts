import { CONST } from '../const/const'
import { Tile } from '../objects/Tile'
import TileManager from '../objects/TileManager'
import ConfettiParticle from '../objects/particles/ConfettiParticle'

export class GameScene extends Phaser.Scene {
    // Global Animation
    private idleTweens: Phaser.Tweens.Tween
    private matchParticle: Phaser.GameObjects.Particles.ParticleEmitter
    private confettiParticle: Phaser.GameObjects.Particles.ParticleEmitter
    private explodeParticle: Phaser.GameObjects.Particles.ParticleEmitter
    private match3x3Particle: Phaser.GameObjects.Particles.ParticleEmitter

    // Variables
    private inactivityTimer: NodeJS.Timeout
    private canMove: boolean
    private isSuggested: boolean
    private isRedisting: boolean
    private isRemoving: boolean

    // Texts
    private scoreText: Phaser.GameObjects.Text

    // Grid with tiles
    private tileGrid: Array<Array<Tile | undefined>>
    private tileManager: TileManager
    private firstSelectedTile: Tile | undefined
    private secondSelectedTile: Tile | undefined

    private stats: HTMLSpanElement

    constructor() {
        super({
            key: 'GameScene',
        })
    }

    addStats() {
        this.stats = document.createElement('span')
        this.stats.style.position = 'fixed'
        this.stats.style.left = '0'
        this.stats.style.bottom = '0'
        this.stats.style.backgroundColor = 'black'
        this.stats.style.minWidth = '200px'
        this.stats.style.padding = '15px'

        this.stats.style.color = 'white'
        this.stats.style.fontFamily = 'Courier New'
        this.stats.style.textAlign = 'center'
        this.stats.innerText = 'Draw calls: ?'

        document.body.append(this.stats)
    }

    countDrawCalls() {
        const renderer = this.game.renderer
        if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
            let drawCalls = 0

            const pipelines = renderer.pipelines.pipelines.values()

            renderer.on(Phaser.Renderer.Events.PRE_RENDER, () => (drawCalls = 0))
            pipelines.forEach((p) =>
                p.on(Phaser.Renderer.WebGL.Pipelines.Events.AFTER_FLUSH, () => drawCalls++)
            )
            renderer.on(Phaser.Renderer.Events.POST_RENDER, () => this.redrawStats(drawCalls))
        } else {
            renderer.on(Phaser.Renderer.Events.POST_RENDER, () =>
                this.redrawStats(renderer.drawCount)
            )
        }
    }

    redrawStats(drawCalls = 0) {
        this.stats.innerText = `Draw calls: ${drawCalls}`
    }

    init(): void {
        /* this.addStats()
        this.countDrawCalls() */
        console.log(this.children);

        // Variables
        this.tileManager = new TileManager(this)

        this.canMove = true
        this.isSuggested = false
        this.isRedisting = false
        this.isRemoving = false

        // Background
        this.cameras.main.setBackgroundColor(0x00264d)

        // Text
        this.scoreText = this.add
            .text(-100, -100, '100', {
                fontSize: '24px',
                color: '#fff',
                fontStyle: 'bold',
            })
            .setDepth(2)

        // Init grid with tiles
        this.tileGrid = this.tileManager.tileGrid
        this.tileManager.revealTiles()
        this.time.delayedCall(2000, () => {
            this.checkMatches()
        })

        // Input
        this.input.on('gameobjectdown', this.tileDown, this)

        this.input.on('pointermove', () => {
            clearTimeout(this.inactivityTimer)
            if (this.idleTweens) this.idleTweens.stop()

            this.inactivityTimer = setTimeout(() => this.getNextMove(() => this.shuffle()), 1000)
            this.inactivityTimer = setTimeout(() => this.idle(), 5000)
        })

        this.input.on('pointerdown', () => {
            if (this.matchParticle) {
                this.matchParticle.stop()
                this.isSuggested = false
            }
        })

        // emitters
        this.confettiParticle = this.add.particles(0, 585, 'confetti', {
            frame: {
                frames: ['blue.png', 'green.png', 'red.png'],
                cycle: true,
            },
            lifespan: 5000,
            speed: { min: 650, max: 1200 },
            angle: { min: -60, max: -50 },
            scale: { start: 0.3, end: 0 },
            gravityY: 300,
            blendMode: 'ADD',
            emitting: false,
            frequency: 60,
            quantity: 5,
            particleClass: ConfettiParticle,
        })

        this.matchParticle = this.add.particles(0, 0, 'flares', {
            frame: { frames: ['red', 'green', 'blue'], cycle: true },
            blendMode: 'ADD',
            lifespan: 500,
            emitting: false,
            scale: { start: 0.5, end: 0.1 },
            duration: 500,
        })

        this.explodeParticle = this.add.particles(0, 0, 'flare', {
            speed: 24,
            lifespan: 1500,
            quantity: 10,
            scale: { start: 0.3, end: 0 },
            emitting: false,
            duration: 300,
        })

        this.match3x3Particle = this.add.particles(0, 0, 'flares', {
            frame: { frames: ['red', 'green', 'blue'], cycle: true },
            blendMode: 'ADD',
            lifespan: 250,
            emitting: false,
            scale: { start: 0.5, end: 0.1 },
            duration: 300,
        })
    }

    private tileDown(_pointer: Phaser.Input.Pointer, gameobject: Tile, _event: any): void {
        if (this.canMove) {
            if (this.firstSelectedTile == undefined) {
                this.firstSelectedTile = gameobject
                this.firstSelectedTile.getSelected()
            } else {
                // So if we are here, we must have selected a second tile
                this.firstSelectedTile.getDeselected()
                // check if click the same tile
                if (this.firstSelectedTile == gameobject) {
                    this.firstSelectedTile = undefined
                    return
                }

                this.secondSelectedTile = gameobject

                if (this.secondSelectedTile) {
                    const dx =
                        Math.abs(this.firstSelectedTile.x - this.secondSelectedTile.x) /
                        CONST.tileWidth
                    const dy =
                        Math.abs(this.firstSelectedTile.y - this.secondSelectedTile.y) /
                        CONST.tileHeight

                    // Check if the selected tiles are both in range to make a move
                    /* if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                        this.canMove = false
                        this.swapTiles()
                    } else {
                        this.firstSelectedTile = undefined
                    } */
                    this.canMove = false
                    this.swapTiles()
                }
            }
        }
    }

    private swapTiles(): void {
        if (this.firstSelectedTile && this.secondSelectedTile) {
            this.canMove = false
            // Get the position of the two tiles
            const firstTilePosition = {
                x: this.firstSelectedTile.x - this.firstSelectedTile.width / 2,
                y: this.firstSelectedTile.y - this.firstSelectedTile.height / 2,
            }

            const secondTilePosition = {
                x: this.secondSelectedTile.x - this.firstSelectedTile.width / 2,
                y: this.secondSelectedTile.y - this.firstSelectedTile.height / 2,
            }

            // Swap them in our grid with the tiles
            this.tileGrid[Math.floor(firstTilePosition.y / CONST.tileHeight)][
                firstTilePosition.x / CONST.tileWidth
            ] = this.secondSelectedTile
            this.tileGrid[Math.floor(secondTilePosition.y / CONST.tileHeight)][
                secondTilePosition.x / CONST.tileWidth
            ] = this.firstSelectedTile

            // Move them on the screen with tweens
            this.add.tween({
                targets: this.firstSelectedTile,
                x: this.secondSelectedTile.x,
                y: this.secondSelectedTile.y,
                ease: 'cubic.inout',
                duration: 600,
                repeat: 0,
                yoyo: false,
                autoDestroy: true,
            })

            this.add.tween({
                targets: this.secondSelectedTile,
                x: this.firstSelectedTile.x,
                y: this.firstSelectedTile.y,
                ease: 'cubic.inout',
                duration: 600,
                repeat: 0,
                yoyo: false,
                onComplete: () => {
                    this.checkMatches()
                    this.canMove = true
                },
                autoDestroy: true,
            })

            this.firstSelectedTile =
                this.tileGrid[Math.floor(firstTilePosition.y / CONST.tileHeight)][
                    firstTilePosition.x / CONST.tileWidth
                ]
            this.secondSelectedTile =
                this.tileGrid[Math.floor(secondTilePosition.y / CONST.tileHeight)][
                    secondTilePosition.x / CONST.tileWidth
                ]
        }
    }

    private checkMatches(): void {
        //Call the getMatches function to check for spots where there is
        //a run of three or more tiles in a row
        const matches = this.getMatches(<Tile[][]>this.tileGrid)
        //If there are matches, remove them
        if (matches.length > 0 && !this.isRemoving) {
            this.removeTileGroup(matches, () =>
                this.time.delayedCall(300, () => {
                    this.resetTile(() => {
                        this.fillTile(() =>
                            this.time.delayedCall(300, () => {
                                this.tileUp(() => {
                                    this.checkMatches()
                                })
                            })
                        )
                    })
                })
            )
        } else {
            // No match so just swap the tiles back to their original position and reset
            //this.swapTiles()
            this.tileUp(() => {
                this.canMove = true
            })
        }
    }

    private resetTile(callback: () => void): void {
        // Loop through each column starting from the left
        for (let x = 0; x < this.tileGrid.length; x++) {
            // Loop through each tile in column from bottom to top
            for (let y = this.tileGrid[x].length - 1; y > 0; y--) {
                // If this space is blank, but the one above it is not, move the one above down
                if (this.tileGrid[y][x] === undefined && this.tileGrid[y - 1][x] !== undefined) {
                    // Move the tile above down one
                    const tempTile = this.tileGrid[y - 1][x]
                    this.tileGrid[y][x] = tempTile
                    this.tileGrid[y - 1][x] = undefined

                    this.add.tween({
                        targets: tempTile,
                        y: CONST.tileHeight * y + CONST.tileHeight / 2,
                        ease: 'sine.inout',
                        duration: 100,
                        repeat: 0,
                        yoyo: false,
                        autoDestroy: true,
                    })
                    x = -1
                    break
                }
            }
        }
        callback()
    }

    private fillTile(callback: () => void): void {
        //Check for blank spaces in the grid and add new tiles at that position
        let isFill = false
        this.canMove = false
        for (let y = 0; y < this.tileGrid.length; y++) {
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                if (this.tileGrid[y][x] === undefined) {
                    //Found a blank spot so lets add animate a tile there
                    const reTile = this.tileManager.allocItem()
                    if (reTile) {
                        const tile = this.tileManager.reuseTile(reTile as Tile, x, y, 100)
                        //And also update our "theoretical" grid
                        this.tileGrid[y][x] = tile
                        isFill = true
                    }
                }
            }
        }
        this.canMove = true
        this.time.delayedCall(1000, () => {
            if (this.matchParticle && isFill) {
                this.matchParticle.stop()
                this.isSuggested = false
            }
            this.canMove = true
        })
        callback()
    }

    private tileUp(callback: () => void): void {
        if (this.secondSelectedTile) {
            // Reset active tiles
            this.firstSelectedTile = undefined
            this.secondSelectedTile = undefined
        }
        callback()
    }

    private removeTileGroup(matches: any, callback: () => void): void {
        // Loop through all the matches and remove the associated tiles
        this.isRemoving = true
        for (const tempArr of matches) {
            // Score
            this.emitScoreText(tempArr)

            // Emitter
            let [glow4, glow5] = [undefined, undefined]
            for (const ele of tempArr) if (ele.isGlowed5()) glow5 = ele
            if (!glow5) for (const ele of tempArr) if (ele.isGlowed4()) glow4 = ele

            if (glow4) {
                this.emitGlow4(tempArr)
            } else if (glow5) {
                this.emitGlow5(glow5, tempArr)
            }
            this.emitLineToScoreboard(tempArr)

            // Removal
            switch (tempArr.length) {
                case 3:
                    this.tileManager.removeMatch3(tempArr, () => {
                        this.isRemoving = false
                    })
                    break
                case 4:
                    this.tileManager.removeMatch4(tempArr, () => {
                        this.isRemoving = false
                    })
                    break
                case 5:
                    this.tileManager.removeMatch5(tempArr, () => {
                        this.isRemoving = false
                    })
                    break
            }
        }
        callback()
    }

    private getMatches(tileGrid: Tile[][]): Tile[][] {
        const matches: Tile[][] = []
        let groups: Tile[] = []

        // Check for horizontal matches
        for (const element of tileGrid) {
            const tempArray = element
            groups = []
            for (let x = 0; x < tempArray.length; x++) {
                if (x < tempArray.length - 2) {
                    if (element[x] && element[x + 1] && element[x + 2]) {
                        if (
                            element[x].texture.key === element[x + 1].texture.key &&
                            element[x + 1].texture.key === element[x + 2].texture.key
                        ) {
                            if (groups.length > 0) {
                                if (groups.indexOf(element[x]) == -1) {
                                    matches.push(groups)
                                    groups = []
                                }
                            }

                            if (groups.indexOf(element[x]) == -1) {
                                groups.push(element[x])
                            }

                            if (groups.indexOf(element[x + 1]) == -1) {
                                groups.push(element[x + 1])
                            }

                            if (groups.indexOf(element[x + 2]) == -1) {
                                groups.push(element[x + 2])
                            }
                        }
                    }
                }
            }

            if (groups.length > 0) {
                matches.push(groups)
            }
        }

        //Check for vertical matches
        for (let j = 0; j < tileGrid.length; j++) {
            const tempArr = tileGrid[j]
            groups = []
            for (let i = 0; i < tempArr.length; i++) {
                if (i < tempArr.length - 2)
                    if (tileGrid[i][j] && tileGrid[i + 1][j] && tileGrid[i + 2][j]) {
                        if (
                            tileGrid[i][j].texture.key === tileGrid[i + 1][j].texture.key &&
                            tileGrid[i + 1][j].texture.key === tileGrid[i + 2][j].texture.key
                        ) {
                            if (groups.length > 0 && groups.indexOf(tileGrid[i][j]) == -1) {
                                matches.push(groups)
                                groups = []
                            }

                            if (groups.indexOf(tileGrid[i][j]) == -1) {
                                groups.push(tileGrid[i][j])
                            }
                            if (groups.indexOf(tileGrid[i + 1][j]) == -1) {
                                groups.push(tileGrid[i + 1][j])
                            }
                            if (groups.indexOf(tileGrid[i + 2][j]) == -1) {
                                groups.push(tileGrid[i + 2][j])
                            }
                        }
                    }
            }
            if (groups.length > 0) matches.push(groups)
        }
        return matches
    }

    public idle() {
        let time = 0
        for (let j = 0; j < this.tileGrid.length; j++) {
            for (let i = 0; i < this.tileGrid.length; i++) {
                if (this.tileGrid[i][j] == undefined) continue
                this.idleTweens = this.add.tween({
                    targets: this.tileGrid[i][j],
                    scale: 0.5,
                    ease: 'sine.inout',
                    duration: 300,
                    autoDestroy: true,
                    delay: i * 50,
                    repeat: 2,
                    yoyo: true,
                })
                time++
                if (time % 8 === 0) {
                    time = 0
                }
            }
        }
    }

    private getNextMove(callback: () => void): void {
        if (!this.isSuggested && this.canMove) {
            let traversed = false
            this.resetTile(() => {
                for (let i = 0; i < this.tileGrid.length; i++) {
                    for (let j = 0; j < this.tileGrid.length; j++) {
                        if (this.tileGrid[i][j] !== undefined) {
                            for (const [dx, dy] of [
                                [1, 0],
                                [-1, 0],
                                [0, 1],
                                [0, -1],
                            ]) {
                                const x2 = i + dx
                                const y2 = j + dy
                                if (
                                    x2 >= 0 &&
                                    x2 < this.tileGrid.length &&
                                    y2 >= 0 &&
                                    y2 < this.tileGrid.length &&
                                    this.tileGrid[x2][y2] !== undefined
                                ) {
                                    // Swap the candies
                                    // eslint-disable-next-line @typescript-eslint/no-extra-semi
                                    ;[this.tileGrid[i][j], this.tileGrid[x2][y2]] = [
                                        this.tileGrid[x2][y2],
                                        this.tileGrid[i][j],
                                    ]
                                    // Calculate the score of the new this.tileGrid
                                    const matches = this.getMatches(<Tile[][]>this.tileGrid)
                                    if (matches.length > 0) {
                                        // eslint-disable-next-line @typescript-eslint/no-extra-semi
                                        ;[this.tileGrid[i][j], this.tileGrid[x2][y2]] = [
                                            this.tileGrid[x2][y2],
                                            this.tileGrid[i][j],
                                        ]
                                        if (!this.isSuggested && this.canMove) {
                                            this.emitSuggestion(
                                                matches[0],
                                                this.tileGrid[i][j] as Tile,
                                                this.tileGrid[x2][y2] as Tile,
                                                () => (this.canMove = true)
                                            )
                                            this.isSuggested = true
                                        }
                                        return
                                    }
                                    // Swap the candies back to their original positions
                                    // eslint-disable-next-line @typescript-eslint/no-extra-semi
                                    ;[this.tileGrid[i][j], this.tileGrid[x2][y2]] = [
                                        this.tileGrid[x2][y2],
                                        this.tileGrid[i][j],
                                    ]
                                    if (
                                        i == this.tileGrid.length - 1 &&
                                        j == this.tileGrid.length - 1
                                    )
                                        traversed = true
                                }
                            }
                        }
                    }
                }
            })

            if (this.canMove && !this.isRedisting && traversed) {
                this.canMove = false
                this.tileUp(() => {
                    this.time.delayedCall(500, () => {
                        callback()
                    })
                })
            }
        }
    }

    public emitSuggestion(tileGroup: Tile[], tile1: Tile, tile2: Tile, callback: () => void) {
        this.canMove = false
        if (tile1.y == tile2.y) {
            tile1.getAttracted('RIGHT')
            tile2.getAttracted('LEFT')
        } else {
            tile1.getAttracted('DOWN')
            tile2.getAttracted('UP')
        }
        callback()

        /* 
        const [oriX, oriY] = [
            tileGroup.reduce((min, tile) => {
                return Math.min(tile.x, min)
            }, Number.MAX_SAFE_INTEGER),
            tileGroup.reduce((min, tile) => {
                return Math.min(tile.y, min)
            }, Number.MAX_SAFE_INTEGER),
        ]
        const [eastX, eastY] = [
            tileGroup.reduce((max, tile) => {
                return Math.max(tile.x, max)
            }, Number.MIN_SAFE_INTEGER) + tileGroup[0].width,
            tileGroup.reduce((max, tile) => {
                return Math.max(tile.y, max)
            }, Number.MIN_SAFE_INTEGER) + tileGroup[0].width,
        ]
        const rect = new Phaser.Geom.Rectangle(
            -tileGroup[0].width / 2,
            -tileGroup[0].height / 2,
            -oriX + eastX,
            -oriY + eastY
        )
        const zone = this.matchParticle.setPosition(oriX, oriY).addEmitZone({
            type: 'edge',
            source: rect,
            quantity: 32,
            total: 1,
        })
        this.matchParticle.start(1500)
        this.time.delayedCall(1500, () => {
            this.matchParticle.removeEmitZone(zone[0])
        }) */
    }

    private emitScoreText(tempArr: Tile[]) {
        console.log('score')
        this.scoreText.setPosition(tempArr[1].x - 20, tempArr[1].y - 5)
        const length = tempArr.length
        this.scoreText.setText(CONST.matchScore[length])
        this.scoreText.setAlpha(1)
        this.add.tween({
            targets: this,
            alpha: 0,
            duration: 500,
            ease: 'sine.inout',
            autoDestroy: true,
            onStart: () => {
                this.canMove = false
            },
            onComplete: () => {
                this.registry.values.score += parseInt(CONST.matchScore[length])
                this.scoreText.setAlpha(0)
                this.events.emit('scoreChanged')
                if (
                    (this.registry.values.score % CONST.milestone == 0 &&
                        this.registry.values.score > 0) ||
                    this.registry.get('score') > this.registry.get('level') * CONST.milestone
                ) {
                    if (this.matchParticle) this.matchParticle.stop(true)
                    this.isSuggested = true
                    this.confettiParticle.explode(128)
                    this.tileUp(() => {
                        this.time.delayedCall(1200, () => {
                            if (this.canMove && !this.isRedisting) this.shuffle()
                        })
                    })
                    this.canMove = true
                }
            },
        })
    }

    private emitGlow4(tempArr: Tile[]) {
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
        this.time.delayedCall(300, () => {
            this.explodeParticle.removeEmitZone(zone[0])
        })

        this.tileManager.emitGlow4(tempArr)
    }

    private emitGlow5(glow5: Tile, tempArr: Tile[]) {
        this.tileManager.emitGlow5(glow5, tempArr)
    }

    private emitLineToScoreboard(tempArr: Tile[]) {
        const line = new Phaser.Geom.Line(0, 0, -tempArr[0].x + 520, -tempArr[0].y + 100)
        this.match3x3Particle.setPosition(tempArr[0].x, tempArr[0].y)
        const zone = this.match3x3Particle.addEmitZone({
            type: 'edge',
            source: line,
            quantity: 32,
            total: 1,
        })
        this.match3x3Particle.start(300)
        this.time.delayedCall(500, () => {
            this.match3x3Particle.removeEmitZone(zone[0])
        })
    }

    public shuffle() {
        if (!this.isRedisting) {
            console.log('shuffle')
            if (this.matchParticle) this.matchParticle.stop()
            this.isRedisting = true
            this.canMove = false

            const objects = <Phaser.GameObjects.Sprite[]>(
                this.tileGrid.flat().filter((x) => x != undefined)
            )

            for (const obj of objects) obj.setPosition(510 / 2, 575 / 2)

            const group = this.add.group(objects)
            const RANDOM_SHAPE = CONST.shape[Phaser.Math.RND.between(0, CONST.shape.length - 1)]

            let shapeObj
            if (RANDOM_SHAPE === 'circle') {
                shapeObj = new Phaser.Geom.Circle(...CONST.circle)
                Phaser.Actions.PlaceOnCircle(group.getChildren(), shapeObj)
            } else if (RANDOM_SHAPE === 'triangle') {
                shapeObj = new Phaser.Geom.Triangle(...CONST.triangle)
                Phaser.Actions.PlaceOnTriangle(group.getChildren(), shapeObj)
            } else if (RANDOM_SHAPE === 'rectangle') {
                shapeObj = new Phaser.Geom.Rectangle(...CONST.rectangle)
                Phaser.Actions.PlaceOnRectangle(group.getChildren(), shapeObj)
            }
            this.add.tween({
                targets: shapeObj,
                radius: 200,
                ease: 'sine.inout',
                yoyo: true,
                duration: 1000,
                autoDestroy: true,
                onStart: () => {
                    if (this.matchParticle) {
                        this.matchParticle.stop(true)
                        this.matchParticle.setAlpha(0)
                    }
                },
                onUpdate: function () {
                    if (RANDOM_SHAPE === 'circle')
                        Phaser.Actions.RotateAroundDistance(
                            objects,
                            { x: 510 / 2, y: 575 / 2 },
                            0.02,
                            200
                        )
                    else Phaser.Actions.RotateAround(objects, { x: 510 / 2, y: 575 / 2 }, 0.02)
                },
                onComplete: () => {
                    this.isRedisting = false
                    clearTimeout(this.inactivityTimer)
                    let i = 200
                    for (let y = 0; y < CONST.gridHeight; y++) {
                        for (let x = 0; x < CONST.gridWidth; x++) {
                            const randomTileType: string =
                                CONST.candyTypes[
                                    Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)
                                ]
                            this.tileGrid[y][x]?.setTexture(randomTileType)
                            this.tileGrid[y][x]?.revealImageWithDelay(
                                x * CONST.tileWidth + CONST.tileWidth / 2,
                                y * CONST.tileHeight + CONST.tileHeight / 2,
                                i
                            )
                            i += 10
                        }
                    }
                    this.isSuggested = true
                    this.canMove = true
                    this.time.delayedCall(2000, () => {
                        this.checkMatches()
                        if (this.matchParticle) {
                            this.matchParticle.stop()
                            this.matchParticle.setAlpha(1)
                            this.isSuggested = false
                        }
                    })
                },
            })
        }
    }
}
