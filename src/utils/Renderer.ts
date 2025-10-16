import * as THREE from "three";
import Experience from "../Experience"

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SobelOperatorShader } from 'three/addons/shaders/SobelOperatorShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import SelectiveBloom from "./SelectiveBloom";

import {
    jellyFishBloom,
    rendererPalette
} from "../common/colors"
import { ClearPass } from "three/examples/jsm/Addons.js";

export default class Renderer {
    public experience: Experience;
    public sizes: { width: number; height: number };
    public scene: THREE.Scene;
    public camera: { instance: THREE.Camera };
    public instance!: THREE.WebGLRenderer;
    private cursorTexture: THREE.WebGLRenderTarget
    private sceneTexture: THREE.WebGLRenderTarget
    private orthographicCamera: THREE.OrthographicCamera;
    private composer: EffectComposer | null = null;
    public strength = 0
    public renderScene: RenderPass
    private bloomPass: UnrealBloomPass
    private effectSobel: ShaderPass
    private selectiveBloom: SelectiveBloom



    private params = {
        threshold: 0.07,
        strength: 2,
        radius: 0.0,
        exposure: 1.52,
        bloom: false,
        sobel: false
    }

    constructor(experience: Experience) {
        this.experience = experience;

        this.sizes = experience.sizes;
        this.scene = experience.scene;
        this.camera = experience.camera;


        this.setInstance();
        this.createTweaks()
    }

    public setInstance(strength = 0, r = 0, t = 0): void {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.experience.canvas,
            antialias: true,
        });

        this.instance.toneMapping = THREE.ACESFilmicToneMapping;
        this.instance.toneMappingExposure = this.params.exposure;
        this.instance.shadowMap.enabled = true;
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
        this.instance.setClearColor(rendererPalette[0], 1);
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.instance.physicallyCorrectLights = true

        this.experience.renderer = this


        this.renderScene = new RenderPass(this.experience.scene, this.experience.camera.instance/* null, new THREE.Color( 0xff00ff ), 1**/)
        this.selectiveBloom = new SelectiveBloom(this.experience, jellyFishBloom.layer)

        // this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        // this.bloomPass.enabled = this.params.bloom
        // this.bloomPass.threshold = this.params.threshold;
        // this.bloomPass.strength = this.params.strength;
        // this.bloomPass.radius = this.params.radius;


        this.composer = new EffectComposer(this.instance);
        // this.composer.addPass(new ClearPass( new THREE.Color( 0xff00ff)))
        this.composer.addPass(this.renderScene)
        this.composer.addPass(this.selectiveBloom.getMixPass);
        this.composer.addPass(this.selectiveBloom.getOutputPass);

        // this.composer.addPass(outputPass);
        console.log('yoyoyo')

        //Rendre dans une texture puis retirer les px noirs
        this.effectSobel = new ShaderPass(SobelOperatorShader);
        this.effectSobel.enabled = this.params.sobel
        this.effectSobel.uniforms['resolution'].value.x = window.innerWidth * window.devicePixelRatio;
        this.effectSobel.uniforms['resolution'].value.y = window.innerHeight * window.devicePixelRatio;
        this.composer.addPass(this.effectSobel);



    }

    createTweaks() {


        const folder = this.experience.helpers.GUI.addFolder('renderer');

        folder.add(this.params, 'threshold', 0.0, 10.0).onChange((value: number) => {

            this.bloomPass.threshold = Number(value);

        });

        folder.add(this.params, 'strength', 0.0, 30.0).onChange((value: number) => {

            this.bloomPass.strength = Number(value);

        });

        folder.add(this.params, 'radius', 0.0, 10.0).step(0.01).onChange((value: number) => {

            this.bloomPass.radius = Number(value);

        });
        folder.add(this.params, 'exposure', 0.0, 10.0).step(0.01).onChange((value: number) => {
            this.instance.toneMappingExposure = value;
        });
        folder.add(this.params, 'bloom').step(0.01).onChange((value: boolean) => {
            //this.instance.toneMappingExposure = value;
            this.bloomPass.enabled = value
            // this.setInstance()
        });
        folder.add(this.params, 'sobel').step(0.01).onChange((value: boolean) => {
            // this.instance.sobel = value;
            this.effectSobel.enabled = value
            // this.setInstance()
        });

    }


    public update(): void {


        if (this.composer) {
            this.composer.render();
            this.selectiveBloom.update()
            
            
            return
        }

        this.instance.clear()
        this.instance.render(this.experience.scene, this.camera.instance);

        // this.instance.setRenderTarget(this.cursorTexture)
        // this.instance.render(this.experience.cursorScene, this.orthographicCamera);
        // (this.experience.renderMesh.material as THREE.ShaderMaterial).uniforms.uDisplacement.value = this.cursorTexture.texture

        // this.instance.setRenderTarget(this.sceneTexture)


        // (this.experience.renderMesh.material as THREE.ShaderMaterial).uniforms.uScene.value = this.sceneTexture.texture

        // this.instance.setRenderTarget(null)
        // this.instance.clear()
        // this.instance.render(this.experience.renderScene,  this.orthographicCamera);
        // this.bloomComposer.render()

        // this.composer.render(this.scene, this.camera.instance)
        // this.instance.render()


    }

    public resize(): void {
        this.instance.setSize(this.experience.sizes.width, this.experience.sizes.height);
        this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.composer && this.composer.setSize(this.experience.sizes.width, this.experience.sizes.height);
    }
}
