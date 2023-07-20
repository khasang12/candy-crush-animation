import { CONST } from '../const/const'
import { Tile } from '../objects/Tile'
import TileManager from '../objects/TileManager'
import ParticleManager from '../objects/particles/ParticleManager'
import ShinePipeline from '../pipeline/ShinePipeline'
import RenderUtils from '../utils/render'

export class GameScene extends Phaser.Scene {
    // Global Animation, Emitters
    private idleTweens: Phaser.Tweens.Tween
    private particleManager: ParticleManager

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

    constructor() {
        super({
            key: 'GameScene',
        })
    }

    public enablePipeline() {
        const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer
        const customPipeline = renderer.pipelines.add('Custom', new ShinePipeline(this.game))
        customPipeline.set2f(
            'uResolution',
            this.game.config.width as number,
            this.game.config.height as number
        )
    }

    init(): void {
        RenderUtils.addStats(this)
        RenderUtils.countDrawCalls(this)
        //console.log(this.children)
        //this.enablePipeline()

        // Variables
        this.tileManager = new TileManager(this)
        this.particleManager = new ParticleManager(this)

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
            if (this.particleManager.matchParticle) {
                this.particleManager.matchParticle.stop()
                this.isSuggested = false
            }
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
                    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                        this.canMove = false
                        this.swapTiles()
                    } else {
                        this.firstSelectedTile = undefined
                    }
                    // TESTING PURPOSE
                    /* this.canMove = false
                    this.swapTiles() */
                }
            }
        }
    }

    private swapTiles(): void {
        if (this.firstSelectedTile && this.secondSelectedTile) {
            this.canMove = false
            // Get the position of the two tiles
            const firstTilePosition = {
                x: this.firstSelectedTile.x - CONST.tileWidth / 2,
                y: this.firstSelectedTile.y - CONST.tileHeight / 2,
            }

            const secondTilePosition = {
                x: this.secondSelectedTile.x - CONST.tileWidth / 2,
                y: this.secondSelectedTile.y - CONST.tileHeight / 2,
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
        const matches = TileManager.getMatches(<Tile[][]>this.tileGrid)
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
            this.swapTiles()
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
            if (isFill) {
                this.particleManager.stopMatchParticle(true)
                this.isSuggested = false
            }
            this.canMove = true
        })
        callback()
    }

    private tileUp(callback: () => void): void {
        if (this.secondSelectedTile) {
            this.firstSelectedTile = undefined
            this.secondSelectedTile = undefined
        }
        callback()
    }

    // REMOVAL
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
                this.particleManager.emitGlow4(tempArr)
                this.tileManager.emitGlow4(tempArr)
            } else if (glow5) {
                this.tileManager.emitGlow5(glow5, tempArr)
            }
            this.particleManager.emitLineToScoreboard(tempArr)
            // Removal
            this.removeByMatch(tempArr)
        }
        callback()
    }
    private removeByMatch(tempArr: Tile[]) {
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

    // IDLE
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

    // SUGGESTION
    private getNextMove(callback: () => void): void {
        const [g, len] = [this.tileGrid, this.tileGrid.length]
        const moves = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ]
        if (!this.isSuggested && this.canMove) {
            let traversed = false
            this.resetTile(() => {
                for (let i = 0; i < len; i++) {
                    for (let j = 0; j < len; j++) {
                        if (g[i][j] !== undefined) {
                            for (const [dx, dy] of moves) {
                                const x2 = i + dx
                                const y2 = j + dy
                                if (
                                    x2 >= 0 &&
                                    x2 < len &&
                                    y2 >= 0 &&
                                    y2 < len &&
                                    g[x2][y2] !== undefined
                                ) {
                                    // Swap the candies
                                    // eslint-disable-next-line @typescript-eslint/no-extra-semi
                                    ;[g[i][j], g[x2][y2]] = [g[x2][y2], g[i][j]]
                                    // Calculate the score of the new g
                                    const matches = TileManager.getMatches(<Tile[][]>g)
                                    if (matches.length > 0) {
                                        // eslint-disable-next-line @typescript-eslint/no-extra-semi
                                        ;[g[i][j], g[x2][y2]] = [g[x2][y2], g[i][j]]
                                        if (!this.isSuggested && this.canMove) {
                                            this.canMove = false
                                            TileManager.emitSuggestion(
                                                g[i][j] as Tile,
                                                g[x2][y2] as Tile,
                                                () => (this.canMove = true)
                                            )
                                            this.isSuggested = true
                                        }
                                        return
                                    }
                                    // Swap the candies back to their original positions
                                    // eslint-disable-next-line @typescript-eslint/no-extra-semi
                                    ;[g[i][j], g[x2][y2]] = [g[x2][y2], g[i][j]]
                                    if (i == len - 1 && j == len - 1) traversed = true
                                }
                            }
                        }
                    }
                }
            })

            if (this.canMove && !this.isRedisting && traversed) {
                this.canMove = false
                this.tileUp(() => {
                    this.time.delayedCall(800, () => {
                        callback()
                    })
                })
            }
        }
    }

    // SCORE UPDATE
    private emitScoreText(tempArr: Tile[]) {
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
                    this.particleManager.stopMatchParticle(true)
                    this.isSuggested = true
                    this.particleManager.emitConfetti(128)
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

    // SHUFFLE
    public shuffle() {
        if (!this.isRedisting) {
            this.particleManager.stopMatchParticle(true)
            this.isRedisting = true
            this.canMove = false

            const objects = <Phaser.GameObjects.Sprite[]>(
                this.tileGrid.flat().filter((x) => x != undefined)
            )

            const RANDOM_SHAPE = CONST.shape[Phaser.Math.RND.between(0, CONST.shape.length - 1)]
            const shapeObj = this.createPattern(objects, RANDOM_SHAPE)

            this.add.tween({
                targets: shapeObj,
                radius: 200,
                ease: 'sine.inout',
                yoyo: true,
                duration: 1000,
                autoDestroy: true,
                onStart: () => {
                    this.particleManager.stopMatchParticle(true)
                },
                onUpdate: () => this.onUpdateShuffle(objects, RANDOM_SHAPE),
                onComplete: () => this.onCompleteShuffle(),
            })
        }
    }

    private createPattern(objects: Phaser.GameObjects.Sprite[], shape: string) {
        const group = this.add.group(objects)
        let shapeObj
        if (shape === 'circle') {
            shapeObj = new Phaser.Geom.Circle(...CONST.circle)
            Phaser.Actions.PlaceOnCircle(group.getChildren(), shapeObj)
        } else if (shape === 'triangle') {
            shapeObj = new Phaser.Geom.Triangle(...CONST.triangle)
            Phaser.Actions.PlaceOnTriangle(group.getChildren(), shapeObj)
        } else if (shape === 'rectangle') {
            shapeObj = new Phaser.Geom.Rectangle(...CONST.rectangle)
            Phaser.Actions.PlaceOnRectangle(group.getChildren(), shapeObj)
        }
        return shapeObj
    }

    private onUpdateShuffle(objects: Phaser.GameObjects.Sprite[], shape: string) {
        if (shape === 'circle')
            Phaser.Actions.RotateAroundDistance(objects, { x: 510 / 2, y: 575 / 2 }, 0.02, 200)
        else Phaser.Actions.RotateAround(objects, { x: 510 / 2, y: 575 / 2 }, 0.02)
    }

    private onCompleteShuffle() {
        this.isRedisting = false
        clearTimeout(this.inactivityTimer)
        let i = 200
        for (let y = 0; y < CONST.gridHeight; y++) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                const randomTileType: string =
                    CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]
                this.tileGrid[y][x]?.setTexture('tiles', randomTileType)
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
            this.particleManager.stopMatchParticle(false)
            this.isSuggested = false
        })
    }
}
