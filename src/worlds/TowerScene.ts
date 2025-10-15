import * as THREE from "three"
import GUI from "lil-gui";

import Experience from "../Experience"
import World from "../classes/World";
import Tower from "../components/Tower"
import Medusa from "../components/Medusa";

const colors = {
    grey: "",
    gold: ""
}
export default class TwoerScene extends World {

    private exp: Experience;
    private scene: THREE.Scene
    private towers: Tower
    private alight: THREE.AmbientLight
    private light: THREE.DirectionalLight
    private light2: THREE.DirectionalLight
    private gui: GUI
    private medusa: Medusa
    private tweakParams = {
        fogDistance: 1024,
    }
    private medusaParams = {
        noiseFactor: 0.1,
        amountOfMedusa: 5,

    }

    constructor(exp: Experience) {
        super();
        this.exp = exp;
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI
        this.alight = new THREE.AmbientLight()

        this.light = new THREE.DirectionalLight(0xffe6cc, 1)
        this.light.castShadow = true
        this.light.position.x = 100
        this.light.position.y = 100
        this.light.position.z = 100
        this.scene.add(this.alight)

        this.light2 = new THREE.DirectionalLight(0xffe6cc, 1)
        this.light2.castShadow = true
        this.light2.position.x = -100
        this.light2.position.y = 100
        this.light2.position.z = -100
        this.scene.add(this.alight)
        this.scene.add(this.light)
        this.scene.add(this.light2)


        this.scene.fog = new THREE.Fog(0xff0000, 32, this.tweakParams.fogDistance)
        this.medusa = new Medusa(this.exp, this.medusaParams)
        this.towers = new Tower(this.exp, {
            base: 16,
            height: 56
        });
        this.createTowers()
        this.createMedusa()
        this.createTweak()
    }

    createMedusa() {
        this.medusa.createMedusas()

    }


    createTowers() {
        this.towers.addScene()

    }
    createTweak() {

        this.gui.add(
            this.tweakParams,
            'fogDistance',
            1, 4048, 1
        ).onChange((e) => {

            this.scene.fog = new THREE.Fog(0xff0000, 32, this.tweakParams.fogDistance)

        })

    }

    update() {

        this.medusa.update()

    }

}


