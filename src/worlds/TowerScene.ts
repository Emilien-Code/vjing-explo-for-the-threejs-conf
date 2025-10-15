import * as THREE from "three"
import GUI from "lil-gui";

import Experience from "../Experience"
import World from "../classes/World";
import Tower from "../components/Tower"
import Medusa from "../components/Medusa";

import {fogPalette} from "../common/colors"
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
        fogDensity: 1,
        lightX: 50,
        lightY: 50,
        lightZ: 50,
    }
    private medusaParams = {
        noiseFactor: 0.1,
        amountOfMedusa: 5,
    }

    private sunmaterial: THREE.MeshBasicMaterial
    private sungeometry: THREE.SphereGeometry
    private sunmesh: THREE.Mesh

    constructor(exp: Experience) {
        super();
        this.exp = exp;
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI
        this.alight = new THREE.AmbientLight(0xffffff, 1)
        this.scene.add(this.alight)

        this.light = new THREE.DirectionalLight(0xffffff, 1)
        this.light.castShadow = true
        this.light.position.x = this.tweakParams.lightX
        this.light.position.y = this.tweakParams.lightY
        this.light.position.z = this.tweakParams.lightZ
        this.scene.add(this.light)

        this.scene.background = new THREE.Color(fogPalette[0])
        this.sunmaterial = new THREE.MeshBasicMaterial({ color: "red" })
        this.sungeometry = new THREE.SphereGeometry(1, 32, 16)
        this.sunmesh = new THREE.Mesh(this.sungeometry, this.sunmaterial)
        this.sunmesh.position.x = this.tweakParams.lightX
        this.sunmesh.position.y = this.tweakParams.lightY
        this.sunmesh.position.z = this.tweakParams.lightZ
        this.scene.add(this.sunmesh)


        // this.scene.fog = new THREE.Fog(0x529467, 0, this.tweakParams.fogDistance)
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.0025);
        this.medusa = new Medusa(this.exp, this.medusaParams)
        this.towers = new Tower(this.exp, {
            base: 8,
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

        const folder = this.gui.addFolder("sun")

        folder.add(
            this.tweakParams,
            'lightX',
            1, 1000, 1
        ).onChange((e) => {
            this.light.position.x = e
            this.sunmesh.position.x = e
        })
        folder.add(
            this.tweakParams,
            'lightY',
            1, 1000, 1
        ).onChange((e) => {
            this.light.position.y = e
            this.sunmesh.position.y = e
        })
        folder.add(
            this.tweakParams,
            'lightZ',
            1, 1000, 1
        ).onChange((e) => {
            this.light.position.z = e
            this.sunmesh.position.z = e
        })

        this.gui.add(
            this.tweakParams,
            'fogDensity',
            0, 1, .001
        ).onChange((e) => {
            this.scene.fog = new THREE.FogExp2(fogPalette[0], this.tweakParams.fogDensity)
        })

    }

    update() {

        this.medusa.update()
        this.towers.update()
    }

}


