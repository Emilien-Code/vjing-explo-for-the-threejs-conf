import * as THREE from "three"
import Experience from "../Experience";
import World from "../classes/World";
import type GUI from "lil-gui";
import type Time from "../utils/Time";
// import particleFragmentShader from "../shaders/particules/fragment.glsl"
// import particleVertexShader from "../shaders/particules/vertex.glsl"

export default class Ex1 extends World {
    private experience: Experience
    private scene: THREE.Scene
    private time: Time
    private gui: GUI
    private particesCount = 1500
    private tweakParams = {
        shownParticles: 500
    }
    private bufferGeometry: THREE.BufferGeometry
    private particlesMaterial: THREE.ShaderMaterial
    constructor(experience: Experience) {
        super();

        this.experience = experience
        this.scene = this.experience.scene
        this.gui = this.experience.helpers.GUI
        this.time = this.experience.time

        this.bufferGeometry = new THREE.BufferGeometry()


        const vertices = new Float32Array(this.particesCount * 3);
        const scaleFactor = new Float32Array(this.particesCount);
        const blinkSpeed = new Float32Array(this.particesCount);
        const timeOffset = new Float32Array(this.particesCount);
        const particleIndex = new Float32Array(this.particesCount);



        let j = 0
        for (let i = 0; i < this.particesCount * 3; i += 3) {
            const x = (Math.random() - 0.5) * 10
            const y = (Math.random() - 0.5) * 10
            const z = (Math.random() - 0.5) * 10
            vertices[i] = x
            vertices[i + 1] = y
            vertices[i + 2] = z



            scaleFactor[j] = Math.random() * 200
            blinkSpeed[j] = Math.random() * 2000// using i here could give a better result 
            timeOffset[j] = Math.random() * 1000
            particleIndex[j] = j
            j+= 1

        }


        this.bufferGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        this.bufferGeometry.setAttribute('scaleFactor', new THREE.BufferAttribute(scaleFactor, 1));
        this.bufferGeometry.setAttribute('blinkSpeed', new THREE.BufferAttribute(blinkSpeed, 1));
        this.bufferGeometry.setAttribute('timeOffset', new THREE.BufferAttribute(timeOffset, 1));
        this.bufferGeometry.setAttribute('particleIndex', new THREE.BufferAttribute(particleIndex, 1));

        this.particlesMaterial = new THREE.ShaderMaterial({
            transparent: true,
            // alphaTest: .2,
            uniforms: {
                uTime: { value: this.time.elapsedTime },
                uShownValues: { value: this.tweakParams.shownParticles },
            },
            vertexShader: `
            uniform float uTime;


            attribute float scaleFactor;
            attribute float blinkSpeed;
            attribute float timeOffset;
            attribute float particleIndex;

            varying float vParticleIndex;
            
            
            void main() {

                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectedPosition = projectionMatrix * viewPosition;
                gl_Position = projectedPosition;
                
                
                vParticleIndex = particleIndex;
                
                gl_PointSize = 1. + cos(uTime/blinkSpeed + timeOffset) * scaleFactor; // cleaner to use attribute but possibility to multiply by xyz coordinates instead of using linkSpeed + timeOffset attributes

            }
            `,/**INIGO Tweet if, pikuma matrix explication playlists 3D graphics*/
            fragmentShader: `    
	        varying float vParticleIndex;
            uniform float uShownValues;

            void main() {
                // if( vParticleIndex >= uShownValues) {
                //     discard;
                // }
                float strength = distance(gl_PointCoord, vec2(0.5));
                // strength = 1.0 - strength;
                strength = step(strength, 0.5);


                // Instead of having a new condiotion, multiplying the value is better for perfs (logical mask)
                strength = strength * ( 1. - step(uShownValues, vParticleIndex) ); 
                
                if( strength <= 0. ) discard;
        
                // gl_FragColor = vec4( vec3( step(vParticleIndex, uShownValues) ), 1. );
                gl_FragColor = vec4(vec3(1.0),strength);
                // gl_FragColor = vec4( 1., 0., 1., 1. );
            }
    `
        })

        this.scene.add(new THREE.Points(this.bufferGeometry, this.particlesMaterial))

        this.createTweaks()
    }


    createTweaks() {
        this.gui.add(
            this.tweakParams,
            'shownParticles',
            0, this.particesCount, 1
        )
        .onChange(e => {
            this.particlesMaterial.uniforms.uShownValues.value = e
        })
    }

    update() {
        this.particlesMaterial.uniforms.uTime.value = this.time.elapsedTime
    }

}