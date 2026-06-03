
import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui"
import World from "../classes/World"
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'
import type { Variable } from 'three/addons/misc/GPUComputationRenderer.js'

const simplex4DNoise = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

vec4 grad4(float j, vec4 ip){
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;
  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;
  return p;
}

float snoise(vec4 v){
  const vec2 C = vec2(0.138196601125010504, 0.309016994374947451);
  vec4 i  = floor(v + dot(v, C.yyyy));
  vec4 x0 = v - i + dot(i, C.xxxx);
  vec4 i0;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;
  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0-1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0-2.0, 0.0, 1.0);
  vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
  vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
  vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
  vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;
  i = mod(i, 289.0);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute(permute(permute(permute(
             i.w + vec4(i1.w, i2.w, i3.w, 1.0))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0);
  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
  m0 = m0 * m0; m1 = m1 * m1;
  return 49.0 * (dot(m0*m0, vec3(dot(p0,x0), dot(p1,x1), dot(p2,x2)))
               + dot(m1*m1, vec2(dot(p3,x3), dot(p4,x4))));
}
`

export default class DancingBody extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    private gltf: any
    private mixer!: THREE.AnimationMixer
    private points: THREE.Points | null = null

    private bonePairs: any[] = []
    private particleBonePairs: any[][] = []
    private particleLerpT: Float32Array = new Float32Array(0)
    private particleScatterOffset: Float32Array = new Float32Array(0)

    declare geometry: { instance: THREE.BufferGeometry }
    declare baseGeometry: { count: number; instance: THREE.BufferGeometry }
    declare material: { instance: THREE.ShaderMaterial }
    declare gpgpu: {
        size: number
        computation: GPUComputationRenderer
        particlesVariable: Variable
    }
    declare particleUvObject: Float32Array
    private targetPositionsTexture!: THREE.DataTexture

    private params = {
        particleCount: 15000,
        size: 0.01,
        sizeRandomness: 0.5,
        scatter: 0.1,
        gravity: 4.0,
        fallRange: 2.0,
        flowFieldFactor: 0.01,
        showMesh: true,
    }

    constructor(exp: Experience) {
        super()
        this.exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI

        this.gltf = this.exp.ressources.items.dansing_model

        this.baseGeometry = {} as any
        this.material = {} as any
        this.gpgpu = {} as any
        this.geometry = {} as any

        this.setupModel()
        this.createBaseGeometry()
        this.createMaterial()
        this.createGPGPU()
        this.createGeometry()
        this.createPoints()
        this.setupGUI()
    }

    private setupModel() {
        const model = this.gltf.scene

        model.position.y += 0.4
        model.scale.set(0.05, 0.05, 0.05)
        model.position.z += 3
        model.rotation.y = Math.PI / 4
        model.rotation.x = Math.PI / 4

        model.traverse((el: THREE.Object3D) => {
            if (el instanceof THREE.SkinnedMesh) {
                el.material = new THREE.MeshBasicMaterial({ color: 0xffffff })
                el.visible = this.params.showMesh
            }
        })

        model.traverse((child: THREE.Object3D) => {
            if ((child as any).isBone && (child.parent as any)?.isBone) {
                this.bonePairs.push([child.parent, child])
            }
        })

        this.scene.add(model)

        this.mixer = new THREE.AnimationMixer(model)
        if (this.gltf.animations.length > 0) {
            const action = this.mixer.clipAction(this.gltf.animations[0])
            action.play()
        }
    }

    private createBaseGeometry() {
        this.baseGeometry.instance = new THREE.BufferGeometry()

        const tempPosA = new THREE.Vector3()
        const tempPosB = new THREE.Vector3()

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
            varying float vVelocity;

            void main() {
                vec4 particle = texture(uParticlesTexture, aParticlesUv);
                vec4 viewPosition = viewMatrix * vec4(particle.xyz, 1.0);
                gl_Position = projectionMatrix * viewPosition;

                float velocity = particle.a;
                float rand = fract(sin(dot(aParticlesUv, vec2(12.9898, 78.233))) * 43758.5453);
                float sizeScale = (1.0 + (rand - 0.5) * uSizeRandomness) * (1.0 + max(velocity, -3.0) / 3.0);

                gl_PointSize = uSize * uResolution.y * sizeScale;
                gl_PointSize *= (1.0 / -viewPosition.z);

                // vec3 color = mix(
                //     vec3(18.0/255.0, 29.0/255.0, 31.0/255.0),
                //     vec3(212.0/255.0, 213.0/255.0, 209.0/255.0),
                //     uSizeRandomness / 10.0
                // );
                vColor = vec3(1.0);
                vVelocity = particle.a;
            }
            `,
            fragmentShader: `
            varying vec3 vColor;
            varying float vVelocity;

            void main() {
                float distanceToCenter = length(gl_PointCoord - 0.5);
                if (distanceToCenter > 0.5) discard;
                gl_FragColor = vec4(vColor, 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
            `,
            uniforms: {
                uSize: new THREE.Uniform(this.params.size),
                uSizeRandomness: new THREE.Uniform(this.params.sizeRandomness),
                uResolution: new THREE.Uniform(new THREE.Vector2(
                    this.exp.sizes.width * this.exp.sizes.pixelRatio,
                    this.exp.sizes.height * this.exp.sizes.pixelRatio
                )),
                uParticlesTexture: new THREE.Uniform(),
            },
            transparent: true,
        })
    }

    private createGPGPU() {
        this.gpgpu.size = Math.ceil(Math.sqrt(this.baseGeometry.count))
        this.gpgpu.computation = new GPUComputationRenderer(this.gpgpu.size, this.gpgpu.size, this.exp.renderer.instance)

        const baseParticlesTexture = this.gpgpu.computation.createTexture()
        for (let i = 0; i < this.baseGeometry.count; i++) {
            const i3 = i * 3
            const i4 = i * 4
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

        const gpgpuShader = `
${simplex4DNoise}

uniform sampler2D uTargetPositions;
uniform float uDeltaTime;
uniform float uGravity;
uniform float uFallRange;
uniform float uFlowFieldFactor;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle = texture(uParticles, uv);
    vec4 target = texture(uTargetPositions, uv);

    float rand = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    float resetThreshold = target.y - (0.5 + rand) * uFallRange;

    float velocity = particle.w - uGravity * uDeltaTime;
    vec3 newPos = particle.xyz + vec3(0.0, velocity * uDeltaTime, 0.0);

    if (newPos.y < resetThreshold) {
        newPos = target.xyz;
        velocity = 0.0;
    }

    vec3 flowField = vec3(
        snoise(vec4(particle.xyz + 0.0, 0.0)),
        snoise(vec4(particle.xyz + 1.0, 0.0)),
        snoise(vec4(particle.xyz + 2.0, 0.0))
    );
    newPos.xyz += normalize(flowField) * uFlowFieldFactor;

    gl_FragColor = vec4(newPos, velocity);
}
        `

        this.gpgpu.particlesVariable = this.gpgpu.computation.addVariable('uParticles', gpgpuShader, baseParticlesTexture)
        this.gpgpu.computation.setVariableDependencies(this.gpgpu.particlesVariable, [this.gpgpu.particlesVariable])
        this.gpgpu.particlesVariable.material.uniforms.uTargetPositions = { value: this.targetPositionsTexture }
        this.gpgpu.particlesVariable.material.uniforms.uDeltaTime = { value: 0 }
        this.gpgpu.particlesVariable.material.uniforms.uGravity = { value: this.params.gravity }
        this.gpgpu.particlesVariable.material.uniforms.uFallRange = { value: this.params.fallRange }
        this.gpgpu.particlesVariable.material.uniforms.uFlowFieldFactor = { value: this.params.flowFieldFactor }

        this.gpgpu.computation.init()
    }

    private createGeometry() {
        this.particleUvObject = new Float32Array(this.baseGeometry.count * 2)

        for (let y = 0; y < this.gpgpu.size; y++) {
            for (let x = 0; x < this.gpgpu.size; x++) {
                const i = y * this.gpgpu.size + x
                const i2 = i * 2
                this.particleUvObject[i2 + 0] = (x + 0.5) / this.gpgpu.size
                this.particleUvObject[i2 + 1] = (y + 0.5) / this.gpgpu.size
            }
        }

        this.geometry.instance = new THREE.BufferGeometry()
        this.geometry.instance.setDrawRange(0, this.baseGeometry.count)
        this.geometry.instance.setAttribute('aParticlesUv', new THREE.BufferAttribute(this.particleUvObject, 2))
    }

    private createPoints() {
        this.points = new THREE.Points(this.geometry.instance, this.material.instance)
        this.points.frustumCulled = false
        this.scene.add(this.points)
    }

    private rebuild() {
        if (this.points) {
            this.scene.remove(this.points)
            this.points = null
        }
        this.createBaseGeometry()
        this.createGPGPU()
        this.createGeometry()
        this.createPoints()
    }

    private setupGUI() {
        const folder = this.gui.addFolder('DancingBody')

        folder.add(this.params, 'particleCount', 1000, 50000, 1000)
            .name('Count')
            .onFinishChange(() => this.rebuild())

        folder.add(this.params, 'size', 0.001, 0.05, 0.001)
            .name('Size')
            .onChange((v: number) => { this.material.instance.uniforms.uSize.value = v })

        folder.add(this.params, 'sizeRandomness', 0, 20, 0.01)
            .name('Size Randomness')
            .onChange((v: number) => { this.material.instance.uniforms.uSizeRandomness.value = v })

        folder.add(this.params, 'scatter', 0, 1, 0.01)
            .name('Scatter')

        folder.add(this.params, 'gravity', 0, 20, 0.1)
            .name('Gravity')
            .onChange((v: number) => { this.gpgpu.particlesVariable.material.uniforms.uGravity.value = v })

        folder.add(this.params, 'fallRange', 0.01, 10, 0.01)
            .name('Fall Range')
            .onChange((v: number) => { this.gpgpu.particlesVariable.material.uniforms.uFallRange.value = v })

        folder.add(this.params, 'flowFieldFactor', 0.0, 1, 0.001)
            .name('Flow Field')
            .onChange((v: number) => { this.gpgpu.particlesVariable.material.uniforms.uFlowFieldFactor.value = v })

        folder.add(this.params, 'showMesh')
            .name('Show Mesh')
            .onChange((v: boolean) => {
                this.gltf.scene.traverse((el: THREE.Object3D) => {
                    if (el instanceof THREE.SkinnedMesh) el.visible = v
                })
            })
    }

    onBPMBeat() {
        if (!this.exp.audioManager || !this.exp.bpmManager) return
    }

    update() {
        const tempPosA = new THREE.Vector3()
        const tempPosB = new THREE.Vector3()

        for (let i = 0; i < this.baseGeometry.count; i++) {
            const pair = this.particleBonePairs[i]
            pair[0].getWorldPosition(tempPosA)
            pair[1].getWorldPosition(tempPosB)

            const t = this.particleLerpT[i]
            const pos = tempPosA.clone().lerp(tempPosB, t)

            const i4 = i * 4
            const i3 = i * 3
            this.targetPositionsTexture.image.data[i4 + 0] = pos.x + this.particleScatterOffset[i3 + 0] * this.params.scatter
            this.targetPositionsTexture.image.data[i4 + 1] = pos.y + this.particleScatterOffset[i3 + 1] * this.params.scatter
            this.targetPositionsTexture.image.data[i4 + 2] = pos.z + this.particleScatterOffset[i3 + 2] * this.params.scatter
            this.targetPositionsTexture.image.data[i4 + 3] = 0
        }

        this.targetPositionsTexture.needsUpdate = true
        this.gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = this.exp.time.delta / 1000
        this.gpgpu.particlesVariable.material.uniforms.uTargetPositions.value = this.targetPositionsTexture
        this.gpgpu.computation.compute()
        this.material.instance.uniforms.uParticlesTexture.value =
            this.gpgpu.computation.getCurrentRenderTarget(this.gpgpu.particlesVariable).texture

        this.mixer.update(this.exp.time.delta * 0.000085)
    }

    setVisible(v: boolean) {
        this.gltf.scene.visible = v
        if (this.points) this.points.visible = v
    }

    leave() { }
}
