import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui";
import World from "../classes/World";

const planeVertexShader = /* glsl */`
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const planeFragmentShader = /* glsl */`
uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform int uNoiseOctaves;
uniform float uNoisePersistence;
uniform vec3 uColor;

varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 8; i++) {
        if (i >= uNoiseOctaves) break;
        value += amplitude * noise(p * frequency);
        amplitude *= uNoisePersistence;
        frequency *= 2.0;
    }
    return value;
}

void main() {
    vec2 uv = vUv * uNoiseScale;
    uv += vec2(uTime * uNoiseSpeed, uTime * uNoiseSpeed * 0.7);
    float n = fbm(uv);
    vec3 color = mix(vec3(0.0), uColor, n);
    gl_FragColor = vec4(color, 1.0);
}
`

export default class GlassScene extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    private boxes: THREE.Mesh[] = []
    private plane!: THREE.Mesh
    private glassMat!: THREE.MeshPhysicalMaterial
    private planeUniforms: { [key: string]: THREE.IUniform }

    private params = {
        noiseScale: 20.0,
        noiseSpeed: 0.3,
        noiseOctaves: 1,
        noisePersistence: 0.5,
        color: '#00bfff',
        transmission: 0.95,
        thickness: 0.8,
        ior: 1.5,
        roughness: 0.02,
        metalness: 0,
        noisePosition: 10,
    }

    constructor(exp: Experience) {
        super()
        this.exp = exp
            ; (window as any).exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI

        this.planeUniforms = {
            uTime: { value: 0 },
            uNoiseScale: { value: this.params.noiseScale },
            uNoiseSpeed: { value: this.params.noiseSpeed },
            uNoiseOctaves: { value: this.params.noiseOctaves },
            uNoisePersistence: { value: this.params.noisePersistence },
            uColor: { value: new THREE.Color(this.params.color) },
        }

        this.addLights()
        this.createPlane()
        this.createGlass()
        this.setupGUI()
    }

    private addLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6))
        const dir = new THREE.DirectionalLight(0xffffff, 2.0)
        dir.position.set(5, 8, 3)
        this.scene.add(dir)
    }

    public createPlane() {
        const geo = new THREE.PlaneGeometry(20, 20)
        const mat = new THREE.ShaderMaterial({
            uniforms: this.planeUniforms,
            vertexShader: planeVertexShader,
            fragmentShader: planeFragmentShader,
            side: THREE.DoubleSide,
        })
        this.plane = new THREE.Mesh(geo, mat)
        // this.plane.rotation.x = -Math.PI / 2
        this.plane.position.y = -1
        this.plane.position.z = -this.params.noisePosition
        this.scene.add(this.plane)
    }

    public createGlass() {
        this.glassMat = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            roughness: 0,
            metalness: 0,
            opacity: 0.28,
            thickness: 2.355,
            transparent: true,
        })




        const count = 100
        let geo = this.exp.ressources.items.glass.scene.children[0].geometry.clone() // new THREE.BoxGeometry(1.2, h, 0.6)
        geo.center()

        geo.computeBoundingBox()
        const size = new THREE.Vector3()
        geo.boundingBox.getSize(size)

        const thickness = size.x // or size.z depending on orientation
        const spacing = thickness

        let posX = -count / 2 * spacing
        for (let i = 0; i < count; i++) {

            const h = 4
            let geo = this.exp.ressources.items.glass.scene.children[0].geometry.clone() // new THREE.BoxGeometry(1.2, h, 0.6)

            const mesh = new THREE.Mesh(geo, this.glassMat)
            mesh.rotateX(Math.PI / 2)
            mesh.position.set(posX, h / 2 - 1, -size.y)

            this.scene.add(mesh)
            this.boxes.push(mesh)

            posX += spacing

        }
    }

    private setupGUI() {
        const noiseFolder = this.gui.addFolder('Noise')
        noiseFolder.add(this.params, 'noiseScale', 0.1, 200, 0.1).name('Scale')
            .onChange((v: number) => { this.planeUniforms.uNoiseScale.value = v })
        noiseFolder.add(this.params, 'noiseSpeed', 0, 2, 0.01).name('Speed')
            .onChange((v: number) => { this.planeUniforms.uNoiseSpeed.value = v })
        noiseFolder.add(this.params, 'noiseOctaves', 0, 8, 0.01).name('Octaves')
            .onChange((v: number) => { this.planeUniforms.uNoiseOctaves.value = v })
        noiseFolder.add(this.params, 'noisePersistence', 0.1, 1, 0.01).name('Persistence')
            .onChange((v: number) => { this.planeUniforms.uNoisePersistence.value = v })
        noiseFolder.addColor(this.params, 'color').name('Color')
            .onChange((v: string) => { this.planeUniforms.uColor.value.set(v) })

        noiseFolder.add(this.params, 'noisePosition', 0, 20, 0.01).name('position')
            .onChange((v: number) => { this.plane.position.z = -v })


        const glassFolder = this.gui.addFolder('Glass Material')
        glassFolder.add(this.params, 'transmission', 0, 1, 0.01)
            .onChange((v: number) => { this.glassMat.transmission = v })
        glassFolder.add(this.params, 'thickness', 0, 50, 0.05)
            .onChange((v: number) => { this.glassMat.thickness = v })
        glassFolder.add(this.params, 'ior', 1, 2.5, 0.01).name('IOR')
            .onChange((v: number) => { this.glassMat.ior = v })
        glassFolder.add(this.params, 'roughness', 0, 1, 0.01)
            .onChange((v: number) => { this.glassMat.roughness = v })
        glassFolder.add(this.params, 'metalness', 0, 1, 0.01)
            .onChange((v: number) => { this.glassMat.metalness = v })
    }

    onBPMBeat() {
        if (!this.exp.audioManager || !this.exp.bpmManager) return
    }

    update() {
        this.planeUniforms.uTime.value = this.exp.time.elapsedTime / 1000

        // for (const box of this.boxes) {
        //     box.rotation.z += 0.001
        // }
    }

    leave() {
        this.boxes.forEach(m => this.dispose(m, this.scene))
        this.boxes = []
        if (this.plane) this.dispose(this.plane, this.scene)
        this.glassMat?.dispose()
    }
}
