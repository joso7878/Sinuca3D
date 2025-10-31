import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Balls {
  constructor(scene, playArea){
    this.scene = scene;
    this.playArea = playArea;
    this.radius = 0.12;
    this.friction = 0.992; // rolling friction
    this.restitution = 0.98; // near elastic
    this.balls = []; // {mesh, x,z,vx,vz}
  }

  async loadAndCreate(){
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('./src/World/assets/models/balls.glb');
    // find a mesh to use as template
    let template = null;
    gltf.scene.traverse(o => { if(!template && o.isMesh) template = o; });
    if (!template){
      // fallback: simple sphere
      return this._createProcedural();
    }
    // normalize scale roughly to radius
    const bbox = new THREE.Box3().setFromObject(template);
    const size = new THREE.Vector3(); bbox.getSize(size);
    const scale = (this.radius*2) / (Math.max(size.x, Math.max(size.y,size.z)) || 1);
    template = template.clone(true);
    template.scale.setScalar(scale);

    // function to spawn
    const spawn = (colorHex='#ffffff') => {
      const obj = template.clone(true);
      obj.traverse(o=>{
        if(o.isMesh){
          if (Array.isArray(o.material)) o.material.forEach(m=>m.color && m.color.set(colorHex));
          else o.material.color && o.material.color.set(colorHex);
          o.castShadow = true; o.receiveShadow = true;
        }
      });
      return obj;
    };

    // colors (representativas)
    const colors = ['#f9d208','#1a6ad6','#b11616','#6a1abf','#f26d00','#0a8a68','#7b052b','#000000',
                    '#f9d208','#1a6ad6','#b11616','#6a1abf','#f26d00','#0a8a68','#7b052b'];

    // rack triangle (5-4-3-2-1) no lado -Z
    const s = this.radius * 2.05;
    const startZ = -2.2;
    let idx = 0;
    for (let row = 5; row >=1; row--){
      const z = startZ - (5-row) * (Math.sqrt(3)/2) * s;
      const rowWidth = (row-1)*s;
      for (let i=0;i<row;i++){
        const x = -rowWidth/2 + i*s;
        const m = spawn(colors[idx % colors.length]);
        m.position.set(x, this.playArea.y + this.radius, z);
        this.scene.add(m);
        this.balls.push({ mesh:m, x, z, vx:0, vz:0 });
        idx++;
      }
    }

    // cue ball
    const cue = spawn('#ffffff');
    cue.position.set(0, this.playArea.y + this.radius, 2.2);
    this.scene.add(cue);
    this.cueBall = cue;
    this.balls.push({ mesh:cue, x:0, z:2.2, vx:0, vz:0 });
  }

  _createProcedural(){
    const geo = new THREE.SphereGeometry(this.radius, 32, 32);
    const spawn = (hex)=> new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color:hex }));
    const colors = ['#f9d208','#1a6ad6','#b11616','#6a1abf','#f26d00','#0a8a68','#7b052b','#000000',
                    '#f9d208','#1a6ad6','#b11616','#6a1abf','#f26d00','#0a8a68','#7b052b'];
    const s = this.radius * 2.05;
    const startZ = -2.2;
    let idx=0;
    for (let row=5; row>=1; row--){
      const z = startZ - (5-row)*(Math.sqrt(3)/2)*s;
      const rowWidth = (row-1)*s;
      for (let i=0;i<row;i++){
        const x = -rowWidth/2 + i*s;
        const m = spawn(colors[idx % colors.length]);
        m.position.set(x, this.playArea.y + this.radius, z);
        m.castShadow = true; m.receiveShadow = true;
        this.scene.add(m);
        this.balls.push({ mesh:m, x, z, vx:0, vz:0 });
        idx++;
      }
    }
    const cue = spawn('#ffffff');
    cue.position.set(0, this.playArea.y + this.radius, 2.2);
    cue.castShadow = true; cue.receiveShadow = true;
    this.scene.add(cue);
    this.cueBall = cue;
    this.balls.push({ mesh:cue, x:0, z:2.2, vx:0, vz:0 });
  }

  // basic 2D physics (top view) with wall and ball collisions
  step(dt){
    const r = this.radius;
    const halfX = this.playArea.length*0.5*0.95;
    const halfZ = this.playArea.width*0.5*0.95;

    // integrate + wall collision
    for (const b of this.balls){
      b.x += b.vx*dt;
      b.z += b.vz*dt;

      // walls
      if (b.x < -halfX + r){ b.x = -halfX + r; b.vx = -b.vx * this.restitution; }
      if (b.x >  halfX - r){ b.x =  halfX - r; b.vx = -b.vx * this.restitution; }
      if (b.z < -halfZ + r){ b.z = -halfZ + r; b.vz = -b.vz * this.restitution; }
      if (b.z >  halfZ - r){ b.z =  halfZ - r; b.vz = -b.vz * this.restitution; }

      // friction
      b.vx *= this.friction;
      b.vz *= this.friction;
      if (Math.hypot(b.vx, b.vz) < 0.01) { b.vx *= 0.9; b.vz *= 0.9; }
    }

    // ball-ball collisions
    for (let i=0;i<this.balls.length;i++){
      for (let j=i+1;j<this.balls.length;j++){
        const a = this.balls[i], c = this.balls[j];
        const dx = c.x - a.x, dz = c.z - a.z;
        const dist2 = dx*dx + dz*dz;
        const minDist = 2*r;
        if (dist2 > 0 && dist2 < minDist*minDist){
          const dist = Math.sqrt(dist2);
          const nx = dx/dist, nz = dz/dist;
          // separate
          const overlap = (minDist - dist)*0.5;
          a.x -= nx*overlap; a.z -= nz*overlap;
          c.x += nx*overlap; c.z += nz*overlap;
          // velocities projection (equal mass elastic)
          const va = a.vx*nx + a.vz*nz;
          const vc = c.vx*nx + c.vz*nz;
          const pa = vc, pc = va; // swap along normal
          a.vx += (pa - va)*nx * this.restitution;
          a.vz += (pa - va)*nz * this.restitution;
          c.vx += (pc - vc)*nx * this.restitution;
          c.vz += (pc - vc)*nz * this.restitution;
        }
      }
    }

    // write back to meshes
    for (const b of this.balls){
      b.mesh.position.x = b.x;
      b.mesh.position.z = b.z;
      // simple spin hint (optional)
      b.mesh.rotation.y += (b.vx + b.vz)*0.05;
    }
  }
}
