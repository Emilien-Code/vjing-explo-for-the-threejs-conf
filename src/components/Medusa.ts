import * as THREE from 'three'

import Experience from "../Experience"
import { SimplexNoise } from "../utils/noise"
import type { SimplexNoise } from 'three/examples/jsm/Addons.js';
import type Time from '../utils/Time';
import { velocity } from 'three/tsl';
import type GUI from 'lil-gui';
export type MedusaParamsType = {
    noiseFactor: number;
    amountOfMedusa: number;

}
export default class Medusa {

    private experience: Experience
    private scene: THREE.Scene
    private time: Time


    private geometry: THREE.SphereGeometry
    private material: THREE.MeshBasicMaterial
    private mesh: THREE.Mesh
    private gui: GUI

    private noise: SimplexNoise
    private medusas: {
        velocity: number
        amplitudes: {
            x: number
            y: number
            z: number
        }
        mesh: THREE.Mesh
    }[] = []
    private medusaGroup: THREE.Group
    private medusaParams: MedusaParamsType


    constructor(experience: Experience, medusaParams: MedusaParamsType) {

        this.experience = experience
        this.medusaParams = medusaParams

        this.scene = this.experience.scene
        this.time = this.experience.time


        this.gui = this.experience.helpers.GUI

        this.material = new THREE.MeshBasicMaterial({ color: "purple" })
        this.geometry = new THREE.SphereGeometry(1, 32, 16)
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.medusaGroup = new THREE.Group()


        this.createTweaks()
        this.addScene()
    }

    createMedusas() {
        this.medusaGroup = new THREE.Group()

        this.noise = new SimplexNoise()

        for (let i = 0; i < this.medusaParams.amountOfMedusa; i++) {
            this.medusas[i] = {
                velocity: Math.random() * 0.01,
                amplitudes: {
                    x: Math.random() * 0.5,
                    y: Math.random() * 0.5,
                    z: Math.random() * 0.5,
                },
                mesh: this.mesh.clone()
            }
            const noise = this.noise.noise3D(
                Math.random() * 128 * this.medusaParams.noiseFactor,
                Math.random() * 128 * this.medusaParams.noiseFactor,
                Math.random() * 128 * this.medusaParams.noiseFactor
            );


            this.medusas[i].mesh.position.x = Math.random() * 128 - (128 * 0.25)
            this.medusas[i].mesh.position.y = Math.random() * 128 - (128 * 0.25)
            this.medusas[i].mesh.position.z = Math.random() * 128 - (128 * 0.25)





            this.medusaGroup.add(this.medusas[i].mesh)
            this.addScene()
        }
    }

    createTweaks() {
        const medusaFolder = this.gui.addFolder('medusa');
        medusaFolder.add(
            this.medusaParams,
            'noiseFactor',
            0, 0.5, 0.01
        ).onChange((e) => {

            this.dispose()
            this.createMedusas()

        })
        medusaFolder.add(
            this.medusaParams,
            "amountOfMedusa",
            0, 100, 1
        ).onChange((e) => {
            this.dispose()
            this.createMedusas()
        })
    }

    addScene() {
        this.scene.add(this.medusaGroup)
    }

    dispose() {
        this.scene.remove(this.medusaGroup);
        // this.geometry.dispose()
    }
    
    update() {
        for (const medusa of this.medusas) {
            if (medusa) {
                medusa.mesh.position.x += Math.cos(this.time.elapsedTime * medusa.velocity) * medusa.amplitudes.x
                medusa.mesh.position.y += Math.sin(this.time.elapsedTime * medusa.velocity) * medusa.amplitudes.y
                medusa.mesh.position.z += Math.cos(this.time.elapsedTime * medusa.velocity) * medusa.amplitudes.z
            }
        }
    }
}