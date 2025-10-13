import * as THREE from "three"
import Experience from "../Experience";
import World from "../classes/World";
import type GUI from "lil-gui";


export default class Ex1 extends World {
    private experience: Experience
    private scene: THREE.Scene
    private gui: GUI
    private tweakParams = {
        roughness: 1,
        metalness: 1,
        lightIntensity: 1
    }

    private directionalLight: THREE.DirectionalLight
    private standardMaterial: THREE.MeshStandardMaterial

    constructor(experience: Experience) {
        super();

        this.experience = experience
        this.scene = this.experience.scene
        this.gui = this.experience.helpers.GUI

        const group = new THREE.Group()
        this.standardMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: this.tweakParams.metalness,
            roughness: this.tweakParams.roughness
        });

        /**
         * Light
         */
        this.directionalLight = new THREE.DirectionalLight(0xffffff, this.tweakParams.lightIntensity);
        this.directionalLight.castShadow = true
        this.directionalLight.position.x = 10
        this.directionalLight.position.y = 10
        this.directionalLight.position.z = 10
        group.add(this.directionalLight)

        /**
         * Plane
         */
        const planeGeometry = new THREE.PlaneGeometry(30, 30);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial)
        plane.receiveShadow = true;
        plane.rotation.x = Math.PI / 2
        plane.position.y = -0.5
        group.add(plane)

        /**
         * Sphere
         */

        const sphereGeometry = new THREE.SphereGeometry(1, 32, 16);
        const sphere = new THREE.Mesh(sphereGeometry, this.standardMaterial);
        sphere.castShadow = true;
        sphere.position.x = -5
        group.add(sphere)

        /**
         * Cone
         */
        const coneGeometry = new THREE.ConeGeometry(1, 2, 32);
        const cone = new THREE.Mesh(coneGeometry, this.standardMaterial);
        cone.position.x = 5
        cone.castShadow = true
        group.add(cone)

        /**
         * Cube
        */
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const cube = new THREE.Mesh(geometry, this.standardMaterial);
        cube.castShadow = true;
        group.add(cube)


        this.scene.add(group)
        this.createTweaks()
    }


    createTweaks() {
        this.gui.add(
            this.tweakParams,
            'roughness',
            0, 1, 0.01
        )
            .onChange(e => {
                this.standardMaterial.roughness = e
            })
        this.gui.add(
            this.tweakParams,
            'metalness',
            0, 1, 0.01
        )
            .onChange(e => {
                this.standardMaterial.metalness = e
            })
        this.gui.add(
            this.tweakParams,
            'lightIntensity',
            0, 1, 0.01
        )
            .onChange(e => {
                this.directionalLight.intensity = e
            })
    }

    update() {
        // console.log(this.update)

    }

}