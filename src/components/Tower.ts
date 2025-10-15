import Experience from "../Experience"

import * as THREE from "three"
import GUI from "lil-gui";
import { SimplexNoise } from "../utils/noise"
const getRandomBetween = (min: number, max: number) => Math.random() * (max - min) + min
export default class Tower {

    private experience: Experience;
    private gui: GUI;
    private x: number;
    private y: number;
    private z: number;
    private currentFloor = 0
    private blockCount = 0
    private noise: SimplexNoise;
    private bricksColors: Float32Array;
    private dummy = new THREE.Object3D();
    public mesh: THREE.InstancedMesh
    private geometry: THREE.BoxGeometry
    private material: THREE.MeshStandardMaterial
    private scene: THREE.Scene

    private towerParams = {
        base: 16,
        height: 56,
        noiseFactor: 0.1,
        amountOfCrumbles: 5,
        offset: 16,
        towerCount: 1,
        fogDistance: 1024,
        columns: 2
    }

    constructor(
        experience: Experience,
        towerParams: {
            base: number,
            height: number,
            //     noiseFactor?: number
            //     amountOfCrumbles?: number
        }
    ) {
        const {
            base,
            height,
            //     noiseFactor = 0.1,
            //     amountOfCrumbles = 5,
        } = towerParams

        // this.towerParams = {
        //     ...towerParams,
        //     noiseFactor,
        //     amountOfCrumbles,
        // }

        this.experience = experience
        this.gui = this.experience.helpers.GUI
        this.scene = this.experience.scene
        this.x = base
        this.y = height
        this.z = base
        this.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.material.onBeforeCompile = (shader) => {
            shader.fragmentShader = 'varying vec3 vInstanceColor;\n' + shader.fragmentShader;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `
                #include <common>
                attribute vec3 instanceColor;
                varying vec3 vInstanceColor;
                `
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vInstanceColor = instanceColor;
                `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                #include <dithering_fragment>
                gl_FragColor.rgb *= vInstanceColor;
                `
            );
        };

        /*new THREE.ShaderMaterial({
            vertexShader: `

attribute vec3 instanceColor;
varying vec3 vInstanceColor;
            void main() {
                vInstanceColor = instanceColor;

     vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

            }
    `,
            fragmentShader: `
                varying vec3 vInstanceColor;

            void main() {

                gl_FragColor = vec4(vInstanceColor, 1.0);
            }
            `,
        });*/

