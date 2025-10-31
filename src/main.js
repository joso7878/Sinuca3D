import { World } from './World/World.js';
const container = document.getElementById('scene-container');
const world = new World(container);
world.render();
