import Experience from "../Experience"
import World from "../classes/World"
import Sphere from "../components/Sphere"
import LevitatingBody from "../components/LevitatingBody"
import GUI from "lil-gui"

export default class SphereLevitatingScene extends World {

    private exp: Experience
    private sphere: Sphere
    private levitatingBody: LevitatingBody
    private guiFolder!: GUI
    private params = { bodyX: 0, bodyY: 4, bodyZ: -14 }

    constructor(exp: Experience) {
        super()
        this.exp = exp
        this.sphere = new Sphere(exp)
        this.levitatingBody = new LevitatingBody(exp)

        this.setupGUI()
        this.setVisible(false)
    }

    private setupGUI() {
        this.guiFolder = this.exp.helpers.GUI.addFolder('SphereLevitating')
        const pos = this.guiFolder.addFolder('Body Position')
        pos.add(this.params, 'bodyX', -20, 20, 0.1).name('X')
            .onChange((v: number) => { this.levitatingBody.gltf.scene.position.x = v })
        pos.add(this.params, 'bodyY', -20, 20, 0.1).name('Y')
            .onChange((v: number) => { this.levitatingBody.gltf.scene.position.y = v })
        pos.add(this.params, 'bodyZ', -20, 20, 0.1).name('Z')
            .onChange((v: number) => { this.levitatingBody.gltf.scene.position.z = v })
        this.guiFolder.hide()
    }

    setVisible(v: boolean) {
        this.sphere.setVisible(v)
        this.levitatingBody.setVisible(v)
        this.showGUI(v)
        if (v) {

            this.exp.camera.instance.position.x = 0.01
            this.exp.camera.instance.position.y = 11
            this.exp.camera.instance.position.z = 10


            this.exp.camera.instance.rotation.x = -0.8537720095393398
            this.exp.camera.instance.rotation.y = 0.0019713426593535276
            this.exp.camera.instance.rotation.z = 0.0022611836216657466

            this.levitatingBody.gltf.scene.position.set(
                0, 4, 4.3
            )
            this.levitatingBody.gltf.scene.rotation.x = 0
            this.levitatingBody.gltf.scene.rotation.y = Math.PI/4
            this.levitatingBody.gltf.scene.rotation.z = 0

        }
    }

    showGUI(v: boolean) {
        v ? this.guiFolder.show() : this.guiFolder.hide()
        this.sphere.showGUI(v)
        this.levitatingBody.showGUI(v)
    }

    onBPMBeat() {
        this.sphere.onBPMBeat()
        this.levitatingBody.onBPMBeat()
    }

    update() {
        this.sphere.update()
        this.levitatingBody.update()
    }

    leave() {
        this.sphere.leave()
        this.levitatingBody.leave()
    }
}
