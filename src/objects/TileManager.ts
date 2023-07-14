import { Tile } from './Tile'

export default class TileManager {
    private tilePool: Tile[]

    constructor() {
        this.tilePool = []
    }
    public returnItem(tile: Tile): void {
        this.tilePool.push(tile)
    }
    public allocItem(): Tile | undefined {
        if (this.tilePool.length > 0) return this.tilePool?.pop()
        else throw new Error('Pool is empty')
    }
}
