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
export type cloudParamsType = {
    x: number, y: number, z: number,
    clouds: number,
    yAmplitude: number,
    cloudOpacity: number,
    scaleFactor: number,
    blending?: THREE.Blending,
    scaleAspect?: number,
    spreadX?: number,
    spreadZ?: number,
    textureKey?: string,
}


export default class Clouds {

    private experience: Experience;
    private gui: GUI;
    private scene: THREE.Scene
    private material: THREE.ShaderMaterial | THREE.MeshBasicMaterial | null = null
    private geometry: THREE.PlaneGeometry | null = null
    private mesh: THREE.InstancedMesh | null = null
    private dummy: THREE.Object3D | null = null
    private visible: boolean = true

    private guiFolder!: GUI

    private cloudParams: cloudParamsType = {
        scaleFactor: 10,
        clouds: 5000,
        yAmplitude: 20,
        cloudOpacity: 0.025,
        x: 0,
        y: 0,
        z: -100,
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
        const {
            blending = THREE.NormalBlending,
            scaleAspect = 1,
            spreadX,
            spreadZ = 1000,
            textureKey = 'cloud',
        } = this.cloudParams

        const texture = this.experience.ressources.items[textureKey]

        this.material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending,
            opacity: this.cloudParams.cloudOpacity,
        })

        if (blending === THREE.AdditiveBlending) {
            this.material.onBeforeCompile = (shader) => {
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    `
                    #include <begin_vertex>
                    vec4 wp = instanceMatrix * vec4(transformed, 1.0);
                    float dist = distance(wp.xyz, cameraPosition.xyz);
                    float radius = 120.;
                    float areaFactor = 0.25;
                    float diff = radius * (1. - areaFactor);
                    float scale = dist < radius
                        ? (dist > diff ? 1. - (dist - diff) / (radius - diff) : 1.)
                        : 0.;
                    transformed *= scale;
                    `
                )
            }
        }

        this.dummy = new THREE.Object3D()
        this.geometry = new THREE.PlaneGeometry(1, 1, 1)
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.cloudParams.clouds)
        this.mesh.position.set(this.cloudParams.x, this.cloudParams.y, this.cloudParams.z)

        for (let i = 0; i < this.cloudParams.clouds; i++) {
            const xRange = spreadX ?? 32
            const px = spreadX !== undefined
                ? getRandomBetween(-xRange, xRange)
                : getRandomBetween(0, xRange)

            this.dummy.position.set(
                px,
                getRandomBetween(-this.cloudParams.yAmplitude, this.cloudParams.yAmplitude),
                getRandomBetween(0, spreadZ)
            )

            this.dummy.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            )

            const scale = getRandomBetween(2, this.cloudParams.scaleFactor)
            this.dummy.scale.set(scale, scale * scaleAspect, scale)
            this.dummy.updateMatrix()
            this.mesh.setMatrixAt(i, this.dummy.matrix)
        }

        this.addScene()
    }

    createTweaks() {

        const towerFolder = this.guiFolder = this.gui.addFolder('clouds');
        towerFolder.add(
            this.cloudParams,
            'clouds',
            0, 100000, 1
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
            -100, 100, 1
        ).onChange((e: number) => {
            this.mesh && (this.mesh.position.x = e)
        })
        towerFolder.add(
            this.cloudParams,
            'y',
            -100, 100, 1
        ).onChange((e: number) => {
            this.mesh && (this.mesh.position.y = e)
        })
        towerFolder.add(
            this.cloudParams,
            'z',
            -300, 100, 1
        ).onChange((e: number) => {
            this.mesh && (this.mesh.position.z = e)
        })
        towerFolder.close()
    }
    setVisible(v: boolean) {
        this.visible = v
        this.mesh && (this.mesh.visible = v)
        this.mesh && (this.mesh.material.opacity = v ? this.cloudParams.cloudOpacity : 0)
    }

    showGUI(v: boolean) {
        v ? this.guiFolder.show() : this.guiFolder.hide()
    }

    update() {
        if (!this.experience.camera.instance) return
        if (!this.mesh) return

        this.mesh.position.x += Math.sin(this.experience.time.elapsedTime * 0.00005) * 0.001
        this.mesh.position.y += Math.cos(this.experience.time.elapsedTime * 0.00005) * 0.01
        // this.mesh.position.z += Math.cos(this.experience.time.elapsedTime * 0.00005) * 0.01
    }
    addScene() {
        if (!this.mesh) return
        this.mesh.visible = this.visible
        this.experience.scene.add(this.mesh)
        this.mesh.position.z = this.cloudParams.z
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
