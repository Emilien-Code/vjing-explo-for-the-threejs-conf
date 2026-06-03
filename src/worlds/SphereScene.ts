import Experience from "../Experience"
import * as THREE from "three"
import { SkeletonHelper } from "three"
import GUI from "lil-gui";
import World from "../classes/World";
import Sphere from "../components/Sphere";
import ParticleHumanDancing from "../components/ParticleHumanDancing";
import ParticleHumanDancingDamp from "../components/CentrfugalParticleHumanDancing";
import Water from "../components/Water"
import LevitatingBody from "../components/LevitatingBody";
import Squares from "../components/Squares";

export default class GlassScene extends World {

    private exp: Experience
    private scene: THREE.Scene
    private gui: GUI

    private sphere: Sphere;
    private phd: ParticleHumanDancing;
    private phdDamp!: ParticleHumanDancingDamp;
    private declare water: Water;
    private declare levitatingBody: LevitatingBody;
    private squares!: Squares;


    constructor(exp: Experience) {
        super()
        this.exp = exp
            ; (window as any).exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI


        // this.sphere = new Sphere(this.exp)
        // this.phd = new ParticleHumanDancing(this.exp)

        this.phdDamp = new ParticleHumanDancingDamp(this.exp)

        this.water = new Water(this.exp, {
            color: 0xffffff,
            speed: 0.0021,
            width: 1000,
            height: 1000,
        })

        this.water.water.rotation.x = -1.34159265358979
        this.water.water.position.y = -3.951592653589793
        this.scene.add(this.water.water)
        this.levitatingBody = new LevitatingBody(this.exp)
        this.squares = new Squares(this.exp)

        this.setupGUI()
    }

    private setupGUI() {

    }

    onBPMBeat() {
        if (!this.exp.audioManager || !this.exp.bpmManager) return


        // this.sphere.onBPMBeat()
    }

    update() {
        // this.sphere.update()
        // this.phd.update()
        this.phdDamp.update()
        this.water.update()
        this.levitatingBody.update()
        this.squares.update()
    }

    leave() {
    }
}
