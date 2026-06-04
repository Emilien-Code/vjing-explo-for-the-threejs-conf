import Experience from "../Experience"
import World from "../classes/World"
import LightStorm from "../components/LightStorm"
import LevitatingBody from "../components/LevitatingBody"
import GUI from "lil-gui"

export default class LightStormLevitatingScene extends World {

    private exp: Experience
    private lightStorm: LightStorm
    private levitatingBody: LevitatingBody
    private guiFolder!: GUI

    constructor(exp: Experience) {
        super()
        this.exp = exp
        this.lightStorm = new LightStorm(exp)
        this.levitatingBody = new LevitatingBody(exp)

        this.setupGUI()
        this.setVisible(false)
    }

    private setupGUI() {
        this.guiFolder = this.exp.helpers.GUI.addFolder('LightStormLevitating')
        this.guiFolder.hide()
    }

    setVisible(v: boolean) {
        this.lightStorm.setVisible(v)
        this.levitatingBody.setVisible(v)
    }

    showGUI(v: boolean) {
        v ? this.guiFolder.show() : this.guiFolder.hide()
        this.lightStorm.showGUI(v)
        this.levitatingBody.showGUI(v)
    }

    onBPMBeat() {
        this.lightStorm.onBPMBeat()
        this.levitatingBody.onBPMBeat()
    }

    update() {
        this.lightStorm.update()
        this.levitatingBody.update()
    }

    leave() {
        this.lightStorm.leave()
        this.levitatingBody.leave()
    }
}
