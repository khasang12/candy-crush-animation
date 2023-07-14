import { CONST } from '../const/const'
import { Tile } from './Tile'

export default class TileManager {
    public tileGrid: Tile[][]
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
}
