import * as THREE from "three";
import Experience from "../Experience"

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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
    private renderScene: RenderPass
    private bloomPass: UnrealBloomPass

    private params = {
        threshold: 0.07,
        strength: 2,
        radius: 0.0,
        exposure: 1
    }

    constructor(experience: Experience) {
        this.experience = experience;

        this.sizes = experience.sizes;
        this.scene = experience.scene;
        this.camera = experience.camera;

        this.setInstance();
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
        this.instance.setClearColor(0x000000, 1);
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.instance.physicallyCorrectLights = true


        // const renderScene = new RenderPass( this.experience.renderScene, this.orthographicCamera );
        // this.renderScene = new RenderPass( this.experience.scene, this.experience.camera.instance )

        // this.bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        // this.bloomPass.threshold = this.params.threshold;
        // this.bloomPass.strength = this.params.strength;
        // this.bloomPass.radius = this.params.radius;

        this.composer = new EffectComposer(this.instance);
        // this.composer.addPass( this.renderScene );
        // this.composer.addPass( this.bloomPass );





        // const bloomFolder = this.experience.gui.addFolder( 'Post Processing' );

        // bloomFolder.add( this.params, 'threshold', 0.0, 10.0 ).onChange( ( value ) => {

        //     this.bloomPass.threshold = Number( value );

        // } );

        // bloomFolder.add( this.params, 'strength', 0.0, 30.0 ).onChange( ( value ) => {

        //     this.bloomPass.strength = Number( value );

        // } );

        // bloomFolder.add( this.params, 'radius', 0.0, 10.0 ).step( 0.01 ).onChange( ( value ) => {

        //     this.bloomPass.radius = Number( value );

        // } );
        // this.experience.gui.add( this.params, 'exposure', 0.0, 10.0 ).step( 0.01 ).onChange( ( value ) => {    
        //     this.instance.toneMappingExposure  = Number( value );
        // } );



    }


    public update(): void {




        // this.instance.setRenderTarget(this.cursorTexture)
        // this.instance.render(this.experience.cursorScene, this.orthographicCamera);
        // (this.experience.renderMesh.material as THREE.ShaderMaterial).uniforms.uDisplacement.value = this.cursorTexture.texture

        // this.instance.setRenderTarget(this.sceneTexture)
        this.instance.clear()
        this.instance.render(this.experience.scene, this.camera.instance);
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
        this.composer.setSize(this.experience.sizes.width, this.experience.sizes.height);
    }
}
