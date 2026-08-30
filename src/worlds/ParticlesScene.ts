import Experience from "../Experience"
import * as THREE from "three"
import GUI from "lil-gui";
import World from "../classes/World";
import { gsap } from "gsap"
const lerp = (t, i, e) => t * (1 - e) + i * e


export default class ParticlesScene extends World {
    private exp: Experience;
    private scene: THREE.Scene
    private gui: GUI
    private material: THREE.ShaderMaterial
    private holder: THREE.Object3D
    private points: THREE.Points | null = null
    constructor(exp: Experience) {
        super();
        this.exp = exp;
        (window as any).exp = exp
        this.scene = exp.scene
        this.gui = this.exp.helpers.GUI





        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            vertexShader: `
                varying float vDistance;


            uniform float size;
            uniform float time;



            uniform float offsetSize;
            uniform float offsetGain;
            uniform float amplitude;
            uniform float frequency;
            uniform float maxDistance;





            vec3 mod289(vec3 x){
            return x-floor(x*(1./289.))*289.;
            }

            vec2 mod289(vec2 x){
            return x-floor(x*(1./289.))*289.;
            }

            vec3 permute(vec3 x){
            return mod289(((x*34.)+1.)*x);
            }

            //      Author : Ian McEwan, Ashima Arts.
            //      https://github.com/ashima/webgl-noise
            //      https://github.com/stegu/webgl-noise
            //
            float noise(vec2 v) {
            
            const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);// 1.0 / 41.0
            // First corner
            vec2 i=floor(v+dot(v,C.yy));
            vec2 x0=v-i+dot(i,C.xx);
            
            // Other corners
            vec2 i1;
            //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
            //i1.y = 1.0 - i1.x;
            i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
            // x0 = x0 - 0.0 + 0.0 * C.xx ;
            // x1 = x0 - i1 + 1.0 * C.xx ;
            // x2 = x0 - 1.0 + 2.0 * C.xx ;
            vec4 x12=x0.xyxy+C.xxzz;
            x12.xy-=i1;
            
            // Permutations
            i=mod289(i);// Avoid truncation effects in permutation
            vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))
            +i.x+vec3(0.,i1.x,1.));
            
            vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
            m=m*m;
            m=m*m;
            
            // Gradients: 41 points uniformly over a line, mapped onto a diamond.
            // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
            
            vec3 x=2.*fract(p*C.www)-1.;
            vec3 h=abs(x)-.5;
            vec3 ox=floor(x+.5);
            vec3 a0=x-ox;
            
            // Normalise gradients implicitly by scaling m
            // Approximation of: m *= inversesqrt( a0*a0 + h*h );
            m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
            
            // Compute final noise value at P
            vec3 g;
            g.x=a0.x*x0.x+h.x*x0.y;
            g.yz=a0.yz*x12.xz+h.yz*x12.yw;
            return 130.*dot(m,g);
            }

            vec3 curl(float x,float y,float z) {
            
            float eps=1.,eps2=2.*eps;
            float n1,n2,a,b;
            
            x+=time*.05;
            y+=time*.05;
            z+=time*.05;
            
            vec3 curl=vec3(0.);
            
            n1=noise(vec2(x,y+eps));
            n2=noise(vec2(x,y-eps));
            a=(n1-n2)/eps2;
            
            n1=noise(vec2(x,z+eps));
            n2=noise(vec2(x,z-eps));
            b=(n1-n2)/eps2;
            
            curl.x=a-b;
            
            n1=noise(vec2(y,z+eps));
            n2=noise(vec2(y,z-eps));
            a=(n1-n2)/eps2;
            
            n1=noise(vec2(x+eps,z));
            n2=noise(vec2(x+eps,z));
            b=(n1-n2)/eps2;
            
            curl.y=a-b;
            
            n1=noise(vec2(x+eps,y));
            n2=noise(vec2(x-eps,y));
            a=(n1-n2)/eps2;
            
            n1=noise(vec2(y+eps,z));
            n2=noise(vec2(y-eps,z));
            b=(n1-n2)/eps2;
            
            curl.z=a-b;
            
            return curl;
            }
                        
            void main() {

                vec3 newPos = position;


                vec3 newpos = position;
                vec3 target = position + (normal * .1) + curl(newpos.x * frequency, newpos.y * frequency, newpos.z * frequency) * amplitude;
                float d = length(newpos - target) / maxDistance;
                newpos = mix(position, target, pow(d, 4.));

                newpos.z += sin(time) * (.1 * offsetGain); 
                 
                vec4 mvPosition = modelViewMatrix * vec4(newpos, 1.);
                gl_PointSize = size + (pow(d,3.) * offsetSize) * (1./-mvPosition.z);
                gl_PointSize = size;
                gl_Position = projectionMatrix * mvPosition;
                vDistance = d;
            }
            `,
            fragmentShader: `
                varying float vDistance;

                uniform vec3 startColor;
                uniform vec3 endColor;

                float circle(in vec2 _st,in float _radius){
                vec2 dist=_st-vec2(.5);
                return 1.-smoothstep(_radius-(_radius*.01),
                _radius+(_radius*.01),
                dot(dist,dist)*4.);
                }

                void main(){
                float alpha=1.;
                vec2 uv = vec2(gl_PointCoord.x,1.-gl_PointCoord.y);
                vec3 circ = vec3(circle(uv,1.));

                vec3 color=vec3(1.);
                color = mix(startColor,endColor,vDistance);
                gl_FragColor=vec4(color,circ.r * vDistance);
                }
            `,
            transparent: true,
            uniforms: {
                size: { value: 2 },
                time: { value: this.exp.time.elapsedTime },

                offsetSize: { value: 2 },
                frequency: { value: 2 },
                amplitude: { value: 1 },
                offsetGain: { value: 0 },
                maxDistance: { value: 1.8 },
                startColor: { value: new THREE.Color(0xffffff) },
                endColor: { value: new THREE.Color(0xffffff) },
            },
        })





        this.holder = new THREE.Object3D()
        this.scene.add(this.holder);


        this.createPoints()
    }

    createPoints() {
        this.destroyMesh()

        if (Math.random() < 0.5) {

            this.createBox()

        } else {

            this.createCylinder()

        }
    }


    createBox() {
        const xSeg = Math.max(1, Math.floor(Math.random() * 20))
        const ySeg = Math.max(1, Math.floor(Math.random() * 40))
        const zSeg = Math.max(1, Math.floor(Math.random() * 80))

        const geometry = new THREE.BoxGeometry(1, 1, 1, xSeg, ySeg, zSeg)
        this.points = new THREE.Points(geometry, this.material)
        
        let posZ = 4 - THREE.MathUtils.randInt(9, 11) / 11

        gsap.to(this.holder.position, {
            duration: 0.6,
            z: posZ,
            ease: 'elastic.out(0.8)',
        })

        this.holder.add(this.points)
    }

    createCylinder() {
        const radialSeg = Math.floor(THREE.MathUtils.randInt(1, 3))
        const heightSeg = Math.floor(THREE.MathUtils.randInt(1, 5))
        const geometry = new THREE.CylinderGeometry(1, 1, 4, 64 * radialSeg, 64 * heightSeg, true)


        this.points = new THREE.Points(geometry, this.material)
        let posZ = 3 - THREE.MathUtils.randInt(9, 11) / 11 


        gsap.to(this.holder.position, {
            duration: 0.6,
            z: posZ,
            ease: 'elastic.out(0.8)',
        })

        this.holder.add(this.points)
    }


    destroyMesh() {

        if (this.points) {
            this.holder.remove(this.points)
            this.points.geometry?.dispose()
            if (Array.isArray(this.points.material)) {
                for (const mat of this.points.material) {
                    mat.dispose()
                }
            } else {
                this.points.material?.dispose()

            }
            this.points = null
        }
    }


    onBPMBeat() {
        if (!this.exp.audioManager) return
        if (!this.exp.bpmManager) return

        // Calculate a reduced duration based on the BPM (beats per minute) duration
        const duration = this.exp.bpmManager.getBPMDuration() / 1000
        if (this.exp.audioManager.isPlaying) {
            if (Math.random() < 0.3) {
                gsap.to(this.holder.rotation, {
                    duration: Math.random() < 0.8 ? 15 : duration, // Either a longer or BPM-synced duration
                    y: Math.random() * Math.PI * 2,
                    z: Math.random() * Math.PI,
                    ease: 'elastic.out(0.2)',
                })
            }

            if (Math.random() < 0.3) {
                this.createPoints()
            }
        }
    }
    update() {

        if (!this.exp.audioManager) return
        if (!this.exp.audioManager) return
        /**
         * Connect audio
         */
        this.material.uniforms.amplitude.value = 0.8 + THREE.MathUtils.mapLinear(this.exp.audioManager.frequencyData.high, 0, 0.6, -0.1, 0.2)

        // Update offset gain based on the low frequency data for subtle effect changes
        this.material.uniforms.offsetGain.value = this.exp.audioManager.frequencyData.mid * .6

        // Map low frequency data to a range and use it to increment the time uniform
        const t = THREE.MathUtils.mapLinear(this.exp.audioManager.frequencyData.low, 0.6, 1, 0.2, 0.5)
        this.material.uniforms.time.value += THREE.MathUtils.clamp(t, 0.2, 0.5) // Clamp the value to ensure it stays within a desired range






        // this.material.uniforms.time.value = this.exp.time.elapsedTime * 0.001

        // this.holder.rotation.y += 0.001 * Math.random();
        // this.holder.rotation.x += 0.001 * Math.random();
        // this.holder.rotation.z += 0.001 * Math.random();

    }

}
