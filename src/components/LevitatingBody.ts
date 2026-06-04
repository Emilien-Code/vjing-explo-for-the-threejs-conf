
import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui";
import World from "../classes/World";
import CustomToonMaterial from "./CustomToonMaterial";

export default class LevitatingBody extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    public gltf!: any
    private mat!: CustomToonMaterial
    private mixer!: THREE.AnimationMixer

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

        this.gltf = this.exp.ressources.items.pose_falling_2
        this.createMaterial()
        this.createScene()
        this.addScene()
        this.setupGUI()
    }

    createMaterial() {
        this.mat = new CustomToonMaterial({
            baseColor: this.params.baseColor,
            noiseColor: this.params.noiseColor,
            color: this.params.color
        }, this.params.threshold)
    }

    createScene() {
        const poseFalling = this.gltf.scene

        poseFalling.traverse((el: THREE.Object3D) => {
            if (el instanceof THREE.SkinnedMesh) {
                el.material = this.mat
            }
            el.layers.enable(6)
        })
        poseFalling.position.y += 0.4
        poseFalling.scale.set(0.05, 0.05, 0.05)
        poseFalling.position.z += 3

        poseFalling.rotation.y = Math.PI / 4
        poseFalling.rotation.x = Math.PI / 4
        this.scene.add(poseFalling)

        this.mat.uniforms.uLightDir.value.set(this.params.lightX, this.params.lightY, this.params.lightZ).normalize()

        this.mixer = new THREE.AnimationMixer(poseFalling)
        if (this.gltf.animations.length > 0) {
            const action = this.mixer.clipAction(this.gltf.animations[1])
            action.play()
        }
    }

    addScene() {
        this.holder.add(this.gltf)
        this.scene.add(this.holder)
    }

    private setupGUI() {
        this.guiFolder = this.gui.addFolder('levitating_body')
        const folder = this.guiFolder

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

        const updateLightDir = () => {
            this.mat.uniforms.uLightDir.value.set(this.params.lightX, this.params.lightY, this.params.lightZ).normalize()
        }
        folder.add(this.params, 'lightX', -10, 10, 0.1).name('X').onChange(updateLightDir)
        folder.add(this.params, 'lightY', -10, 10, 0.1).name('Y').onChange(updateLightDir)
        folder.add(this.params, 'lightZ', -10, 10, 0.1).name('Z').onChange(updateLightDir)

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
        this.mixer.update(this.exp.time.delta * 0.00085)
        this.mat.uniforms.time.value += this.exp.time.delta * this.params.speed
    }

    leave() { }

}
