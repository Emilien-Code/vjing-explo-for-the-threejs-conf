import * as THREE from "three"
import Experience from "../Experience";
import World from "../classes/World";


export default class Ex1 extends World {
    private experience: Experience
    private scene: THREE.Scene
    constructor(experience: Experience) {
        super();
        console.log("buildingEXP1")
        this.experience = experience
        this.scene = this.experience.scene



        const group = new THREE.Group()

        /**
         * Sphere
         */

        const geometry = new THREE.SphereGeometry(15, 32, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere)

        /**
         * Cone
         */

        /**
         * Cube
         */



        this.scene.add(group)

    }


    update() {
        // console.log("update")
    }

}