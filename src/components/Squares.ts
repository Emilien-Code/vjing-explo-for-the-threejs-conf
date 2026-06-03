import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui"
import World from "../classes/World"

export default class Squares extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    private group: THREE.Group
    private boxes: THREE.Mesh[] = []
    private mat!: THREE.MeshStandardMaterial

    private params = {
        count: 12,
        radius: 4,
        boxSize: 0.4,
        groupRotationSpeed: 0.3,
        selfRotationSpeed: 1.2,
        color: '#ffffff',
        emissive: '#444466',
    }

    constructor(exp: Experience) {
        super()
        this.exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI

        this.group = new THREE.Group()

        this.createMaterial()
        this.createBoxes()
        this.scene.add(this.group)

        this.setupGUI()
    }

    private createMaterial() {
        this.mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(this.params.color),
            emissive: new THREE.Color(this.params.emissive),
            roughness: 0.3,
            metalness: 0.7,
        })
    }

    private createBoxes() {
        this.boxes.forEach(b => {
            this.group.remove(b)
            this.dispose(b, this.scene)
        })
        this.boxes = []

        const geo = new THREE.BoxGeometry(
            this.params.boxSize,
            this.params.boxSize,
            this.params.boxSize
        )

        for (let i = 0; i < this.params.count; i++) {
            const angle = (i / this.params.count) * Math.PI * 2
            const x = Math.cos(angle) * this.params.radius
            const z = Math.sin(angle) * this.params.radius

            const mesh = new THREE.Mesh(geo, this.mat)
            mesh.position.set(x, z, 0)
            mesh.userData.initialAngle = angle

            this.group.add(mesh)
            this.boxes.push(mesh)
        }
    }

    private setupGUI() {
        const folder = this.gui.addFolder('Squares')

        folder.add(this.params, 'count', 3, 32, 1).name('Count').onChange(() => this.createBoxes())
        folder.add(this.params, 'radius', 1, 20, 0.1).name('Radius').onChange(() => this.createBoxes())
        folder.add(this.params, 'boxSize', 0.1, 3, 0.05).name('Box Size').onChange(() => this.createBoxes())
        folder.add(this.params, 'groupRotationSpeed', 0, 5, 0.01).name('Group Speed')
        folder.add(this.params, 'selfRotationSpeed', 0, 10, 0.01).name('Self Spin Speed')
        folder.addColor(this.params, 'color').name('Color').onChange((v: string) => {
            this.mat.color.set(v)
        })
        folder.addColor(this.params, 'emissive').name('Emissive').onChange((v: string) => {
            this.mat.emissive.set(v)
        })
    }

    setVisible(v: boolean) {
        this.group.visible = v
    }

    onBPMBeat() {
        if (!this.exp.audioManager || !this.exp.bpmManager) return
    }

    update() {
        const t = this.exp.time.elapsedTime / 1000

        this.group.rotation.z = t * this.params.groupRotationSpeed

        for (const box of this.boxes) {
            box.rotation.x = t * this.params.selfRotationSpeed
            box.rotation.y = t * this.params.selfRotationSpeed * 0.7
            box.rotation.z = t * this.params.selfRotationSpeed * 0.5
        }
    }

    leave() {
        this.boxes.forEach(b => this.dispose(b, this.scene))
        this.boxes = []
        this.scene.remove(this.group)
        this.mat.dispose()
    }
}
