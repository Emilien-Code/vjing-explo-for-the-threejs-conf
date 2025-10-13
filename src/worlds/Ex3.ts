import * as THREE from "three"
import Experience from "../Experience";
import World from "../classes/World";
import type GUI from "lil-gui";
import type Time from "../utils/Time";
// import particleFragmentShader from "../shaders/particules/fragment.glsl"
// import particleVertexShader from "../shaders/particules/vertex.glsl"
import simplex3D from "../shaders/simplex3D";

export default class Ex1 extends World {
    private experience: Experience
    private scene: THREE.Scene
    private time: Time
    private gui: GUI
    private tweakParams = {
        noiseFactor: 0.2,
        amplitude: 2,
        segments: 8,
    }
    private sphereGeometry: THREE.SphereGeometry
    private particlesMaterial: THREE.ShaderMaterial
    private mesh: THREE.Mesh



    constructor(experience: Experience) {
        super();

        this.experience = experience
        this.scene = this.experience.scene
        this.gui = this.experience.helpers.GUI
        this.time = this.experience.time

        this.sphereGeometry = new THREE.SphereGeometry(2, this.tweakParams.segments, this.tweakParams.segments)



        this.particlesMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: this.time.elapsedTime },
                uNoiseFactor: { value: this.tweakParams.noiseFactor },
                uAmplitude: { value: this.tweakParams.amplitude },
            },
            vertexShader: `
            uniform float uTime;
            uniform float uNoiseFactor;
            uniform float uAmplitude;

            varying vec3 vNormal;

            ${simplex3D}
            
            void main() {

    
               
                float noiseFactor = uNoiseFactor;
                float noise = snoise(position.xyz * noiseFactor + uTime * 0.00025);

                vec3 newPos = position;
                newPos.x = position.x + normal.x * noise * uAmplitude;
                newPos.y = position.y + normal.y * noise * uAmplitude;
                newPos.z = position.z + normal.z * noise * uAmplitude;
               

                vec4 modelPosition = modelMatrix * vec4(newPos, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectedPosition = projectionMatrix * viewPosition;


                gl_Position = projectedPosition;
                vNormal = normal;
            }
            `,/**INIGO Tweet if, pikuma matrix explication playlists 3D graphics*/
            fragmentShader: `    
            varying vec3 vNormal;

            void main() {
                gl_FragColor = vec4(vNormal,1.0);
            }
    `
        })
        this.mesh = new THREE.Mesh(this.sphereGeometry, this.particlesMaterial)
        this.scene.add(this.mesh)
        this.createTweaks()
    }


    createTweaks() {
        this.gui.add(
            this.tweakParams,
            'noiseFactor',
            0, 10, 0.001
        )
            .onChange(e => {
                this.particlesMaterial.uniforms.uNoiseFactor.value = e
            })
        this.gui.add(
            this.tweakParams,
            'amplitude',
            0, 10, 0.01
        )
            .onChange(e => {
                this.particlesMaterial.uniforms.uAmplitude.value = e
            })
        this.gui.add(
            this.tweakParams,
            'segments',
            0, 100, 1
        )
            .onChange(e => {
                this.scene.remove(this.mesh);
                this.sphereGeometry.dispose();

                // We create a new geometry
                this.sphereGeometry = new THREE.SphereGeometry(0.5, e, e);

                // Create new mesh with same material (it doesn't need to be recreated)
                this.mesh = new THREE.Mesh(this.sphereGeometry, this.particlesMaterial);
                this.scene.add(this.mesh);
            })
    }

    update() {
        this.particlesMaterial.uniforms.uTime.value = this.time.elapsedTime
    }

}