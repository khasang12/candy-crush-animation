import { CONST } from '../const/const'
import { Tile } from './Tile'

export default class TileManager {
    public tileGrid: Tile[][] | undefined[][]
    private tilePool: Tile[]
    private scene: Phaser.Scene

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.tilePool = []
        this.tileGrid = []
        for (let y = 0; y < CONST.gridHeight; y++) {
            this.tileGrid[y] = []
            for (let x = 0; x < CONST.gridWidth; x++) {
                this.tileGrid[y][x] = this.addTile(x, y).setAlpha(0)
            }
        }
    }
    public returnItem(tile: Tile | undefined): void {
        this.tilePool.push(tile as Tile)
    }
    public allocItem(): Tile | undefined {
        if (this.tilePool.length > 0) return this.tilePool?.pop()
        else throw new Error('Pool is empty')
    }

    private addTile(x: number, y: number, delay?: number): Tile {
        // Get a random tile
        const randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        // Return the created tile
        return new Tile({
            scene: this.scene,
            x: x * CONST.tileWidth + CONST.tileWidth / 2,
            y: y * CONST.tileHeight + CONST.tileHeight / 2,
            texture: randomTileType,
            delay: delay,
        })
    }

    public revealTiles() {
        let i = 300
        for (let y = CONST.gridHeight - 1; y >= 0; y--) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                const initYPos = this.tileGrid[y][x]?.y
                this.tileGrid[y][x]?.setY(-200)
                if (initYPos)
                    this.tileGrid[y][x]?.revealImageWithDelay(
                        this.tileGrid[y][x]?.x as number,
                        initYPos,
                        i
                    )
                i += 20
            }
        }
    }

    public reuseTile(tile: Tile, x: number, y: number, delay: number): Tile {
        // Get a random tile
        const randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        // Return the created tile
        tile.setTexture(randomTileType).setAlpha(0)
        tile.setPosition(x * CONST.tileWidth + CONST.tileWidth / 2, -100)
        tile.revealImageWithDelay(
            x * CONST.tileWidth + CONST.tileWidth / 2,
            y * CONST.tileHeight + CONST.tileHeight / 2,
            delay
        )

        return tile
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

    public emitGlow4(tempArr: Tile[]) {
        const isVert = tempArr[0].x == tempArr[1].x
        for (const element of tempArr) {
            const tile = element
            //Find where this tile lives in the theoretical grid
            const tilePos = this.getTilePos(<Tile[][]>this.tileGrid, tile)
            if (tilePos.x !== -1 && tilePos.y !== -1) {
                if (!isVert) {
                    if (tilePos.y > 0 && this.tileGrid[tilePos.y - 1][tilePos.x]) {
                        this.returnItem(this.tileGrid[tilePos.y - 1][tilePos.x] as Tile)
                        this.tileGrid[tilePos.y - 1][tilePos.x]?.setActive(false).setAlpha(0)
                        this.tileGrid[tilePos.y - 1][tilePos.x] = undefined
                    }
                    if (tilePos.y < 7 && this.tileGrid[tilePos.y + 1][tilePos.x]) {
                        this.returnItem(this.tileGrid[tilePos.y + 1][tilePos.x] as Tile)
                        this.tileGrid[tilePos.y + 1][tilePos.x]?.setActive(false).setAlpha(0)
                        this.tileGrid[tilePos.y + 1][tilePos.x] = undefined
                    }
                } else {
                    if (tilePos.x > 0 && this.tileGrid[tilePos.y][tilePos.x - 1]) {
                        this.returnItem(this.tileGrid[tilePos.y][tilePos.x - 1] as Tile)
                        this.tileGrid[tilePos.y][tilePos.x - 1]?.setActive(false).setAlpha(0)
                        this.tileGrid[tilePos.y][tilePos.x - 1] = undefined
                    }
                    if (tilePos.x < 7 && this.tileGrid[tilePos.y][tilePos.x + 1]) {
                        this.returnItem(this.tileGrid[tilePos.y][tilePos.x + 1] as Tile)
                        this.tileGrid[tilePos.y][tilePos.x + 1]?.setActive(false).setAlpha(0)
                        this.tileGrid[tilePos.y][tilePos.x + 1] = undefined
                    }
                }
            }
        }
        for (const ele of tempArr) ele.disableGlow()
    }

    public emitGlow5(glow5: Tile, tempArr: Tile[]) {
        const midTilePos = this.getTilePos(<Tile[][]>this.tileGrid, glow5)
        if (midTilePos.x !== -1 && midTilePos.y !== -1) {
            for (let l = midTilePos.y - 1; l >= 0; l--) {
                if (this.tileGrid[l][midTilePos.x]) {
                    this.tileGrid[l][midTilePos.x]?.wipe('UP', (midTilePos.y - 1 - l) * 5)
                    this.returnItem(this.tileGrid[l][midTilePos.x] as Tile)
                    this.tileGrid[l][midTilePos.x] = undefined
                }
            }
            for (let r = midTilePos.y + 1; r < 8; r++) {
                if (this.tileGrid[r][midTilePos.x]) {
                    this.tileGrid[r][midTilePos.x]?.wipe('DOWN', (r - midTilePos.y) * 5)
                    this.returnItem(this.tileGrid[r][midTilePos.x] as Tile)
                    this.tileGrid[r][midTilePos.x] = undefined
                }
            }
            for (let u = midTilePos.x - 1; u >= 0; u--) {
                if (this.tileGrid[midTilePos.y][u]) {
                    this.tileGrid[midTilePos.y][u]?.wipe('LEFT', (midTilePos.x - 1 - u) * 5)
                    this.returnItem(this.tileGrid[midTilePos.y][u] as Tile)
                    this.tileGrid[midTilePos.y][u] = undefined
                }
            }
            for (let d = midTilePos.x + 1; d < 8; d++) {
                if (this.tileGrid[midTilePos.y][d]) {
                    this.tileGrid[midTilePos.y][d]?.wipe('RIGHT', (d - midTilePos.x) * 5)
                    this.returnItem(this.tileGrid[midTilePos.y][d] as Tile)
                    this.tileGrid[midTilePos.y][d] = undefined
                }
            }
        }
        for (const ele of tempArr) ele.disableGlow()
    }

    public removeMatch3(tempArr: Tile[], callback: () => void) {
        for (const tile of tempArr) {
            const tilePos = this.getTilePos(<Tile[][]>this.tileGrid, tile)
            if (tilePos.x !== -1 && tilePos.y !== -1) {
                this.returnItem(tile as Tile)
                this.tileGrid[tilePos.y][tilePos.x] = undefined
            }
        }
        callback()
    }

    public removeMatch4(tempArr: Tile[], callback: () => void) {
        this.scene.add.tween({
            targets: [tempArr[0], tempArr[3], tempArr[1]],
            x: tempArr[2].x,
            y: tempArr[2].y,
            duration: 100,
            autoDestroy: true,
            ease: 'sine.in',
            onComplete: () => {
                for (let i = 0; i < 4; i++) {
                    const tile = tempArr[i]
                    // Find where this tile lives in the theoretical grid
                    const tilePos = this.getTilePos(<Tile[][]>this.tileGrid, tile)
                    if (i == 2) continue
                    // Combinative Effect
                    if (tilePos.x !== -1 && tilePos.y !== -1) {
                        this.returnItem(tile as Tile)
                        this.tileGrid[tilePos.y][tilePos.x] = undefined
                    }
                }
                tempArr[2].enableGlow4()
                callback()
            },
        })
    }

    public removeMatch5(tempArr: Tile[], callback: () => void) {
        this.scene.add.tween({
            targets: [tempArr[0], tempArr[1], tempArr[3], tempArr[4]],
            x: tempArr[2].x,
            y: tempArr[2].y,
            duration: 100,
            autoDestroy: true,
            ease: 'sine.in',
            onComplete: () => {
                for (let i = 0; i < 5; i++) {
                    const tile = tempArr[i]
                    // Find where this tile lives in the theoretical grid
                    const tilePos = this.getTilePos(<Tile[][]>this.tileGrid, tile)
                    if (i == 2) continue
                    // Combinative Effect
                    if (tilePos.x !== -1 && tilePos.y !== -1) {
                        this.returnItem(tile as Tile)
                        this.tileGrid[tilePos.y][tilePos.x] = undefined
                    }
                }
                tempArr[2].enableGlow5()
                callback()
            },
        })
    }
}
