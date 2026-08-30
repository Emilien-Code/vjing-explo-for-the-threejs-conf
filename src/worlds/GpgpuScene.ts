import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui";
import World from "../classes/World";
import { gsap } from "gsap"
import { SkeletonHelper } from 'three'
import type { instance } from "three/tsl";
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'
import type {
    Variable
} from 'three/addons/misc/GPUComputationRenderer.js'
import { zip } from "three/examples/jsm/libs/fflate.module.js";
const lerp = (t, i, e) => t * (1 - e) + i * e


const boneScaleMap = {
    Head: 0.15,
    Spine: 0.12,
    Hips: 0.13,

    LeftArm: 0.08,
    RightArm: 0.08,

    LeftForeArm: 0.06,
    RightForeArm: 0.06,

    LeftHand: 0.04,
    RightHand: 0.04,

    LeftUpLeg: 0.12,
    RightUpLeg: 0.12,

    LeftLeg: 0.10,
    RightLeg: 0.10,

    LeftFoot: 0.07,
    RightFoot: 0.07
}


export default class BreakDanceScene extends World {

    private exp: Experience;
    private scene: THREE.Scene
    private gui: GUI
    // private material: THREE.MeshStandardMaterial
    private holder: THREE.Object3D
    private points: THREE.Points | null = null
    private bones: any[]
    private offsets: THREE.Vector3[] = []
    private scales: number[] = []
    private range: number[] = []
    private action: THREE.AnimationAction
    private mixer: THREE.AnimationMixer
    private cubes: THREE.InstancedMesh | undefined
    private bonePairs: any[] = []
    private particleBonePairs: any[][] = []
    private particleLerpT: Float32Array = new Float32Array(0)
    private particleScatterOffset: Float32Array = new Float32Array(0)


    declare geometry: {
        instance: THREE.BufferGeometry

    }
    declare baseGeometry: {
        count: number;
        instance: THREE.BufferGeometry
    }
    declare material: {
        instance: THREE.ShaderMaterial
    }

    declare gpgpu: {
        size: number
        computation: GPUComputationRenderer
        particlesVariable: Variable
        debug: THREE.Mesh
    }

    declare particleUvObject: Float32Array
    private targetPositionsTexture!: THREE.DataTexture


    private params = {
        metalness: 1,
        roughness: 0,
        particleCount: 15000,
        size: 0.01,
        sizeRandomness: 0.5,
        scatter: 0.2,
    }

    constructor(exp: Experience) {
        super();
        this.exp = exp;
        (window as any).exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI


        const gltf = this.exp.ressources.items.hiphop_dance_rig//break_dance_rig
        this.bones = []
        const model = gltf.scene


        this.mixer = new THREE.AnimationMixer(model)
        this.action = this.mixer.clipAction(gltf.animations[0])
        this.action.play()



        const helper = new SkeletonHelper(gltf.scene)
        helper.setColors(new THREE.Color(0xff0000), new THREE.Color(0x000000))
        // this.scene.add(helper)


        this.action.timeScale = 0.00085 //hiphop_dance_rig
        this.scene.add(model)

        model.traverse((child) => {

            if (child.isBone && child.parent?.isBone) {
                this.bonePairs.push([child.parent, child])
            }

        })


        this.holder = new THREE.Object3D()
        this.scene.add(this.holder);



        this.baseGeometry = {} as any
        this.material = {} as any
        this.gpgpu = {} as any
        this.geometry = {} as any


        this.createBaseGeometry()
        this.createMaterial()
        this.createGPGPU()
        this.createGeometry()
        this.createPoints()
        this.setupGUI()
    }

