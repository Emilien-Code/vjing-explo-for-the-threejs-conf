import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui"
import World from "../classes/World"
import CustomToonMaterial from "./CustomToonMaterial"
import Clouds from "./Clouds"

type SquaresEffect = 'kick' | 'none'



export default class Squares extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    private group: THREE.Group
    private guiFolder!: GUI
    private rings: THREE.Group[] = []
    private boxes: THREE.Mesh[] = []
    private mat!: CustomToonMaterial

    private directionalLight!: THREE.DirectionalLight
    private ambientLight!: THREE.AmbientLight
    private clouds!: Clouds

    private params = {
        count: 8,
        radius: 2,
        boxSize: 0.4,
        groupRotationSpeed: 0.3,
        selfRotationSpeed: 1.2,
        color: 0xffffff,//0x4690D2,
        baseColor: 0x121212,
        noiseColor: 0xffffff,//0x4690D2,
        threshold: 0.7,
        noiseDensity: 1.0,
        speed: 0.05,
        ringCount: 8,
        tunnelLength: 200,
        forwardSpeed: 5,
        beatBoostAmount: 200,
        beatDuration: 0.5,
        beatEnabled: true,
    }

    private beatPhase: number = 0
    private beatCounter: number = 0
    private accumulatedDistance: number = 0

    constructor(exp: Experience) {
        super()
        this.exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI

        this.group = new THREE.Group()

        this.createMaterial()
        this.createBoxes()
        this.addLights()
        this.scene.add(this.group)

        this.clouds = new Clouds(this.exp, {
            x: 0,
            y: 0,
            z: -100,
            clouds: 800,
            yAmplitude: 8,
            cloudOpacity: 0.025,
            blending: THREE.AdditiveBlending,
            scaleAspect: 5,
            spreadX: 6,
            spreadZ: 220,
            textureKey: 'noise',
        })

        this.setupGUI()
    }

    private createMaterial() {
        this.mat = new CustomToonMaterial({
            color: this.params.color,
            baseColor: this.params.baseColor,
            noiseColor: this.params.noiseColor,
        }, this.params.threshold)
        this.mat.uniforms.noiseDensity.value = this.params.noiseDensity
    }

    private addLights() {
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 2)
        this.directionalLight.position.set(2, 4, 3)
        this.scene.add(this.directionalLight)

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
        this.scene.add(this.ambientLight)
    }

    private createBoxes() {
        this.rings.forEach(ring => {
            ring.children.slice().forEach(child => {
                ring.remove(child)
                this.dispose(child as THREE.Mesh, this.scene)
            })
            this.group.remove(ring)
        })
        this.rings = []
        this.boxes = []

        const geo = new THREE.BoxGeometry(
            this.params.boxSize,
            this.params.boxSize,
            this.params.boxSize
        )

        for (let r = 0; r < this.params.ringCount; r++) {
            const ring = new THREE.Group()

            for (let i = 0; i < this.params.count; i++) {
                const angle = (i / this.params.count) * Math.PI * 2
                const px = Math.cos(angle) * this.params.radius
                const py = Math.sin(angle) * this.params.radius

                const mesh = new THREE.Mesh(geo, this.mat)
                mesh.position.set(px, py, 0)
                mesh.userData.initialAngle = angle
                mesh.userData.rotOffset = (i / this.params.count) * Math.PI * 2

                mesh.layers.enable(6)
                ring.add(mesh)
                this.boxes.push(mesh)
            }

            this.group.add(ring)
            this.rings.push(ring)
        }
    }

    private setupGUI() {
        this.guiFolder = this.gui.addFolder('Squares')
        const folder = this.guiFolder

        folder.add(this.params, 'count', 3, 32, 1).name('Count').onChange(() => this.createBoxes())
        folder.add(this.params, 'radius', 1, 20, 0.1).name('Radius').onChange(() => this.createBoxes())
        folder.add(this.params, 'boxSize', 0.1, 3, 0.05).name('Box Size').onChange(() => this.createBoxes())
        folder.add(this.params, 'ringCount', 2, 20, 1).name('Ring Count').onChange(() => this.createBoxes())
        folder.add(this.params, 'tunnelLength', 5, 200, 1).name('Tunnel Length')
        folder.add(this.params, 'forwardSpeed', 0, 30, 0.1).name('Forward Speed')
        folder.add(this.params, 'groupRotationSpeed', 0, 5, 0.01).name('Group Rotation')

        const beatFolder = folder.addFolder('Beat')
        beatFolder.add(this.params, 'beatEnabled').name('Enabled')
        beatFolder.add(this.params, 'beatBoostAmount', 0, 1000, 1).name('Boost Amount')
        beatFolder.add(this.params, 'beatDuration', 0.05, 2, 0.01).name('Duration')
        folder.add(this.params, 'selfRotationSpeed', 0, 10, 0.01).name('Self Spin Speed')
        folder.addColor(this.params, 'color').name('Color').onChange((v: number) => {
            this.mat.uniforms.diffuse.value = new THREE.Color(v)
        })
        folder.addColor(this.params, 'baseColor').name('Base Color').onChange((v: number) => {
            this.mat.uniforms.baseColor.value = new THREE.Color(v)
        })
        folder.addColor(this.params, 'noiseColor').name('Noise Color').onChange((v: number) => {
            this.mat.uniforms.noiseColor.value = new THREE.Color(v)
        })
        folder.add(this.params, 'threshold', 0, 1, 0.01).name('Threshold').onChange((v: number) => {
            this.mat.uniforms.threshold.value = v
        })
        folder.add(this.params, 'noiseDensity', 0.0001, 1, 0.001).name('Noise Density').onChange((v: number) => {
            this.mat.uniforms.noiseDensity.value = v
        })
        folder.add(this.params, 'speed', 0, 1, 0.01).name('Noise Speed')

        this.guiFolder.hide()
    }

    onReady() {
        this.clouds.createClouds()
    }

    showGUI(v: boolean) {
        v ? this.guiFolder.show() : this.guiFolder.hide()
        this.clouds.showGUI(v)
    }

    private applyEffect(effect: string) {
        this.params.beatEnabled = effect === 'kick'
        this.guiFolder.controllersRecursive().forEach(c => c.updateDisplay())
    }

    setVisible(v: boolean, effect: string) {
        if (v) {
            this.applyEffect(effect)
        }
        this.group.visible = v
        this.clouds.setVisible(v)
    }

    onBPMBeat() {
        this.beatCounter++
        if (this.beatCounter % 2 === 0) this.beatPhase = 1.0
    }

    private updateMaterial(delta: number) {
        this.mat.uniforms.time.value += delta * 1000 * this.params.speed
        this.clouds.update()
    }

    private updateTunnelSpeed(delta: number) {
        if (this.beatPhase > 0) {
            this.beatPhase = Math.max(0, this.beatPhase - delta / this.params.beatDuration)
        }
        const easeOutCirc = (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2))
        const speedBoost = this.params.beatEnabled && this.beatPhase > 0
            ? this.params.beatBoostAmount * (1 - easeOutCirc(1 - this.beatPhase))
            : 0

        this.accumulatedDistance += (this.params.forwardSpeed + speedBoost) * delta
    }

    private updateRings() {
        const spacing = this.params.tunnelLength / this.params.ringCount
        const nearClip = 5
        for (let r = 0; r < this.rings.length; r++) {
            const progress = (this.accumulatedDistance + r * spacing) % this.params.tunnelLength
            this.rings[r].position.z = progress - this.params.tunnelLength + nearClip
        }
    }

    private updateBoxRotations(t: number) {
        for (const box of this.boxes) {
            const o = box.userData.rotOffset
            box.rotation.x = t * this.params.selfRotationSpeed + o
            box.rotation.y = t * this.params.selfRotationSpeed * 0.7 + o
            box.rotation.z = t * this.params.selfRotationSpeed * 0.5 + o
        }
    }

    update() {
        const delta = this.exp.time.delta / 1000
        const t = this.exp.time.elapsedTime / 1000

        this.updateMaterial(delta)
        this.updateTunnelSpeed(delta)
        this.updateRings()
        this.group.rotation.z = t * this.params.groupRotationSpeed
        this.updateBoxRotations(t)
    }

    leave() {
        this.rings.forEach(ring => {
            ring.children.slice().forEach(child => {
                ring.remove(child)
                this.dispose(child as THREE.Mesh, this.scene)
            })
        })
        this.boxes = []
        this.rings = []
        this.scene.remove(this.group)
        this.scene.remove(this.directionalLight)
        this.scene.remove(this.ambientLight)
        this.mat.dispose()
        this.clouds.dispose()
    }
}
