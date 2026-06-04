import Experience from "../Experience"
import World from "../classes/World"
import Water from "../components/Water"
import DancingBody from "../components/DancingBody"
import GUI from "lil-gui"

export default class WaterDancingScene extends World {

    private exp: Experience
    private water: Water
    private dancingBody: DancingBody
    private guiFolder!: GUI

    constructor(exp: Experience, water: Water) {
        super()
        this.exp = exp
        this.water = water
        this.dancingBody = new DancingBody(exp)

        this.setupGUI()
        this.setVisible(false)
    }

    private setupGUI() {
        this.guiFolder = this.exp.helpers.GUI.addFolder('WaterDancing')
        this.guiFolder.hide()
    }

    setVisible(v: boolean) {
        this.water.water.visible = v
        this.dancingBody.setVisible(v)
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
    }

    leave() {
        this.dancingBody.leave()
    }
}
