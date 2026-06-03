import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui";
import World from "../classes/World";
import { gsap } from "gsap"
import { SkeletonHelper } from 'three'

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
    private material: THREE.MeshStandardMaterial
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

    private bodyColor: THREE.Vector3;
    private pmremGenerator: THREE.PMREMGenerator;
    private envmap: THREE.Texture;

    private params = {
        metalness: 1,
        roughness: 0
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


        // const helper = new SkeletonHelper(gltf.scene)
        // helper.setColors(new THREE.Color(0xff0000), new THREE.Color(0x000000))
        // this.scene.add(helper)


        /**
         * MATERIAL 
         */

        this.bodyColor = new THREE.Vector3(1.0, 1.0, 1.0)

        //Create Environement Map
        this.pmremGenerator = new THREE.PMREMGenerator(this.exp.renderer.instance)
        // this.pmremGenerator.compileEquirectangularShader()
        this.envmap = this.pmremGenerator.fromEquirectangular(this.exp.ressources.items.environementMap).texture
        this.pmremGenerator.dispose()


        //Create Material
        this.material = new THREE.MeshStandardMaterial({
            metalness: this.params.metalness,
            roughness: this.params.roughness,
        })
        this.material.envMap = this.envmap
        this.material.onBeforeCompile = (shader: any) => {

            shader.uniforms.uTime = { value: 0 }
            // shader.uniforms.uColor = {value :  new THREE.Vector3(1.0, 1.0, 1.0)}

            shader.vertexShader = `
            varying vec3 vWorldPosition;
            // vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            ` + shader.vertexShader + `
            `

            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <worldpos_vertex>`,
                `vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;`
            )


            shader.fragmentShader = `
            uniform float uTime;
            uniform vec3 uColor;
              varying vec3 vWorldPosition;

            mat4 rotationMatrix(vec3 axis, float angle) {
                axis = normalize(axis);
                float s = sin(angle);
                float c = cos(angle);
                float oc = 1.0 - c;
                
                return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                            oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                            oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                            0.0,                                0.0,                                0.0,                                1.0);
            }
            
            vec3 rotate(vec3 v, vec3 axis, float angle) {
                mat4 m = rotationMatrix(axis, angle);
                return (m * vec4(v, 1.0)).xyz;
            }
            
            ` + shader.fragmentShader;


            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <envmap_physical_pars_fragment>`,
                `
                #ifdef USE_ENVMAP

vec3 getIBLIrradiance( const in vec3 normal ) {

    #ifdef ENVMAP_TYPE_CUBE_UV

        vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

        vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );

        return PI * envMapColor.rgb * envMapIntensity;

    #else

        return vec3( 0.0 );

    #endif

}

vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

    #ifdef ENVMAP_TYPE_CUBE_UV

    vec3 fakeNormal = normalize(vWorldPosition - vec3(0.0));
// vec3 reflectVec = reflect(-viewDir, );

        vec3 reflectVec = reflect( - viewDir, fakeNormal );

        // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
        reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

        reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
        
        reflectVec = rotate(reflectVec, vec3(.0, .0, 1.0), uTime * 0.3);

        vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );


        // test purple 
        // envMapColor.r = envMapColor.r *= 86./255.;
        // envMapColor.g = envMapColor.g *= 61./255.;
        // envMapColor.b = envMapColor.b *= 191./255.;

        // test green 
        // envMapColor.r = envMapColor.r *= 17./255.;
        // envMapColor.g = envMapColor.g *= 97./255.;
        // envMapColor.b = envMapColor.b *= 76./255.;

        // test blue 
        // envMapColor.r = envMapColor.r *= 51./255.;
        // envMapColor.g = envMapColor.g *= 63./255.;
        // envMapColor.b = envMapColor.b *= 171./255.;


        //test Red 
        // envMapColor.r = envMapColor.r *= 162./255.;
        // envMapColor.g = envMapColor.g *= 0./255.;
        // envMapColor.b = envMapColor.b *= 18./255.;
        
        
        
        
        //        Interpoalted color
        envMapColor.r = envMapColor.r; //*= uColor.r;
        envMapColor.g = envMapColor.g; //*= uColor.g;
        envMapColor.b = envMapColor.b; //*= uColor.b;



        return envMapColor.rgb * envMapIntensity;

    #else

        return vec3( 0.0 );

    #endif

}

#endif
            `)

            this.material.userData = shader

        }














        /**END MATERIAL */







        this.action.timeScale = 0.00085 //hiphop_dance_rig


        model.traverse((child) => {

            if (child.isBone && child.parent?.isBone) {
                this.bonePairs.push([child.parent, child])
            }

        })


        this.holder = new THREE.Object3D()
        this.scene.add(this.holder);


        this.createPoints()
    }

    createPoints() {


        const count = 5000

        if (!this.offsets.length)
            for (let i = 0; i < count; i++) {
                this.offsets.push(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ))
            }

        if (!this.scales.length)
            for (let i = 0; i < count; i++) {
                this.scales.push(Math.random())
            }

        if (!this.range.length)
            for (let i = 0; i < count; i++) {
                this.range.push(Math.random())
            }


        const geo = new THREE.SphereGeometry(0.05, 16, 16)
        this.cubes = new THREE.InstancedMesh(geo, this.material, count)
        this.cubes.layers.enable(3)
        this.holder.add(this.cubes)

        const dummy = new THREE.Object3D()


        const tempPosA = new THREE.Vector3()
        const tempPosB = new THREE.Vector3()

        for (let i = 0; i < count; i++) {

            const pair = this.bonePairs[i % this.bonePairs.length]
            const boneA = pair[0]
            const boneB = pair[1]


            boneA.getWorldPosition(tempPosA)
            boneB.getWorldPosition(tempPosB)


            const tempPos = tempPosA.clone().lerp(tempPosB, this.range[i])

            tempPos.add(this.offsets[i])

            dummy.position.copy(tempPos)

            dummy.scale.setScalar(this.scales[i])

            dummy.updateMatrix()

            this.cubes.setMatrixAt(i, dummy.matrix)
        }

        this.cubes.instanceMatrix.needsUpdate = true


    }




    destroyMesh() {
        if (this.cubes) {
            this.holder.remove(this.cubes)
            this.cubes.geometry?.dispose()
            if (Array.isArray(this.cubes.material)) {
                for (const mat of this.cubes.material) {
                    mat.dispose()
                }
            } else {
                this.cubes.material?.dispose()

            }
            this.cubes = undefined
        }
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
        if (!this.exp.audioManager) return


        if (this.cubes) {
            // console.log(this.cubes.material.userData.uniforms.uTime.value)
            this.material.userData.uniforms.uTime.value = this.exp.time.elapsedTime / 1000

            // this.material.userData.uTime.value = this.exp.time.elapsedTime
        }

        this.mixer.update(this.exp.time.delta)
        this.holder.rotation.y += 0.01
        this.destroyMesh()
        this.createPoints()

    }

}
