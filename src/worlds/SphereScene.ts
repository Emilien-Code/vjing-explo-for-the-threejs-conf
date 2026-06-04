import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui"
import World from "../classes/World"
import Water from "../components/Water"
import SquaresFallingScene from "../scenes/SquaresFallingScene"
import SphereLevitatingScene from "../scenes/SphereLevitatingScene"
import WaterDancingScene from "../scenes/WaterDancingScene"
import LightStormLevitatingScene from "../scenes/LightStormLevitatingScene"

type SceneName = 'squaresFalling' | 'sphereLevitating' | 'waterDancing' | 'lightStormLevitating'

const SCENE_NAMES: SceneName[] = [
    'squaresFalling',
    'sphereLevitating',
    'waterDancing',
    'lightStormLevitating',
]

export default class GlassScene extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    private water: Water

    private squaresFalling!: SquaresFallingScene
    private sphereLevitating!: SphereLevitatingScene
    private waterDancing!: WaterDancingScene
    private lightStormLevitating!: LightStormLevitatingScene

    private currentSceneIndex: number = -1
    private musicReactive: boolean = false

    private visibility: Record<SceneName, boolean> = {
        squaresFalling: false,
        sphereLevitating: false,
        waterDancing: false,
        lightStormLevitating: false,
    }

    constructor(exp: Experience) {
        super()
        this.exp = exp
            ; (window as any).exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI

        this.water = new Water(exp, {
            color: 0xffffff,
            speed: 0.0021,
            width: 1000,
            height: 1000,
        })
        this.water.water.rotation.x = -1.34159265358979
        this.water.water.position.y = 0
        this.scene.add(this.water.water)

        this.squaresFalling = new SquaresFallingScene(exp)
        this.sphereLevitating = new SphereLevitatingScene(exp)
        this.waterDancing = new WaterDancingScene(exp, this.water)
        this.lightStormLevitating = new LightStormLevitatingScene(exp, this.water)

        this.setupGUI()
    }

    private getScene(name: SceneName) {
        return {
            squaresFalling: this.squaresFalling,
            sphereLevitating: this.sphereLevitating,
            waterDancing: this.waterDancing,
            lightStormLevitating: this.lightStormLevitating,
        }[name]
    }

    private hideAll() {
        SCENE_NAMES.forEach(name => {
            this.getScene(name).setVisible(false)
            this.visibility[name] = false
        })
    }

    private switchScene(index: number) {
        this.hideAll()
        this.currentSceneIndex = index
        const name = SCENE_NAMES[index]
        this.getScene(name).setVisible(true)
        this.visibility[name] = true
        this.gui.controllersRecursive().forEach(c => c.updateDisplay())
    }

    private setupGUI() {
        this.gui.add(this, 'musicReactive').name('Music Reactive')

        const folder = this.gui.addFolder('Visibility')
        SCENE_NAMES.forEach(name => {
            folder.add(this.visibility, name).name(name).onChange((v: boolean) => {
                this.getScene(name).setVisible(v)
                this.getScene(name).showGUI(v)
            })
        })
    }

    onReady() {
        this.squaresFalling.onReady()
    }

    onBPMBeat() {
        if (!this.exp.audioManager || !this.exp.bpmManager) return

        SCENE_NAMES.forEach(name => {
            if (this.visibility[name]) this.getScene(name).onBPMBeat()
        })

        if (this.musicReactive && Math.random() < 1 / 3) {
            const candidates = SCENE_NAMES.map((_, i) => i).filter(i => i !== this.currentSceneIndex)
            const next = candidates[Math.floor(Math.random() * candidates.length)]
            this.switchScene(next)
        }
    }

    update() {
        this.water.update()
        this.squaresFalling.update()
        this.sphereLevitating.update()
        this.waterDancing.update()
        this.lightStormLevitating.update()
    }

    leave() { }
}
