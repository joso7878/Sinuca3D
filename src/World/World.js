import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Scene } from './components/Scene.js';
import { Light } from './components/Light.js';
import { Renderer } from './systems/Renderer.js';
import { Resizer } from './systems/Resizer.js';

import { createTableHybrid } from './components/Table.js';
import { Balls } from './components/BallsPhysics.js';
import { loadCue } from './components/CueFromGLB.js';

export class World {
  constructor(container){
    this.scene = Scene.create();
    this.renderer = Renderer.create();
    container.append(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 7.8, 9.3);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    const { ambientLight, directionalLight, directionalLightHelper } = Light.create();
    this.scene.add(ambientLight, directionalLight, directionalLightHelper);

    new Resizer(container, this.camera, this.renderer);

    this.init();
  }

  async init(){
    // Table (GLB or plane)
    this.table = await createTableHybrid();
    this.scene.add(this.table);
    const play = this.table.userData.playArea;
    this.camera.lookAt(0, play.y, 0);

    // Balls physics
    this.balls = new Balls(this.scene, play);
    await this.balls.loadAndCreate();

    // Cue
    this.cue = await loadCue(play.y);

    this.scene.add(this.cue);

    // Anim state
    this.state = 'idle';
    this.cueEndZ = 2.32;
    this.cueSpeed = 0.035;
    this.dt = 1/60;

    setTimeout(()=>{ this.state = 'cue_forward'; }, 1200);
  }

  render(){
    this.renderer.setAnimationLoop(()=>{
      this.controls.update();
      this.animate();
      this.renderer.render(this.scene, this.camera);
    });
  }

  animate(){
    if (!this.cue || !this.balls) return;
    // Advance cue to hit white ball, then impart velocity only once
    if (this.state === 'cue_forward'){
      if (this.cue.position.z > this.cueEndZ){
        this.cue.position.z -= this.cueSpeed;
      } else {
        // give initial velocity to cue ball toward -Z
        const cb = this.balls.balls.find(b => b.mesh === this.balls.cueBall);
        if (cb && Math.hypot(cb.vx, cb.vz) < 0.001){
          cb.vx = 0.0;
          cb.vz = -1.8; // initial speed
        }
        this.state = 'rolling';
      }
    } else if (this.state === 'rolling'){
      this.balls.step(this.dt);
      // stop when all velocities small
      const anyMoving = this.balls.balls.some(b => Math.hypot(b.vx,b.vz) > 0.02);
      if (!anyMoving) this.state = 'done';
    }
  }
}
