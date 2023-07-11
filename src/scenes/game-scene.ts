import { CONST } from '../const/const'
import { Tile } from '../objects/tile'

export class GameScene extends Phaser.Scene {
    // Global Animation
    private idleTweens: Phaser.Tweens.Tween
    private matchParticle: Phaser.GameObjects.Particles.ParticleEmitter

    // Variables
    private canMove: boolean
    private inactivityTimer: NodeJS.Timeout
    private isSuggested: boolean
    private isRedisting: boolean

    // Grid with tiles
    private tileGrid: Array<Array<Tile | undefined>>
    private firstSelectedTile: Tile | undefined
    private secondSelectedTile: Tile | undefined

    constructor() {
        super({
            key: 'GameScene',
        })
    }

    init(): void {
        // Init variables
        this.canMove = true
        this.isSuggested = false
        this.isRedisting = false

        // set background color
        this.cameras.main.setBackgroundColor(0x78aade)

        // Init grid with tiles
        this.tileGrid = []
        for (let y = 0; y < CONST.gridHeight; y++) {
            this.tileGrid[y] = []
            for (let x = 0; x < CONST.gridWidth; x++) {
                this.tileGrid[y][x] = this.addTile(x, y).setAlpha(0)
            }
        }

        this.revealTiles()
        // Input
        this.input.on('gameobjectdown', this.tileDown, this)

        // reset the inactivity timer on user input
        this.input.on('pointermove', () => {
            clearTimeout(this.inactivityTimer)
            if (this.idleTweens) this.idleTweens.stop()

            this.inactivityTimer = setTimeout(() => this.getNextMove(), 2400)
            this.inactivityTimer = setTimeout(() => this.idle(), 5000)
        })

        this.input.on('pointerdown', () => {
            if (this.matchParticle) {
                this.matchParticle.stop()
                this.isSuggested = false
            }
        })

        // Check if matches on the start
        this.time.delayedCall(2000, () => {
            this.checkMatches()
        })
    }