    private createGeometry() {
        this.particleUvObject = new Float32Array(this.baseGeometry.count * 2)

        for (let y = 0; y < this.gpgpu.size; y++) {
            for (let x = 0; x < this.gpgpu.size; x++) {

                const i = (y * this.gpgpu.size) + x
                const i2 = i * 2

                const uvX = (x + 0.5) / this.gpgpu.size
                const uvY = (y + 0.5) / this.gpgpu.size

                this.particleUvObject[i2 + 0] = uvX
                this.particleUvObject[i2 + 1] = uvY
            }
        }

        this.geometry.instance = new THREE.BufferGeometry()
        this.geometry.instance.setDrawRange(0, this.baseGeometry.count)
        this.geometry.instance.setAttribute("aParticlesUv", new THREE.BufferAttribute(this.particleUvObject, 2))

    }
    private createBaseGeometry() {

        this.baseGeometry.instance = new THREE.BufferGeometry()

        const tempPosA = new THREE.Vector3()
        const tempPosB = new THREE.Vector3()

        // Compute each bone segment length for proportional distribution
        const boneLengths: number[] = this.bonePairs.map(pair => {
            pair[0].getWorldPosition(tempPosA)
            pair[1].getWorldPosition(tempPosB)
            return tempPosA.distanceTo(tempPosB)
        })
        const totalLength = boneLengths.reduce((sum, l) => sum + l, 0)

        const totalParticles = this.params.particleCount
        const vertices = new Float32Array(totalParticles * 3)
        this.particleBonePairs = []
        this.particleLerpT = new Float32Array(totalParticles)
        this.particleScatterOffset = new Float32Array(totalParticles * 3)
        let idx = 0

        for (let b = 0; b < this.bonePairs.length; b++) {
            const isLast = b === this.bonePairs.length - 1
            const count = isLast
                ? totalParticles - idx
                : Math.round((boneLengths[b] / totalLength) * totalParticles)

            const pair = this.bonePairs[b]
            pair[0].getWorldPosition(tempPosA)
            pair[1].getWorldPosition(tempPosB)

            for (let i = 0; i < count && idx < totalParticles; i++) {
                const t = Math.random()
                const sx = (Math.random() - 0.5) * this.params.scatter
                const sy = (Math.random() - 0.5) * this.params.scatter
                const sz = (Math.random() - 0.5) * this.params.scatter
                const pos = tempPosA.clone().lerp(tempPosB, t)
                vertices[idx * 3 + 0] = pos.x + sx
                vertices[idx * 3 + 1] = pos.y + sy
                vertices[idx * 3 + 2] = pos.z + sz
                this.particleLerpT[idx] = t
                this.particleScatterOffset[idx * 3 + 0] = sx
                this.particleScatterOffset[idx * 3 + 1] = sy
                this.particleScatterOffset[idx * 3 + 2] = sz
                this.particleBonePairs.push(pair)
                idx++
            }
        }

        this.baseGeometry.instance.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        this.baseGeometry.count = this.baseGeometry.instance.attributes.position.count

    }

    private createMaterial() {
        this.material.instance = new THREE.ShaderMaterial({
            vertexShader: `

            attribute vec2 aParticlesUv;

            uniform vec2 uResolution;
            uniform float uSize;
            uniform float uSizeRandomness;
            uniform sampler2D uParticlesTexture;

            varying vec3 vColor;

            void main()
            {

            vec4 particle = texture(uParticlesTexture, aParticlesUv);
                // Final position
                vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectedPosition = projectionMatrix * viewPosition;
                gl_Position = projectedPosition;

                // Per-particle size variation using UV as stable seed
                float rand = fract(sin(dot(aParticlesUv, vec2(12.9898, 78.233))) * 43758.5453);
                float sizeScale = 1.0 + (rand - 0.5) * uSizeRandomness;

                // Point size
                gl_PointSize = uSize * uResolution.y * sizeScale;
                gl_PointSize *= (1.0 / - viewPosition.z);

                // Varyings
                vColor = vec3(1.0);
            }

            `,

            fragmentShader: `
            varying vec3 vColor;

            void main()
            {
                float distanceToCenter = length(gl_PointCoord - 0.5);
                if(distanceToCenter > 0.5)
                    discard;
                
                gl_FragColor = vec4(vColor, 1.0);

                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
            `,
            uniforms:
            {
                uSize: new THREE.Uniform(this.params.size),
                uSizeRandomness: new THREE.Uniform(this.params.sizeRandomness),
                uResolution: new THREE.Uniform(new THREE.Vector2(this.exp.sizes.width * this.exp.sizes.pixelRatio, this.exp.sizes.height * this.exp.sizes.pixelRatio)),
                uParticlesTexture: new THREE.Uniform(),
            }
        })
    }

