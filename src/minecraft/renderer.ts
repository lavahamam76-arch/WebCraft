import * as THREE from 'three';
import { VoxelWorld, BlockId } from './world';
import { getThreeTexture, breakStageTextures } from './textures';
import { MobEntityData, RemotePlayerData } from '../types/minecraft';

export class MinecraftRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  // Lighting & Sky
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private skyMesh: THREE.Mesh;

  // Block Meshes
  private blockMeshes: Map<BlockId, THREE.InstancedMesh> = new Map();
  private blockMaterials: Map<BlockId, THREE.Material | THREE.Material[]> = new Map();
  private boxGeometry: THREE.BoxGeometry;

  // Selection & Breaking Overlays
  private targetBox: THREE.LineSegments;
  private breakMesh: THREE.Mesh;

  // First-person hand and held item
  private handGroup: THREE.Group;
  private heldItemMesh: THREE.Mesh | null = null;
  private swingProgress: number = 0;
  private isSwinging: boolean = false;
  private bobTimer: number = 0;

  // Mobs & Remote Players
  private mobGroups: Map<string, THREE.Group> = new Map();
  private playerGroups: Map<string, THREE.Group> = new Map();

  constructor(container: HTMLElement, fov = 70) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x78a7ff); // Classic Minecraft blue sky
    this.scene.fog = new THREE.Fog(0x78a7ff, 35, 65);

    this.camera = new THREE.PerspectiveCamera(
      fov,
      container.clientWidth / container.clientHeight,
      0.05,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Geometry for standard 1x1x1 cube
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Setup Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7e6, 0.9);
    this.sunLight.position.set(20, 50, 20);
    this.scene.add(this.sunLight);

    // Simple skybox
    const skyGeo = new THREE.BoxGeometry(800, 800, 800);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x78a7ff, side: THREE.BackSide });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    // Selection wireframe box
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    this.targetBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    this.targetBox.visible = false;
    this.scene.add(this.targetBox);

    // Break crack overlay box
    const breakMat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.breakMesh = new THREE.Mesh(new THREE.BoxGeometry(1.004, 1.004, 1.004), breakMat);
    this.breakMesh.visible = false;
    this.scene.add(this.breakMesh);

    // Setup First Person Hand
    this.handGroup = new THREE.Group();
    this.camera.add(this.handGroup);
    this.scene.add(this.camera);

    this.initHand();
    this.initMaterials();

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private initMaterials() {
    // Helper to make textured standard material
    const makeMat = (texName: string, transparent = false) => {
      const tex = getThreeTexture(texName);
      return new THREE.MeshLambertMaterial({
        map: tex,
        transparent,
        alphaTest: transparent ? 0.1 : 0,
      });
    };

    // Grass block has top, bottom, and 4 sides
    const grassTop = makeMat('grass_top');
    const grassSide = makeMat('grass_side');
    const dirt = makeMat('dirt');
    const grassMats = [grassSide, grassSide, grassTop, dirt, grassSide, grassSide];
    this.blockMaterials.set('grass_block', grassMats);

    // Oak log has sides and top/bottom rings
    const logSide = makeMat('oak_log_side');
    const logTop = makeMat('oak_log_top');
    const logMats = [logSide, logSide, logTop, logTop, logSide, logSide];
    this.blockMaterials.set('oak_log', logMats);

    // Other blocks use uniform 6 sides
    this.blockMaterials.set('dirt', dirt);
    this.blockMaterials.set('stone', makeMat('stone'));
    this.blockMaterials.set('cobblestone', makeMat('cobblestone'));
    this.blockMaterials.set('oak_planks', makeMat('oak_planks'));
    this.blockMaterials.set('oak_leaves', makeMat('oak_leaves', true));
    this.blockMaterials.set('diamond_ore', makeMat('diamond_ore'));
    this.blockMaterials.set('gold_ore', makeMat('gold_ore'));
    this.blockMaterials.set('iron_ore', makeMat('iron_ore'));
    this.blockMaterials.set('coal_ore', makeMat('coal_ore'));
    this.blockMaterials.set('bedrock', makeMat('bedrock'));
    this.blockMaterials.set('sand', makeMat('sand'));
    this.blockMaterials.set('water', makeMat('water', true));
    this.blockMaterials.set('glass', makeMat('glass', true));
    this.blockMaterials.set('crafting_table', makeMat('crafting_table'));
    this.blockMaterials.set('furnace', makeMat('furnace'));
    this.blockMaterials.set('tnt', makeMat('tnt'));
    this.blockMaterials.set('obsidian', makeMat('obsidian'));
    this.blockMaterials.set('glowstone', makeMat('glowstone'));
    this.blockMaterials.set('bricks', makeMat('bricks'));
  }

  // Build / update instanced meshes from VoxelWorld
  public buildWorldMesh(world: VoxelWorld) {
    // Clear old instanced meshes
    for (const mesh of this.blockMeshes.values()) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    this.blockMeshes.clear();

    const allBlocks = world.getAllBlocks();

    // Group blocks by type
    const grouped: Record<string, Array<{ x: number; y: number; z: number }>> = {};
    for (const b of allBlocks) {
      if (b.type === 'air') continue;
      if (!grouped[b.type]) grouped[b.type] = [];
      grouped[b.type].push({ x: b.x, y: b.y, z: b.z });
    }

    const dummy = new THREE.Object3D();

    for (const [typeStr, positions] of Object.entries(grouped)) {
      const type = typeStr as BlockId;
      const mat = this.blockMaterials.get(type);
      if (!mat) continue;

      const instanced = new THREE.InstancedMesh(this.boxGeometry, mat, positions.length);
      instanced.castShadow = true;
      instanced.receiveShadow = true;

      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        dummy.position.set(p.x + 0.5, p.y + 0.5, p.z + 0.5);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
      }
      instanced.instanceMatrix.needsUpdate = true;
      this.scene.add(instanced);
      this.blockMeshes.set(type, instanced);
    }
  }

  // Setup First-Person Player Hand
  private initHand() {
    this.handGroup.position.set(0.35, -0.32, -0.5);
    this.handGroup.rotation.set(0.1, -0.2, 0);

    // Player arm (Steve skin)
    const armGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
    const armMat = new THREE.MeshLambertMaterial({ color: 0xbfa088 }); // Steve skin tone
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.set(0, 0, 0);
    this.handGroup.add(armMesh);

    this.setHeldItem('diamond_sword');
  }

  public setHeldItem(itemId: string) {
    if (this.heldItemMesh) {
      this.handGroup.remove(this.heldItemMesh);
      this.heldItemMesh.geometry.dispose();
      this.heldItemMesh = null;
    }

    if (itemId.includes('sword') || itemId.includes('pickaxe')) {
      const toolGeo = new THREE.BoxGeometry(0.04, 0.45, 0.04);
      const col = itemId.includes('diamond') ? 0x4dedf0 : 0x858585;
      const toolMat = new THREE.MeshLambertMaterial({ color: col });
      this.heldItemMesh = new THREE.Mesh(toolGeo, toolMat);
      this.heldItemMesh.position.set(0, 0.22, -0.05);
      this.heldItemMesh.rotation.set(-0.3, 0, 0.4);
      this.handGroup.add(this.heldItemMesh);
    } else if (itemId !== 'air' && itemId !== 'none') {
      // Mini held block
      const blockMat = this.blockMaterials.get(itemId as BlockId) || new THREE.MeshLambertMaterial({ color: 0x866043 });
      const miniGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      this.heldItemMesh = new THREE.Mesh(miniGeo, blockMat);
      this.heldItemMesh.position.set(0, 0.2, -0.05);
      this.heldItemMesh.rotation.set(0.2, 0.4, 0);
      this.handGroup.add(this.heldItemMesh);
    }
  }

  public triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  // Update selection outline
  public updateTargetBox(pos: { x: number; y: number; z: number } | null) {
    if (!pos) {
      this.targetBox.visible = false;
      return;
    }
    this.targetBox.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
    this.targetBox.visible = true;
  }

  // Update break crack stage
  public updateBreakStage(pos: { x: number; y: number; z: number } | null, stage: number) {
    if (!pos || stage < 0 || stage > 9) {
      this.breakMesh.visible = false;
      return;
    }
    this.breakMesh.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
    const mat = this.breakMesh.material as THREE.MeshBasicMaterial;
    mat.map = breakStageTextures[stage];
    mat.needsUpdate = true;
    this.breakMesh.visible = true;
  }

  // Render mobs (Pigs, Cows, Zombies, Skeletons)
  public updateMobs(mobs: MobEntityData[]) {
    const existingIds = new Set(mobs.map((m) => m.id));

    // Remove despawned mobs
    for (const [id, grp] of this.mobGroups.entries()) {
      if (!existingIds.has(id)) {
        this.scene.remove(grp);
        this.mobGroups.delete(id);
      }
    }

    for (const mob of mobs) {
      let grp = this.mobGroups.get(mob.id);
      if (!grp) {
        grp = this.createMobMesh(mob.type);
        this.scene.add(grp);
        this.mobGroups.set(mob.id, grp);
      }

      // Smooth position interpolation
      grp.position.lerp(new THREE.Vector3(mob.x + 0.5, mob.y, mob.z + 0.5), 0.2);
      grp.rotation.y = mob.yaw;
    }
  }

  private createMobMesh(type: 'pig' | 'cow' | 'zombie' | 'skeleton'): THREE.Group {
    const grp = new THREE.Group();

    if (type === 'pig') {
      const pink = new THREE.MeshLambertMaterial({ color: 0xf0a0a0 });
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.9), pink);
      body.position.set(0, 0.5, 0);
      grp.add(body);
      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), pink);
      head.position.set(0, 0.7, 0.6);
      grp.add(head);
      // Snout
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.15), new THREE.MeshLambertMaterial({ color: 0xdf8080 }));
      snout.position.set(0, 0.65, 0.9);
      grp.add(snout);
      // 4 Legs
      for (const [lx, lz] of [[-0.25, -0.3], [0.25, -0.3], [-0.25, 0.3], [0.25, 0.3]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), pink);
        leg.position.set(lx, 0.2, lz);
        grp.add(leg);
      }
    } else if (type === 'cow') {
      const hide = new THREE.MeshLambertMaterial({ color: 0x4a3220 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.1), hide);
      body.position.set(0, 0.7, 0);
      grp.add(body);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), hide);
      head.position.set(0, 1.0, 0.7);
      grp.add(head);
      // Horns
      for (const hx of [-0.3, 0.3]) {
        const horn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
        horn.position.set(hx, 1.3, 0.7);
        grp.add(horn);
      }
      for (const [lx, lz] of [[-0.3, -0.35], [0.3, -0.35], [-0.3, 0.35], [0.3, 0.35]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), hide);
        leg.position.set(lx, 0.25, lz);
        grp.add(leg);
      }
    } else if (type === 'zombie') {
      // Zombie
      const skin = new THREE.MeshLambertMaterial({ color: 0x497536 });
      const shirt = new THREE.MeshLambertMaterial({ color: 0x2e6b7d });
      const pants = new THREE.MeshLambertMaterial({ color: 0x2f357b });

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skin);
      head.position.set(0, 1.6, 0);
      grp.add(head);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), shirt);
      torso.position.set(0, 1.05, 0);
      grp.add(torso);

      // Outstretched arms
      for (const ax of [-0.35, 0.35]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), skin);
        arm.position.set(ax, 1.25, 0.3);
        grp.add(arm);
      }

      for (const lx of [-0.15, 0.15]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), pants);
        leg.position.set(lx, 0.35, 0);
        grp.add(leg);
      }
    } else {
      // Skeleton
      const bone = new THREE.MeshLambertMaterial({ color: 0xc8c8c8 });
      const skull = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), bone);
      skull.position.set(0, 1.6, 0);
      grp.add(skull);

      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.2), bone);
      rib.position.set(0, 1.05, 0);
      grp.add(rib);

      for (const lx of [-0.12, 0.12]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), bone);
        leg.position.set(lx, 0.35, 0);
        grp.add(leg);
      }
    }

    return grp;
  }

  // Create Nametag sprite above player's head
  private createNametagSprite(username: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Black semi-transparent background box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.roundRect(16, 12, 224, 40, 8);
    ctx.fill();

    // White Minecraft text with shadow
    ctx.font = 'bold 26px Silkscreen, "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#3f3f3f';
    ctx.fillText(username, 130, 34);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(username, 128, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.4, 0.35, 1);
    sprite.position.set(0, 2.2, 0);
    return sprite;
  }

  // Render remote connected players
  public updateRemotePlayers(players: RemotePlayerData[]) {
    const existingIds = new Set(players.map((p) => p.id));

    // Remove disconnected players
    for (const [id, grp] of this.playerGroups.entries()) {
      if (!existingIds.has(id)) {
        this.scene.remove(grp);
        this.playerGroups.delete(id);
      }
    }

    for (const p of players) {
      let grp = this.playerGroups.get(p.id);
      if (!grp) {
        grp = this.createPlayerModel(p.username, p.skin);
        this.scene.add(grp);
        this.playerGroups.set(p.id, grp);
      }

      // Smooth position interpolation
      grp.position.lerp(new THREE.Vector3(p.x, p.y, p.z), 0.3);
      grp.rotation.y = p.yaw;
    }
  }

  private createPlayerModel(username: string, skin: string): THREE.Group {
    const grp = new THREE.Group();

    const skinCol = skin === 'alex' ? 0xe6b89c : 0xbfa088;
    const shirtCol = skin === 'alex' ? 0x5a7d45 : 0x2e6b7d;
    const pantsCol = 0x2f357b;

    const headMat = new THREE.MeshLambertMaterial({ color: skinCol });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtCol });
    const pantsMat = new THREE.MeshLambertMaterial({ color: pantsCol });

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
    head.position.set(0, 1.6, 0);
    grp.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), new THREE.MeshLambertMaterial({ color: 0x4a2e18 }));
    hair.position.set(0, 1.8, 0);
    grp.add(hair);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), shirtMat);
    torso.position.set(0, 1.05, 0);
    grp.add(torso);

    // Arms
    for (const ax of [-0.35, 0.35]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), shirtMat);
      arm.position.set(ax, 1.05, 0);
      grp.add(arm);
    }

    // Legs
    for (const lx of [-0.15, 0.15]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), pantsMat);
      leg.position.set(lx, 0.35, 0);
      grp.add(leg);
    }

    // Nametag
    const nametag = this.createNametagSprite(username);
    grp.add(nametag);

    return grp;
  }

  // Animation Loop (Update hand swinging, bobbing, render frame)
  public render(delta: number, isMoving = false) {
    // Hand swing animation
    if (this.isSwinging) {
      this.swingProgress += delta * 6;
      if (this.swingProgress >= 1) {
        this.swingProgress = 0;
        this.isSwinging = false;
        this.handGroup.rotation.x = 0.1;
      } else {
        const sin = Math.sin(this.swingProgress * Math.PI);
        this.handGroup.rotation.x = 0.1 - sin * 0.8;
        this.handGroup.rotation.y = -0.2 + sin * 0.3;
      }
    } else {
      this.handGroup.rotation.x = 0.1;
      this.handGroup.rotation.y = -0.2;
    }

    // Hand bobbing when walking
    if (isMoving) {
      this.bobTimer += delta * 9;
      this.handGroup.position.x = 0.35 + Math.sin(this.bobTimer) * 0.02;
      this.handGroup.position.y = -0.32 + Math.abs(Math.cos(this.bobTimer)) * 0.025;
    } else {
      this.handGroup.position.x = 0.35;
      this.handGroup.position.y = -0.32;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
