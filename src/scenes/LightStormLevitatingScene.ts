import Experience from "../Experience"
import World from "../classes/World"
import LightStorm from "../components/LightStorm"
import LevitatingBody from "../components/LevitatingBody"
import Water from "../components/Water"
import GUI from "lil-gui"

export default class LightStormLevitatingScene extends World {

    private exp: Experience
    private lightStorm: LightStorm
    private levitatingBody: LevitatingBody
    private water: Water
    private guiFolder!: GUI

    constructor(exp: Experience, water: Water) {
        super()
        this.exp = exp
        this.water = water
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
        this.water.water.visible = v
        this.lightStorm.setVisible(v)
        this.levitatingBody.setVisible(v)


        if (Math.random() > 0.5) {
            this.levitatingBody.gltf.scene.position.x = 0
            this.levitatingBody.gltf.scene.position.y = 0
            this.levitatingBody.gltf.scene.position.z = 0

            this.levitatingBody.gltf.scene.rotation.y = Math.PI / 4
            this.levitatingBody.gltf.scene.rotation.x = Math.PI / 4
        } else {
            this.levitatingBody.gltf.scene.position.x = -0.6
            this.levitatingBody.gltf.scene.position.y = 0.4
            this.levitatingBody.gltf.scene.position.z = 0

            this.levitatingBody.gltf.scene.rotation.y = 0
            this.levitatingBody.gltf.scene.rotation.x = 0
        }

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
