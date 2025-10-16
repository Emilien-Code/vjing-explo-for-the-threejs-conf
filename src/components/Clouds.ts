import Experience from "../Experience"

import * as THREE from "three"
import GUI from "lil-gui";

const getRandomBetween = (min: number, max: number) => Math.random() * (max - min) + min
const cloudShader = {
    vertexShader:
        `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
    fragmentShader:
        `
        uniform sampler2D map;

        varying vec2 vUv;
    
        void main() {
    
        //   float depth = gl_FragCoord.z / gl_FragCoord.w;
        //   float fogFactor = smoothstep( fogNear, fogFar, depth );
    
          gl_FragColor = texture2D( map, vUv );
        //   gl_FragColor.w *= pow( gl_FragCoord.z, 20.0 );
        //   gl_FragColor = mix( gl_FragColor, vec4( fogColor , gl_FragColor.w ), fogFactor );
    
        }
      `
}
export type cloudParamsType = { x: number, y: number, z: number, clouds: number, yAmplitude: number, cloudOpacity: number, scaleFactor: number }


export default class Clouds {

    private experience: Experience;
    private gui: GUI;
    private scene: THREE.Scene
    private material: THREE.ShaderMaterial | THREE.MeshBasicMaterial | null = null
    private geometry: THREE.PlaneGeometry | null = null
    private mesh: THREE.InstancedMesh | null = null
    private dummy: THREE.Object3D | null = null

    private cloudParams: cloudParamsType = {
            scaleFactor: 10,
            clouds: 5000,
            yAmplitude: 20,
            cloudOpacity: 0.2,
            x: 0,
            y: 0,
            z: 0,
        }

    constructor(
        experience: Experience,
        cloudParams: Omit<cloudParamsType, scaleFactor>
    ) {
        this.cloudParams = {
            ...this.cloudParams,
            ...cloudParams
        }



        this.experience = experience
        this.gui = this.experience.helpers.GUI
        this.scene = this.experience.scene


        this.createTweaks()
    }

    createClouds() {

        // this.material = new THREE.ShaderMaterial({

        //     uniforms: {

        //         map: { value: this.experience.ressources.items.cloud },


        //         // "fogColor": { type: "c", value: fog.color },
        //         // "fogNear": { type: "f", value: fog.near },
        //         // "fogFar": { type: "f", value: fog.far },

        //     },
        //     vertexShader: cloudShader.vertexShader,
        //     fragmentShader: cloudShader.fragmentShader,
        //     depthWrite: false,
        //     depthTest: false,
        //     transparent: true,
        //     side: THREE.DoubleSide
        // });


        this.material = new THREE.MeshBasicMaterial({
            map: this.experience.ressources.items.cloud,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            opacity: this.cloudParams.cloudOpacity
        });
        // this.material.onBeforeCompile = (shader) => {
        //     shader.fragmentShader = shader.fragmentShader.replace(
        //         '#include <dithering_fragment>',//Target ou ce sera appliqué. targetter ailleurs pour que le fog soit quand même calculé (avant sans doute)
        //         `
        //         #include <dithering_fragment>
        //         gl_FragColor.rgb *= vInstanceColor;// Conflit avec le fog car * la valeur du fog
        //         `
        //     );

        // }

        this.dummy = new THREE.Object3D();

        this.geometry = new THREE.PlaneGeometry(1, 1, 1);

        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.cloudParams.clouds);
        this.mesh.position.x = this.cloudParams.x
        this.mesh.position.y = this.cloudParams.y
        this.mesh.position.z = this.cloudParams.z

        for (let i = 0; i < this.cloudParams.clouds; i++) {

            this.dummy.position.set(
                getRandomBetween(0, 50),
                getRandomBetween(0, this.cloudParams.yAmplitude),
                getRandomBetween(0, 100)
            );

            this.dummy.rotation.set(
                0,
                Math.random() * Math.PI * 2,
                0
            );

            const scale = getRandomBetween(2, this.cloudParams.scaleFactor);

            this.dummy.scale.set(scale, scale, scale);
            this.dummy.updateMatrix();

            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }

        // this.mesh.instanceMatrix.needsUpdate = true



        this.addScene()
    }

    createTweaks() {

        const towerFolder = this.gui.addFolder('clouds');
        towerFolder.add(
            this.cloudParams,
            'clouds',
            0, 10000, 1
        ).onChange((e: number) => {
            this.dispose()
            this.createClouds()
            this.addScene()
        })

        towerFolder.add(
            this.cloudParams,
            'scaleFactor',
            1, 10, 1
        ).onChange((e: number) => {

            this.dispose()
            this.createClouds()
            this.addScene()
        })

        towerFolder.add(
            this.cloudParams,
            'yAmplitude',
            1, 100, 1
        ).onChange((e: number) => {

            this.dispose()
            this.createClouds()
            this.addScene()
        })
        towerFolder.add(
            this.cloudParams,
            'cloudOpacity',
            0, 1, 0.01
        ).onChange((e: number) => {
            this.material && (this.material.opacity = e)
        })


        towerFolder.add(
            this.cloudParams,
            'x',
            1, 100, 1
        ).onChange((e: number) => {
            this.mesh && (this.mesh.position.x = e)
        })
        towerFolder.add(
            this.cloudParams,
            'y',
            1, 100, 1
        ).onChange((e: number) => {
            this.mesh && (this.mesh.position.y = e)
        })
        towerFolder.add(
            this.cloudParams,
            'z',
            -100, 100, 1
        ).onChange((e: number) => {
            this.mesh && (this.mesh.position.z = e)
        })
    }
    update() {
        if (!this.experience.camera.instance) return
    }
    addScene() {
        this.mesh && this.experience.scene.add(this.mesh)
    }
    setPosition(x: number, y: number, z: number) {
        if (!this.mesh) return

        this.cloudParams.x = x
        this.cloudParams.y = y
        this.cloudParams.z = z
        this.mesh.position.x = x
        this.mesh.position.y = y
        this.mesh.position.z = z
    }

    dispose() {
        this.mesh && this.scene.remove(this.mesh);
        this.geometry && this.geometry.dispose()
    }

}