    private revealTiles() {
        let i = 300
        for (let y = CONST.gridHeight - 1; y >= 0; y--) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                const initYPos = this.tileGrid[y][x]?.y
                this.tileGrid[y][x]?.setY(-200)
                if (initYPos) this.tileGrid[y][x]?.revealImageWithDelay(initYPos, i)
                i += 20
            }
        }
    }

    private revealTilesFromShape() {
        for (let y = CONST.gridHeight - 1; y >= 0; y--) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                const initYPos = this.tileGrid[y][x]?.y
                const initXPos = this.tileGrid[y][x]?.x
                this.tileGrid[y][x]?.setPosition(510 / 2, 575 / 2)
                if (initXPos && initYPos) this.tileGrid[y][x]?.revealImage(initXPos, initYPos)
            }
        }
    }

    /**
     * Add a new random tile at the specified position.
     * @param x
     * @param y
     */
    private addTile(x: number, y: number, delay?: number): Tile {
        // Get a random tile
        const randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        // Return the created tile
        return new Tile({
            scene: this,
            x: x * CONST.tileWidth + CONST.tileWidth / 2,
            y: y * CONST.tileHeight + CONST.tileHeight / 2,
            texture: randomTileType,
            delay: delay,
        })
    }

    /**
     * This function gets called, as soon as a tile has been pressed or clicked.
     * It will check, if a move can be done at first.
     * Then it will check if a tile was already selected before or not (if -> else)
     * @param pointer
     * @param gameobject
     * @param event
     */
    private tileDown(_pointer: Phaser.Input.Pointer, gameobject: Tile, event: any): void {
        if (this.canMove) {
            if (this.firstSelectedTile == undefined) {
                this.firstSelectedTile = gameobject
                this.firstSelectedTile.getSelected()
                console.log(this.firstSelectedTile)
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
                }
            }
        }
    }

    /**
     * This function will take care of the swapping of the two selected tiles.
     * It will only work, if two tiles have been selected.
     */
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
        if (matches.length > 0) {
            //Remove the tiles
            this.removeTileGroup(matches)
            // Move the tiles currently on the board into their new positions
            this.resetTile()
            this.fillTile()
            this.tileUp()
            this.checkMatches()
        } else {
            // No match so just swap the tiles back to their original position and reset
            this.swapTiles()
            this.tileUp()
            this.canMove = true
        }
        this.time.delayedCall(0, () => {
            if (this.matchParticle) {
                this.isSuggested = false
                this.matchParticle.stop()
            }
        })
    }

    private resetTile(): void {
        // Loop through each column starting from the left
        for (let y = this.tileGrid.length - 1; y > 0; y--) {
            // Loop through each tile in column from bottom to top
            for (let x = this.tileGrid[y].length - 1; x > 0; x--) {
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
                        duration: 500,
                        repeat: 0,
                        yoyo: false,
                        onComplete: () => {
                            x = this.tileGrid[y].length
                        },
                    })
                }
            }
        }
    }

    private fillTile(): void {
        //Check for blank spaces in the grid and add new tiles at that position
        for (let y = 0; y < this.tileGrid.length; y++) {
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                if (this.tileGrid[y][x] === undefined) {
                    //Found a blank spot so lets add animate a tile there
                    console.log('fill', y, x)
                    const tile = this.addTile(x, y, 50)
                    //And also update our "theoretical" grid
                    this.tileGrid[y][x] = tile
                }
            }
        }
    }

    private tileUp(): void {
        if (this.secondSelectedTile) {
            // Reset active tiles
            this.firstSelectedTile = undefined
            this.secondSelectedTile = undefined
        }
    }

    private removeTileGroup(matches: any): void {
        // Loop through all the matches and remove the associated tiles
        for (const element of matches) {
            const tempArr = element

            const emitter = this.add.particles(tempArr[0].x, tempArr[0].y, 'flares', {
                frame: { frames: ['red', 'green', 'blue'], cycle: true },
                blendMode: 'ADD',
                lifespan: 250,
                scale: { start: 0.5, end: 0.1 },
            })
            const shape3 = new Phaser.Geom.Rectangle(
                -tempArr[0].width / 2,
                -tempArr[0].height / 2,
                -tempArr[0].x + tempArr[2].x + tempArr[2].width,
                -tempArr[0].y + tempArr[2].y + tempArr[2].height
            )
            emitter.addEmitZone({ type: 'edge', source: shape3, quantity: 32, total: 1 })
            this.time.delayedCall(500, () => {
                emitter.stop()
            })

            for (const element of tempArr) {
                const tile = element
                //Find where this tile lives in the theoretical grid
                const tilePos = this.getTilePos(<Tile[][]>this.tileGrid, tile)

                // Remove the tile from the theoretical grid
                if (tilePos.x !== -1 && tilePos.y !== -1) {
                    tile.destroy()
                    this.tileGrid[tilePos.y][tilePos.x] = undefined
                }
            }
        }
    }

    private getTilePos(tileGrid: Tile[][], tile: Tile): any {
        const pos = { x: -1, y: -1 }

        //Find the position of a specific tile in the grid
        for (let y = 0; y < tileGrid.length; y++) {
            for (let x = 0; x < tileGrid[y].length; x++) {
                //There is a match at this position so return the grid coords
                if (tile === tileGrid[y][x]) {
                    pos.x = x
                    pos.y = y
                    break
                }
            }
        }

        return pos
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
                            if (groups.length > 0) {
                                if (groups.indexOf(tileGrid[i][j]) == -1) {
                                    matches.push(groups)
                                    groups = []
                                }
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
                this.idleTweens = this.tweens.add({
                    targets: this.tileGrid[i][j],
                    scale: 0.5,
                    ease: 'sine.inout',
                    duration: 300,
                    delay: i * 50,
                    repeat: 2,
                    yoyo: true,
                    onComplete: () => {
                        this.idleTweens.destroy()
                    },
                })

                time++

                if (time % 8 === 0) {
                    time = 0
                }
            }
        }
    }

    private getNextMove(): void {
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
                                if (!this.isSuggested) {
                                    this.emitSuggestion(matches[0])
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
                        }
                    }
                }
            }
        }
        this.emitRedistribution()
    }

    public emitSuggestion(tileGroup: Tile[]) {
        const [oriX, oriY] = [
            Math.min(tileGroup[0].x, tileGroup[1].x, tileGroup[2].x),
            Math.min(tileGroup[0].y, tileGroup[1].y, tileGroup[2].y),
        ]
        const [eastX, eastY] = [
            Math.max(tileGroup[0].x, tileGroup[1].x, tileGroup[2].x) + tileGroup[2].width,
            Math.max(tileGroup[0].y, tileGroup[1].y, tileGroup[2].y) + tileGroup[2].height,
        ]
        this.matchParticle = this.add.particles(oriX, oriY, 'flares', {
            frame: { frames: ['red', 'green', 'blue'], cycle: true },
            blendMode: 'ADD',
            lifespan: 250,
            scale: { start: 0.5, end: 0.1 },
        })
        const rect = new Phaser.Geom.Rectangle(
            -tileGroup[0].width / 2,
            -tileGroup[0].height / 2,
            -oriX + eastX,
            -oriY + eastY
        )
        this.matchParticle.addEmitZone({
            type: 'edge',
            source: rect,
            quantity: 32,
            total: 1,
        })
    }

    public emitRedistribution() {
        if (!this.isRedisting) {
            this.isRedisting = true
            const circle = new Phaser.Geom.Circle(300, 400, 200)
            const objects = <Phaser.GameObjects.Sprite[]>this.tileGrid.flat()
            const group = this.add.group(objects)
            Phaser.Actions.PlaceOnCircle(group.getChildren(), circle)

            this.tweens.add({
                targets: circle,
                radius: 200,
                ease: 'sine.inout',
                yoyo: true,
                duration: 500,
                onUpdate: function () {
                    Phaser.Actions.RotateAroundDistance(
                        objects,
                        { x: 510 / 2, y: 575 / 2 },
                        0.02,
                        circle.radius
                    )
                },
                onComplete: () => {
                    this.isRedisting = false
                    for (let y = 0; y < CONST.gridHeight; y++) {
                        for (let x = 0; x < CONST.gridWidth; x++) {
                            this.tileGrid[y][x]?.destroy()
                            this.tileGrid[y][x] = this.addTile(x, y).setAlpha(0)
                        }
                    }
                    this.revealTilesFromShape()
                    // Check if matches on the start
                    this.time.delayedCall(2000, () => {
                        this.checkMatches()
                    })
                },
            })
        }
    }
}
