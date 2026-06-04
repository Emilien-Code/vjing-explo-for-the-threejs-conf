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
        this.guiFolder.hide()
    }

    setVisible(v: boolean) {
        this.sphere.setVisible(v)
        this.levitatingBody.setVisible(v)
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
