import Experience from "../Experience"
import World from "../classes/World"
import Water from "../components/Water"
import DancingBody from "../components/DancingBody"
import GUI from "lil-gui"
import * as THREE from "three"

export default class WaterDancingScene extends World {

    private exp: Experience
    private water: Water
    private dancingBody: DancingBody
    private guiFolder!: GUI
    private pathMesh!: THREE.Mesh
    private curve!: THREE.CatmullRomCurve3
    private pathSpeed = 0.03 // loops per second
    private visible = false

    constructor(exp: Experience, water: Water) {
        super()
        this.exp = exp
        this.water = water
        this.dancingBody = new DancingBody(exp)

        this.setupPath()
        this.setupGUI()
        this.setVisible(false)
    }

    private setupPath() {
        this.curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(3.76, 2.85, -0.63),
            new THREE.Vector3(5.08, 1.15, 13.9),
            new THREE.Vector3(-2.05, 4.68, 0.26),
            new THREE.Vector3(1.46, 3.45, -0.48),
        ], true)

        const geometry = new THREE.TubeGeometry(this.curve, 200, 0.02, 8, true)
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
        this.pathMesh = new THREE.Mesh(geometry, material)
        this.exp.scene.add(this.pathMesh)
    }

    private setupGUI() {
        this.guiFolder = this.exp.helpers.GUI.addFolder('WaterDancing')
        this.guiFolder.hide()
    }

    setVisible(v: boolean) {
        this.visible = v
        this.water.water.visible = false
        this.dancingBody.setVisible(v)
        this.pathMesh.visible = false
        this.showGUI(v)
    }

    showGUI(v: boolean) {
        v ? this.guiFolder.show() : this.guiFolder.hide()
        this.dancingBody.showGUI(v)
    }

    onBPMBeat() {
        this.dancingBody.onBPMBeat()
    }

    update() {
        this.dancingBody.update()
        if (!this.visible) return


        const t = ((this.exp.time.elapsedTime / 1000) * this.pathSpeed) % 1
        const camPos = this.curve.getPoint(t)
        this.exp.camera.instance.position.copy(camPos)
        this.exp.camera.instance.lookAt(this.dancingBody.modelPosition)
    }

    leave() {
        this.dancingBody.leave()
    }
}
