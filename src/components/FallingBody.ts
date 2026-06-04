
import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui";
import World from "../classes/World";
import CustomToonMaterial from "./CustomToonMaterial";

export default class FallingBody extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    private gltf!: any
    private mat!: CustomToonMaterial
    private mixer!: THREE.AnimationMixer

    private directionalLight!: THREE.DirectionalLight
    private ambientLight!: THREE.AmbientLight

    private holder: THREE.Object3D
    private guiFolder!: GUI
    private lightAngle = 0
    private lightRadius = Math.sqrt(2 ** 2 + 3 ** 2)

    private params = {
        color: 0xffffff,//0x4690D2,
        baseColor: 0x121212,
        noiseColor: 0xffffff,//0x4690D2,
        threshold: 0.7,
        noiseDensity: 1.0,
        lightY: 4,
        lightOrbitSpeed: 0.01,
        speed: 0.05,
        beatEnabled: false,
    }

    constructor(exp: Experience) {
        super()
        this.exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI

        this.holder = new THREE.Object3D()

        this.gltf = this.exp.ressources.items.pose_falling_1
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
                el.layers.enable(6)
            }
            el.layers.enable(6)
        })

        poseFalling.position.y += 0.4
        poseFalling.scale.set(0.05, 0.05, 0.05)
        poseFalling.position.z += 3

        poseFalling.rotation.y = Math.PI / 4
        poseFalling.rotation.x = Math.PI
        this.scene.add(poseFalling)

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 2)
        this.directionalLight.position.set(2, 4, 3)
        this.scene.add(this.directionalLight)

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
        this.scene.add(this.ambientLight)

        this.mixer = new THREE.AnimationMixer(poseFalling)
        if (this.gltf.animations.length > 0) {
            const action = this.mixer.clipAction(this.gltf.animations[0])
            action.play()
        }
    }

    addScene() {
        this.holder.add(this.gltf)
        this.scene.add(this.holder)
    }

    private setupGUI() {
        this.guiFolder = this.gui.addFolder('falling_body')
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


        folder.add(this.params, 'speed', 0, 1, 0.01)
            .name('Noise Speed')
            .onChange((v: number) => { this.mat.uniforms.time.value = v })

        folder.add(this.params, 'threshold', 0, 1, 0.01)
            .name('Threshold')
            .onChange((v: number) => { this.mat.uniforms.threshold.value = v })

        folder.add(this.params, 'noiseDensity', 0.0001, 1, 0.001)
            .name('Noise Density')
            .onChange((v: number) => { this.mat.uniforms.noiseDensity.value = v })

        folder.add(this.params, 'lightY', -10, 10, 0.1)
            .name('Light Y')
            .onChange((v: number) => { this.directionalLight.position.y = v })
        folder.add(this.params, 'lightOrbitSpeed', 0, 0.1, 0.001)
            .name('Orbit Speed')

        this.guiFolder.hide()
    }

    showGUI(v: boolean) {
        v ? this.guiFolder.show() : this.guiFolder.hide()
    }

    private applyEffect(effect: string) {
        this.params.beatEnabled = effect === 'kick'

        if (effect === 'aside') {
            this.gltf.scene.position.z = -20
        } else {
            this.gltf.scene.position.z = -14
        }
    }



    setVisible(v: boolean, effect: string) {
        if (v) {
            this.applyEffect(effect)
        }
        this.gltf.scene.visible = v
        this.holder.visible = v
    }

    onBPMBeat() {
        if (!this.exp.audioManager || !this.exp.bpmManager) return
    }

    update() {
        this.mixer.update(this.exp.time.delta * 0.00085)
        this.mat.uniforms.time.value += this.exp.time.delta * this.params.speed
        this.gltf.scene.rotation.y += 0.0051
        if (!this.params.beatEnabled) this.gltf.scene.position.z -= 0.0051



        this.lightAngle += this.params.lightOrbitSpeed
        const target = this.gltf.scene.position
        this.directionalLight.position.x = target.x + this.lightRadius * Math.cos(this.lightAngle)
        this.directionalLight.position.z = target.z + this.lightRadius * Math.sin(this.lightAngle)
        this.directionalLight.position.y = this.params.lightY
    }

    leave() {
        this.scene.remove(this.directionalLight)
        this.scene.remove(this.ambientLight)
    }

}