    private createGPGPU() {
        this.gpgpu.size = Math.ceil(Math.sqrt(this.baseGeometry.count))
        this.gpgpu.computation = new GPUComputationRenderer(this.gpgpu.size, this.gpgpu.size, this.exp.renderer.instance)

        const baseParticlesTexture = this.gpgpu.computation.createTexture()

        for (let i = 0; i < this.baseGeometry.count; i++) {
            const i3 = i * 3
            const i4 = i * 4

            // Position based on geometry
            baseParticlesTexture.image.data[i4 + 0] = this.baseGeometry.instance.attributes.position.array[i3 + 0]
            baseParticlesTexture.image.data[i4 + 1] = this.baseGeometry.instance.attributes.position.array[i3 + 1]
            baseParticlesTexture.image.data[i4 + 2] = this.baseGeometry.instance.attributes.position.array[i3 + 2]
            baseParticlesTexture.image.data[i4 + 3] = 0
        }



        this.targetPositionsTexture = this.gpgpu.computation.createTexture()
        for (let i = 0; i < this.baseGeometry.count; i++) {
            const i3 = i * 3
            const i4 = i * 4
            this.targetPositionsTexture.image.data[i4 + 0] = this.baseGeometry.instance.attributes.position.array[i3 + 0]
            this.targetPositionsTexture.image.data[i4 + 1] = this.baseGeometry.instance.attributes.position.array[i3 + 1]
            this.targetPositionsTexture.image.data[i4 + 2] = this.baseGeometry.instance.attributes.position.array[i3 + 2]
            this.targetPositionsTexture.image.data[i4 + 3] = 0
        }

        const gpgpuParticlesShader = `

        uniform sampler2D uTargetPositions;

        void main()
        {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            vec4 target = texture(uTargetPositions, uv);
            gl_FragColor = target;
        }

        `

        this.gpgpu.particlesVariable = this.gpgpu.computation.addVariable('uParticles', gpgpuParticlesShader, baseParticlesTexture)
        this.gpgpu.computation.setVariableDependencies(this.gpgpu.particlesVariable, [this.gpgpu.particlesVariable])
        this.gpgpu.particlesVariable.material.uniforms.uTargetPositions = { value: this.targetPositionsTexture }
        console.log(baseParticlesTexture.image)

        this.gpgpu.computation.init()



        this.gpgpu.debug = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            new THREE.MeshBasicMaterial({ map: this.gpgpu.computation.getCurrentRenderTarget(this.gpgpu.particlesVariable).texture })

        )
        this.gpgpu.debug.position.x = 3
        this.scene.add(this.gpgpu.debug)
    }

    createPoints() {

        this.points = new THREE.Points(this.geometry.instance, this.material.instance)
        this.scene.add(this.points)

    }




    private rebuild() {
        if (this.points) {
            this.scene.remove(this.points)
            this.points = null
        }
        if (this.gpgpu.debug) {
            this.scene.remove(this.gpgpu.debug)
        }
        this.createBaseGeometry()
        this.createGPGPU()
        this.createGeometry()
        this.createPoints()
    }

    private setupGUI() {
        const folder = this.gui.addFolder('Particles')

        folder.add(this.params, 'particleCount', 1000, 50000, 1000)
            .name('Count')
            .onFinishChange(() => this.rebuild())

        folder.add(this.params, 'size', 0.001, 0.05, 0.001)
            .name('Size')
            .onChange((v: number) => {
                this.material.instance.uniforms.uSize.value = v
            })

        folder.add(this.params, 'sizeRandomness', 0, 20, 0.01)
            .name('Size Randomness')
            .onChange((v: number) => {
                this.material.instance.uniforms.uSizeRandomness.value = v
            })

        folder.add(this.params, 'scatter', 0, 1, 0.01)
            .name('Scatter')
    }

    destroyMesh() {

    }


    onBPMBeat() {
        if (!this.exp.audioManager) return
        if (!this.exp.bpmManager) return

        // Calculate a reduced duration based on the BPM (beats per minute) duration
        const duration = this.exp.bpmManager.getBPMDuration() / 1000
        if (this.exp.audioManager.isPlaying) {
            if (Math.random() < 0.3) {
                // gsap.to(this.holder.rotation, {
                //     duration: Math.random() < 0.8 ? 15 : duration, // Either a longer or BPM-synced duration
                //     y: Math.random() * Math.PI * 2,
                //     z: Math.random() * Math.PI,
                //     ease: 'elastic.out(0.2)',
                // })
            }

            if (Math.random() < 0.3) {
                // this.createPoints()
            }
        }
    }

    update() {

        if (!this.exp.audioManager) return


        const tempPosA = new THREE.Vector3()
        const tempPosB = new THREE.Vector3()

        for (let i = 0; i < this.baseGeometry.count; i++) {
            const pair = this.particleBonePairs[i]
            const boneA = pair[0]
            const boneB = pair[1]

            boneA.getWorldPosition(tempPosA)
            boneB.getWorldPosition(tempPosB)

            const t = this.particleLerpT[i]
            const tempPos = tempPosA.clone().lerp(tempPosB, t)

            const i4 = i * 4
            const i3 = i * 3
            this.targetPositionsTexture.image.data[i4 + 0] = tempPos.x + this.particleScatterOffset[i3 + 0] * this.params.scatter
            this.targetPositionsTexture.image.data[i4 + 1] = tempPos.y + this.particleScatterOffset[i3 + 1] * this.params.scatter
            this.targetPositionsTexture.image.data[i4 + 2] = tempPos.z + this.particleScatterOffset[i3 + 2] * this.params.scatter
            this.targetPositionsTexture.image.data[i4 + 3] = 0
        }

        this.targetPositionsTexture.needsUpdate = true

        this.gpgpu.computation.compute()
        this.material.instance.uniforms.uParticlesTexture.value = this.gpgpu.computation.getCurrentRenderTarget(this.gpgpu.particlesVariable).texture

        this.mixer.update(this.exp.time.delta)

        this.destroyMesh()

    }

}
