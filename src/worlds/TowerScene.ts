import * as THREE from "three"
import GUI from "lil-gui";

import Experience from "../Experience"
import World from "../classes/World";
import Tower from "../components/Tower"
import Medusa from "../components/Medusa";
import Clouds from "../components/Clouds";
import AudioAnalyzer from "../utils/AudioAnalyzer";
import {
    fogPalette,
    fogSettings
} from "../common/colors"
import GodRays from "../components/GodRays";
const colors = {
    grey: "",
    gold: ""
}
const lerp = (t, i, e) => t * (1 - e) + i * e


export default class TwoerScene extends World {

    private exp: Experience;
    private scene: THREE.Scene
    private towers: Tower
    private alight: THREE.AmbientLight
    private light: THREE.DirectionalLight
    private light2: THREE.DirectionalLight
    private gui: GUI
    private medusa: Medusa
    private clouds: Clouds
    private cloudTop: Clouds
    private tweakParams = {
        fogDensity: 1,
        lightX: -50,
        lightY: 75,
        lightZ: 50,
    }
    private medusaParams = {
        noiseFactor: 0.1,
        amountOfMedusa: 100,
    }
    public isPlaying = false

    private sunmaterial: THREE.MeshBasicMaterial
    private sungeometry: THREE.SphereGeometry
    private sunmesh: THREE.Mesh
    private godRays: GodRays
    private audio : AudioAnalyzer
    constructor(exp: Experience) {
        super();
        this.exp = exp;
        window.exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI
        this.alight = new THREE.AmbientLight(0xffe6cc, 1)
        this.scene.add(this.alight)

        this.light = new THREE.DirectionalLight(0xffe6cc, 1)
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
        this.audio = new AudioAnalyzer()
        this.isPlaying = false
        window.onclick = () => {
            this.audio.play()
            this.exp.time.reset()
            this.isPlaying = true;
        }
        // this.scene.fog = new THREE.Fog(0x529467, 0, this.tweakParams.fogDistance)
        this.scene.fog = new THREE.FogExp2(fogPalette[0], fogSettings.density);
        this.medusa = new Medusa(this.exp, this.medusaParams)
        this.towers = new Tower(this.exp, {
            base: 8,
            height: 56
        });
        //3000 et 2000 peuvznt suffir
        this.clouds = new Clouds(this.exp, { x: 0, y: 10, z: 0, clouds: 33800, yAmplitude: 20, cloudOpacity: 0.01 })
        this.cloudTop = new Clouds(this.exp, { x: 0, y: 0, z: 0, clouds: 3900, yAmplitude: 100, cloudOpacity: 0.02 })
        this.godRays = new GodRays(exp, {
            x: 0,
            y: 35,
            z: 11,
            count: 100
        })
        this.createTowers()
        this.createMedusa()
        this.createTweak()


        //POSITION LA CAMERA
        const offset = 16 // (base * 2 + offset)/2
        this.exp.camera.instance.rotation.y = Math.PI
        this.exp.camera.instance.position.x = 16
        this.exp.camera.instance.position.y = 20// ou 44 et 35 aussi c'est cool 

    }

    createMedusa() {
        this.medusa.createMedusas()

    }

    onReady() {
        this.clouds.createClouds()
        // this.cloudTop.createClouds()
        this.godRays.createRays()
    }

    createTowers() {
        this.towers.addScene()

    }
    createTweak() {

        const folder = this.gui.addFolder("sun")

        folder.add(
            this.tweakParams,
            'lightX',
            -100, 100, 1
        ).onChange((e) => {
            this.light.position.x = e
            this.sunmesh.position.x = e
        })
        folder.add(
            this.tweakParams,
            'lightY',
            -100, 100, 1
        ).onChange((e) => {
            this.light.position.y = e
            this.sunmesh.position.y = e
        })
        folder.add(
            this.tweakParams,
            'lightZ',
            -100, 100, 1
        ).onChange((e) => {
            this.light.position.z = e
            this.sunmesh.position.z = e
        })

        this.gui.add(
            this.tweakParams,
            'fogDensity',
            0, 0.1, .001
        ).onChange((e) => {
            this.scene.fog = new THREE.FogExp2(fogPalette[0], this.tweakParams.fogDensity)
        })
        folder.close()
    }

    update() {
        if(!this.isPlaying) return
        //Entry Animation : 

        this.exp.camera.instance.position.y = lerp(
            this.exp.camera.instance.position.y,
            40,
            0.05
        )

        this.exp.camera.instance.position.z = this.exp.time.elapsedTime * 0.0051

        this.medusa.update()
        this.towers.update()
    }

}


