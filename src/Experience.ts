import * as THREE from "three"

import Renderer from "./utils/Renderer";
import Camera from "./utils/Camera";
import Sizes from "./utils/Sizes";
import Time from "./utils/Time";
import World from "./classes/World";
import Helpers from "./utils/Helpers";

export default class Experience {

    public canvas: HTMLCanvasElement;
    public isReady: boolean = false;
    public sizes: Sizes;
    public time: Time;

    public scene: THREE.Scene;
    public camera: Camera;
    public renderer: Renderer;
    private helpers: Helpers

    public world: World | null = null; // use the genera Page class type

    constructor(canvas: HTMLCanvasElement) {

        this.canvas = canvas;
        this.isReady = true;

        this.scene = new THREE.Scene();

        this.sizes = new Sizes();
        this.time = new Time();
        this.camera = new Camera(this);
        this.renderer = new Renderer(this);
        this.helpers = new Helpers();




        this.sizes.on("resize", () => this.resize());
        this.time.on("tick", () => this.update());
        this.time.tick()
    }

    public resize(): void {
        this.camera.resize();
        this.renderer.resize();
        if (this.world) this.world.resize();
        this.sizes.viewWidth = Math.tan(this.camera.instance.fov * Math.PI / 180 / 2) * this.camera.instance.position.z * this.sizes.aspectRatio * 2;
        this.sizes.viewHeight = Math.tan(this.camera.instance.fov * Math.PI / 180 / 2) * this.camera.instance.position.z * 2;
    }
    public update(): void {
        if (this.isReady) {
            this.camera.update();
            this.renderer.update();
            this.world?.update();
        }
    }
}


document.querySelector('canvas')
const app = new Experience(document.querySelector('canvas') as HTMLCanvasElement)