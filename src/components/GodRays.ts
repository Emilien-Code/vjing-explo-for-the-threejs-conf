import * as THREE from "three"
import Experience from "../Experience"
import GUI from "lil-gui";

const getRandomBetween = (min: number, max: number) => Math.random() * (max - min) + min

export default class GodRays {

    private experience: Experience;
    private gui: GUI;
    private scene: THREE.Scene
    private material: THREE.ShaderMaterial | THREE.MeshBasicMaterial | null = null
    private geometry: THREE.PlaneGeometry | null = null
    private mesh: THREE.InstancedMesh | null = null
    private dummy: THREE.Object3D | null = null

    private raysParams = {
        count: 1,
        faces: 100,
        opacity: 0.01,
        color: 0xffffff,
        x: 0,
        y: 25,
        z: 11
    }


    constructor(experience: Experience,
    ) {
        this.experience = experience
        this.gui = this.experience.helpers.GUI
        this.scene = this.experience.scene

        this.createTweaks()
    }


    createRays() {

        this.material = new THREE.MeshBasicMaterial({
            map: this.experience.ressources.items.noise,

            color: this.raysParams.color,       // teinte du rayon
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,     // important pour que les rayons se superposent bien
            opacity: this.raysParams.opacity,
            side: THREE.DoubleSide,


        });

        this.dummy = new THREE.Object3D();

        this.geometry = new THREE.PlaneGeometry(1, 1, 1);

        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.raysParams.count * this.raysParams.faces);

        let plane = 0

        for (let ray = 0; ray < this.raysParams.count; ray++) {
            for (let face = 0; face < this.raysParams.faces; face++) {

                this.dummy.position.set(
                    getRandomBetween(0, 10 * ray * 0.005),
                    getRandomBetween(0, 10 * ray * 0.01) + this.raysParams.y,
                    ray * (getRandomBetween(0, 10) + getRandomBetween(8, 12)) + getRandomBetween(0, 10) + getRandomBetween(8, 12),
                );

                this.dummy.rotation.set(
                    Math.random(),
                    Math.random(),
                    Math.random()
                );

                const scale = getRandomBetween(2, 25);
                this.dummy.scale.set(scale, scale * 2, scale);

                this.dummy.updateMatrix();
                this.mesh.setMatrixAt(plane, this.dummy.matrix);
                plane++

            }
            console.log(this.dummy.position)
        }


        console.log(plane, this.raysParams.count * this.raysParams.faces)
        this.addScene()
    }


    createTweaks() {

        const godRaysFolder = this.gui.addFolder("godrays")

        godRaysFolder.add(this.raysParams, "opacity", 0, 0.1, 0.001)
            .onChange((e: number) => this.material && (this.material.opacity = e))

        godRaysFolder.add(this.raysParams, "faces", 0, 1000, 1)
            .onChange((e: number) => {
                this.raysParams.faces = e
                this.dispose()
                this.createRays()
            })


        godRaysFolder.add(this.raysParams, "x", 0, 1000, 1)
            .onChange((e: number) => {
                this.dispose()
                this.createRays()
            })

        godRaysFolder.add(this.raysParams, "y", 0, 1000, 1)
            .onChange((e: number) => {
                this.dispose()
                this.createRays()
            })

        godRaysFolder.add(this.raysParams, "z", 0, 1000, 1)
            .onChange((e: number) => {
                this.dispose()
                this.createRays()
            })


        godRaysFolder.add(this.raysParams, "count", 0, 1000, 1)
            .onChange((e: number) => {
                this.dispose()
                this.createRays()
            })




    }

    addScene() {
        this.mesh && this.scene.add(this.mesh)
    }
    dispose() {
        if (!this.mesh || !this.geometry) return
        this.scene.remove(this.mesh);
        this.geometry.dispose()
    }
    update() {

    }
}