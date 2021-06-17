import { Container, Ticker } from 'pixi.js';
import { Vec2, World, Contact, ContactListener, DebugDraw } from './Box2dAlias';
import { Box2dObject } from './Box2dObject';
import { Box2dToPixi, PixiToBox2d } from './utils';

export interface IWorldContainerData {
	world: World;
	listener: ContactListener;
	enabled: boolean;
	speed: number;
	targets: { [id: number]: Box2dObject };
	deletes: { [id: number]: Box2dObject };
}

export interface IWorldContainerOption {
	ticker: Ticker;
	gravityX?: number;
	gravityY?: number;
	allowSleep?: boolean;
	listenBeginContact?: boolean;
	listenEndContact?: boolean;
	listenPreSolve?: boolean;
	listenPostSolve?: boolean;
}

/**
 * @ignore
 */
function beginContactHandler(contact: Contact) {
	const dataA = contact.GetFixtureA().GetUserData();
	const dataB = contact.GetFixtureB().GetUserData();
	
	dataA && dataA.emit && dataA.emit('BeginContact', dataB);
	dataB && dataB.emit && dataB.emit('BeginContact', dataA);
}

/**
 * @ignore
 */
function endContactHandler(contact: Contact) {
	const dataA = contact.GetFixtureA().GetUserData();
	const dataB = contact.GetFixtureB().GetUserData();
	
	dataA && dataA.emit && dataA.emit('EndContact', dataB);
	dataB && dataB.emit && dataB.emit('EndContact', dataA);
}

/**
 * @ignore
 */
function preSolveHandler(contact: Contact) {
	const dataA = contact.GetFixtureA().GetUserData();
	const dataB = contact.GetFixtureB().GetUserData();
	
	dataA && dataA.emit && dataA.emit('PreSolve', dataB);
	dataB && dataB.emit && dataB.emit('PreSolve', dataA);
}

/**
 * @ignore
 */
function postSolveHandler(contact: Contact) {
	const dataA = contact.GetFixtureA().GetUserData();
	const dataB = contact.GetFixtureB().GetUserData();
	
	dataA && dataA.emit && dataA.emit('PostSolve', dataB);
	dataB && dataB.emit && dataB.emit('PostSolve', dataA);
}

/**
 * @see http://pixijs.download/release/docs/PIXI.Container.html
 */
export class WorldContainer extends Container {
	private _box2dData: IWorldContainerData;
	
	constructor(options: IWorldContainerOption) {
		super();
		
		const gravityX = typeof(options.gravityX) === 'number' ? options.gravityX : 0;
		const gravityY = typeof(options.gravityY) === 'number' ? options.gravityY : 9.8;
		const allowSleep = !!options.allowSleep;
		
		const world = new World(new Vec2(gravityX, gravityY), allowSleep);
		
		this._box2dData = {
			world,
			listener: new ContactListener(),
			enabled: true,
			speed: 1,
			targets: {},
			deletes: {}
		};
		
		this.on('added', () => {
			options.ticker.add(this._handleTick, this);
		});
		
		this.on('removed', () => {
			options.ticker.remove(this._handleTick, this);
		});
		
		const listener = this._box2dData.listener;
		if (options.listenBeginContact) {
			listener.BeginContact = beginContactHandler;
		}
		
		if (options.listenEndContact) {
			listener.EndContact = endContactHandler;
		}
		
		if (options.listenPreSolve) {
			listener.PreSolve = preSolveHandler;
		}
		
		if (options.listenPostSolve) {
			listener.PostSolve = postSolveHandler;
		}
		
		world.SetContactListener(listener);
		
		this.box2dEnabled = true
	}
	
	/**
	 * @param canvas The canvas element on which the content is drawn.
	 * @return Canvas element for debug display.
	 */
	addDebugDraw( pixiCanvas: HTMLCanvasElement): HTMLCanvasElement {
		const canvas = document.createElement('canvas');
		
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return canvas;
		}
		
		if (pixiCanvas.parentNode) {
			pixiCanvas.parentNode.appendChild(canvas);
		}
		
		canvas.width = pixiCanvas.width;
		canvas.height = pixiCanvas.height;
		canvas.style.width = pixiCanvas.style.width;
		canvas.style.height = pixiCanvas.style.height;
		canvas.style.top = pixiCanvas.style.top || '0';
		canvas.style.left = pixiCanvas.style.left || '0';
		canvas.style.position = 'absolute';
		canvas.style.pointerEvents = 'none';
		canvas.style.zIndex = '100';
		
		const debugDraw = new DebugDraw();
		debugDraw.SetSprite(ctx);
		debugDraw.SetDrawScale(Box2dToPixi);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1);
		debugDraw.SetFlags(DebugDraw.e_shapeBit | DebugDraw.e_jointBit);
		
		this.world.SetDebugDraw(debugDraw);
		
		return canvas;
	}
	
	private _handleTick(delta: number) {
		if (!this._box2dData.enabled) {
			return;
		}
		
		const world = this._box2dData.world;
		
		world.Step(delta * this._box2dData.speed / 30, 10, 10);
		world.ClearForces();
		world.DrawDebugData();
		
		const targets = this._box2dData.targets;
		
		for (const i in this._box2dData.deletes) {
			const b2d = this._box2dData.deletes[i];
			delete(targets[i]);
			if (b2d.body) {
				world.DestroyBody(b2d.body);
				b2d.body = null;
			}
		}
		this._box2dData.deletes = [];
		
		for (const i in targets) {
			const b2d = targets[i];
			
			if (!b2d.body) {
				continue;
			}
			
			const position = b2d.body.GetPosition();
			
			b2d.x = position.x * Box2dToPixi;
			b2d.y = position.y * Box2dToPixi;
			b2d.rotation = b2d.body.GetAngle();
		}
	}
	
	get speed(): number {
		return this._box2dData.speed;
	}
	
	set speed(speed: number) {
		this._box2dData.speed = speed;
	}
	
	get box2dEnabled(): boolean {
		return this._box2dData.enabled;
	}
	
	set box2dEnabled(flag: boolean) {
		this._box2dData.enabled = flag;
	}
	
	get world(): World {
		return this._box2dData.world;
	}
	
	addBox2d(b2d: Box2dObject): Box2dObject {
		if (!b2d.body) {
			const body = this._box2dData.world.CreateBody(b2d.getBodyDef());
			const fixtureDefs = b2d.getFixtureDefs();
			
			for (let i = 0; i < fixtureDefs.length; i++) {
				body.CreateFixture(fixtureDefs[i]);
			}
			
			b2d.body = body;
			
			body.SetPosition(new Vec2(b2d.x * PixiToBox2d, b2d.y * PixiToBox2d));
			body.SetAngle(b2d.rotation);
		}
		
		b2d.reflect();
		this.addChild(b2d);
		this._box2dData.targets[b2d.box2dID] = b2d;
		delete(this._box2dData.deletes[b2d.box2dID]);
		
		return b2d;
	}
	
	removeBox2d(b2d: Box2dObject): Box2dObject {
		this.removeChild(b2d);
		this._box2dData.deletes[b2d.box2dID] = b2d;
		
		return b2d;
	}
}