
import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui";
import World from "../classes/World";

export default class LevitatingBody extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    private geo!: THREE.SphereGeometry
    private gltf!: any
    private mat!: THREE.MeshBasicMaterial
    private mixer!: THREE.AnimationMixer



    private holder: THREE.Object3D


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
        this.mat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    }

    createScene() {
        const poseFalling = this.gltf.scene

        poseFalling.traverse((el: THREE.Object3D) => {
            if (el instanceof THREE.SkinnedMesh) {
                el.material = new THREE.MeshBasicMaterial({ color: 0xffffff })
            }
        })
        poseFalling.position.y += 0.4
        poseFalling.scale.set(0.05, 0.05, 0.05)
        poseFalling.position.z += 3


        poseFalling.rotation.y = Math.PI / 4
        poseFalling.rotation.x = Math.PI / 4
        this.scene.add(poseFalling)

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
        const noiseFolder = this.gui.addFolder('levitating_body')


    }

    onBPMBeat() {
        if (!this.exp.audioManager || !this.exp.bpmManager) return
    }

    update() {
        this.mixer.update(this.exp.time.delta * 0.00085)

    }

    leave() {
    }

}