        this.bricksColors = new Float32Array(this.x * this.y * this.z * 3 * this.towerParams.towerCount * this.towerParams.columns)
        this.geometry = new THREE.BoxGeometry(1, 1, 1);

        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.x * this.y * this.z * this.towerParams.towerCount * this.towerParams.columns);
        this.mesh.receiveShadow = true
        this.mesh.castShadow = true
        this.noise = new SimplexNoise()

        // this.buildFloor()
        this.createTower()
        // this.geometry.setAttribute("instanceColor", new THREE.InstancedBufferAttribute(this.bricksColors, 3))

        this.createTweaks()
    }


    createTower() {

        this.blockCount = 0
        this.currentFloor = 0
        this.dummy = new THREE.Object3D();
        this.bricksColors = new Float32Array(this.x * this.y * this.z * 3 * this.towerParams.towerCount * this.towerParams.columns)
        this.geometry = new THREE.BoxGeometry(1, 1, 1);

        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.x * this.y * this.z * this.towerParams.towerCount * this.towerParams.columns);
        this.mesh.receiveShadow = true
        this.mesh.castShadow = true
        this.noise = new SimplexNoise()

        this.buildFloor()

        this.geometry.setAttribute("instanceColor", new THREE.InstancedBufferAttribute(this.bricksColors, 3))


    }

    buildFloor() {
        const offset = this.towerParams.offset * Math.random()
        for (let j = 0; j < this.towerParams.columns; j++) {
            for (let i = 0; i < this.towerParams.towerCount; i++) {
                this.noise = new SimplexNoise()
                this.createCrumbledFloor(
                    this.x,
                    j * (this.x + offset),
                    0,
                    i * (this.x + offset),
                )
            }
        }
    }


    createCrumbledFloor(splits: number, posX: number, posY: number, posZ: number) {

        const colors = [
            new THREE.Color(0xAF8F5E),
            // new THREE.Color(0x98B38A),
        ]
        const crumbleCount = Math.floor(Math.random() * this.towerParams.amountOfCrumbles) + 1


        const crumbles: { x: number, y: number, z: number, rx: number, ry: number, rz: number }[] = []


        const randomY = getRandomBetween(this.y - 10, this.y)
        for (let i = 0; i < crumbleCount; i++) {
            const isOnX = Math.random() < 0.5
            crumbles[i] = {
                x: isOnX
                    ? Math.random() < 0.5
                        ? 0
                        : this.x
                    : Math.floor(Math.random() * this.x),
                y: Math.floor(Math.random() * this.y),
                z:
                    !isOnX
                        ? Math.random() < 0.5
                            ? 0
                            : this.x
                        : Math.floor(Math.random() * this.x),

                ry: Math.floor(Math.random() * 4) + 2,
                rx: Math.floor(Math.random() * 4) + 1,
                rz: Math.floor(Math.random() * 4) + 1,
            }
        }

        for (let x = 0; x < this.x; x++) {

            for (let y = 0; y < randomY; y++) {

                for (let z = 0; z < this.z; z++) {

                    const brickColor = new THREE.Color().setHSL(0.08 + Math.random() * 0.02 * 0.5, 0.3, 0.35 + Math.random() * 0.01 * 0.5);

                    colors[Math.floor(Math.random() * colors.length)]

                    this.bricksColors[this.blockCount * 3] = brickColor.r
                    this.bricksColors[this.blockCount * 3 + 1] = brickColor.g
                    this.bricksColors[this.blockCount * 3 + 2] = brickColor.b

                    const noise = this.noise.noise3D(x * this.towerParams.noiseFactor, y * this.towerParams.noiseFactor, z * this.towerParams.noiseFactor);

                    let shouldBeRendered = true
                    for (const crumble of crumbles) {
                        const { rx, ry, rz } = crumble
                        const dx = x - crumble.x
                        const dy = y - crumble.y
                        const dz = z - crumble.z
                        if (
                            (
                                (dx * dx) / (rx * rx)
                                + (dy * dy) / (ry * ry)
                                + (dz * dz) / (rz * rz)
                            ) + noise * 0.2 < 1
                        ) {
                            shouldBeRendered = false
                        }
                    }



                    if (shouldBeRendered) {
                        this.dummy.position.set(x + posX, y, z + posZ);
                        this.dummy.scale.set(1, 1, 1)
                        this.dummy.updateMatrix();


                        this.mesh.setMatrixAt(this.blockCount, this.dummy.matrix);
                    }

                    this.blockCount++;


                }
            }
        }


    }


    createTweaks() {
        const towerFolder = this.gui.addFolder('towers');
        towerFolder.add(
            this.towerParams,
            'base',
            8, 128, 8
        ).onChange((e) => {
            this.x = e
            this.z = e

            this.dispose()
            this.createTower()
            this.addScene()
        })

        towerFolder.add(
            this.towerParams,
            'height',
            8, 128, 8
        ).onChange((e) => {
            this.y = e

            this.dispose()
            this.createTower()
            this.addScene()
        })


        towerFolder.add(
            this.towerParams,
            'noiseFactor',
            0, 0.5, 0.01
        ).onChange((e) => {

            this.dispose()
            this.createTower()
            this.addScene()
        })
        towerFolder.add(
            this.towerParams,
            'amountOfCrumbles',
            0, 100, 1
        ).onChange((e) => {

            this.dispose()
            this.createTower()
            this.addScene()
        })


        towerFolder.add(
            this.towerParams,
            'towerCount',
            0, 100, 1
        ).onChange((e) => {

            this.dispose()
            this.createTower()
            this.addScene()
        })
        towerFolder.add(
            this.towerParams,
            'offset',
            0, 100, 1
        ).onChange((e) => {

            this.dispose()
            this.createTower()
            this.addScene()
        })



    }
    addScene() {
        this.experience.scene.add(this.mesh)
    }

    dispose() {
        this.scene.remove(this.mesh);
        this.geometry.dispose()
    }

}
