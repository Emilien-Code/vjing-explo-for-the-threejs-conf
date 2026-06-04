
import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui";
import World from "../classes/World";

export default class LevitatingBody extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    private gltf!: any
    private mat!: THREE.MeshBasicMaterial
    private mixer!: THREE.AnimationMixer

    private directionalLight!: THREE.DirectionalLight
    private ambientLight!: THREE.AmbientLight

    private holder: THREE.Object3D
    private guiFolder!: GUI

    private params = {
        color: 0xffffff,
        baseColor: 0x000000,
        noiseColor: 0xffffff,
        threshold: 0.7,
        noiseDensity: 1.0,
        lightX: 2,
        lightY: 4,
        lightZ: 3,
        speed: 0.001
    }

    constructor(exp: Experience) {
        super()
        this.exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI

        this.holder = new THREE.Object3D()


        this.gltf = this.exp.ressources.items.storm_light

        this.createMaterial()
        this.createScene()
        this.addScene()
        this.setupGUI()
    }

    createMaterial() {
        this.mat = new THREE.MeshBasicMaterial({
            color: 0xffffff
        })
    }

    createScene() {
        const poseFalling = this.gltf.scene

        poseFalling.traverse((el: THREE.Object3D) => {
            if (el.isMesh) {
                el.material = this.mat
                el.layers.enable(6)
            }
            el.layers.enable(6)
        })


    }

    addScene() {
        this.holder.add(this.gltf.scene)
        this.scene.add(this.holder)
    }

    private setupGUI() {
        this.guiFolder = this.gui.addFolder('levitating_body')
        const folder = this.guiFolder

        // folder.addColor(this.params, 'color')
        //     .name('Noise Color')
        //     .onChange((v: number) => { this.mat.uniforms.diffuse.value = new THREE.Color(v) })

        folder.addColor(this.params, 'baseColor')
            .name('Base Color')
            .onChange((v: number) => { this.mat.uniforms.baseColor.value = new THREE.Color(v) })
        folder.addColor(this.params, 'noiseColor')
            .name('Noise Color')
            .onChange((v: number) => { this.mat.uniforms.noiseColor.value = new THREE.Color(v) })

        folder.add(this.params, 'threshold', 0, 1, 0.01)
            .name('Threshold')
            .onChange((v: number) => { this.mat.uniforms.threshold.value = v })

        folder.add(this.params, 'noiseDensity', 0.0001, 1, 0.001)
            .name('Noise Density')
            .onChange((v: number) => { this.mat.uniforms.noiseDensity.value = v })

        folder.add(this.params, 'lightX', -10, 10, 0.1)
            .name('X')
            .onChange((v: number) => { this.directionalLight.position.x = v })
        folder.add(this.params, 'lightY', -10, 10, 0.1)
            .name('Y')
            .onChange((v: number) => { this.directionalLight.position.y = v })
        folder.add(this.params, 'lightZ', -10, 10, 0.1)
            .name('Z')
            .onChange((v: number) => { this.directionalLight.position.z = v })

        this.guiFolder.hide()
    }

    showGUI(v: boolean) {
        v ? this.guiFolder.show() : this.guiFolder.hide()
    }

    setVisible(v: boolean) {
        this.gltf.scene.visible = v
        this.holder.visible = v
    }

    onBPMBeat() {
        if (!this.exp.audioManager || !this.exp.bpmManager) return
    }

    update() {

    }

    leave() {
        this.scene.remove(this.directionalLight)
        this.scene.remove(this.ambientLight)
    }

}