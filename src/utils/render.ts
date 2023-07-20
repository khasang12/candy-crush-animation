export default class RenderUtils {
    public static addStats(scene: any) {
        scene.stats = document.createElement('span')
        scene.stats.style.position = 'fixed'
        scene.stats.style.left = '0'
        scene.stats.style.bottom = '0'
        scene.stats.style.backgroundColor = 'black'
        scene.stats.style.minWidth = '200px'
        scene.stats.style.padding = '15px'

        scene.stats.style.color = 'white'
        scene.stats.style.fontFamily = 'Courier New'
        scene.stats.style.textAlign = 'center'
        scene.stats.innerText = 'Draw calls: ?'

        document.body.append(scene.stats)
    }

    public static countDrawCalls(scene: any) {
        const renderer = scene.game.renderer
        if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
            let drawCalls = 0

            const pipelines = renderer.pipelines.pipelines.values()

            renderer.on(Phaser.Renderer.Events.PRE_RENDER, () => (drawCalls = 0))
            pipelines.forEach((p) =>
                p.on(Phaser.Renderer.WebGL.Pipelines.Events.AFTER_FLUSH, () => drawCalls++)
            )
            renderer.on(Phaser.Renderer.Events.POST_RENDER, () =>
                RenderUtils.redrawStats(scene, drawCalls)
            )
        } else {
            renderer.on(Phaser.Renderer.Events.POST_RENDER, () =>
                RenderUtils.redrawStats(scene, renderer.drawCount)
            )
        }
    }

    public static redrawStats(scene: any, drawCalls = 0) {
        scene.stats.innerText = `Draw calls: ${drawCalls}`
    }
}
