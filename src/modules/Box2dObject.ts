import { Container } from 'pixi.js';
import { BodyDef, FixtureDef, Body } from './Box2dAlias';
import { PixiToBox2d } from './utils';

export interface IBox2dObjectOption {
	density?: number;
	friction?: number;
	restitution?: number;
	isStatic?: boolean
	
	/**
	 * The logical sum of the bits representing the collision detection category to which it belongs.
	 */
	categoryBits?: number;
	
	/**
	 * The logical sum of the "categoryBits" for which collision detection with itself is performed.
	 */
	maskBits?: number;
	
	/**
	 * Whether it is a sensor that judges only the overlap of coordinates.
	 */
	isSensor?: boolean;
}

/**
 * @private
 */
type TBox2dObjectBody = Body | null;

export interface IBox2dObjectData {
	id: number;
	body: TBox2dObjectBody;
	bodyDef: BodyDef;
	fixtureDefs: FixtureDef[];
	maskBits: number;
}

/**
 * @ignore
 */
function createBodyDef(isDynamic = false) {
	const bodyDef = new BodyDef();
	isDynamic ? bodyDef.type = Body.b2_dynamicBody : Body.b2_staticBody;
	
	return bodyDef;
}

/**
 * @ignore
 */
const dynamicBodyDef: BodyDef = createBodyDef(true);

/**
 * @ignore
 */
const staticBodyDef: BodyDef = createBodyDef(false);

/**
 * @ignore
 */
function createFixtureDef(options: IBox2dObjectOption = {}, pixi: Container) {
	const fixtureDef = new FixtureDef();
	
	fixtureDef.density = typeof(options.density) === 'number' ? options.density : fixtureDef.density;
	fixtureDef.friction = typeof(options.friction) === 'number' ? options.friction : fixtureDef.friction;
	fixtureDef.restitution = typeof(options.restitution) === 'number' ? options.restitution : fixtureDef.restitution;
	fixtureDef.filter.categoryBits = typeof(options.categoryBits) === 'number' ? options.categoryBits : fixtureDef.filter.categoryBits;
	fixtureDef.filter.maskBits = typeof(options.maskBits) === 'number' ? options.maskBits : fixtureDef.filter.maskBits;
	fixtureDef.isSensor = !!options.isSensor;
	fixtureDef.userData = pixi;
	
	return fixtureDef;
}

/**
 * @see http://pixijs.download/release/docs/PIXI.Container.html
 */
export class Box2dObject extends Container {
	protected _box2dData: IBox2dObjectData;
	private static _id = 0;
	
	/**
	 * When objects come into contact with each other.
	 * @event
	 * @param opponent The object to collide with.
	 */
	BeginContact?(opponent: Box2dObject): void {} // eslint-disable-line
	
	/**
	 * When objects are separated from each other.
	 * @event
	 * @param opponent The object to collide with.
	 */
	EndContact?(opponent: Box2dObject): void {} // eslint-disable-line
	
	/**
	 * Immediately before performing contact processing between objects.<br />
	 * It will not fire if at least one is "isSensor = true".
	 * @event
	 * @param opponent The object to collide with.
	 */
	PreSolve?(opponent: Box2dObject): void {} // eslint-disable-line
	
	/**
	 * Immediately after performing contact processing between objects.<br />
	 * It will not fire if at least one is "isSensor = true".
	 * @event
	 * @param opponent The object to collide with.
	 */
	PostSolve?(opponent: Box2dObject): void {} // eslint-disable-line
	
	constructor(options: IBox2dObjectOption = {}) {
		super();
		
		const fixtureDef = createFixtureDef(options, this);
		this._box2dData = {
			id: Box2dObject._id++,
			body: null,
			bodyDef: options.isStatic ? staticBodyDef : dynamicBodyDef,
			fixtureDefs: [fixtureDef],
			maskBits: fixtureDef.filter.maskBits
		};
	}
	
	getBodyDef(): BodyDef {
		return this._box2dData.bodyDef;
	}
	
	getFixtureDefs(): FixtureDef[] {
		return this._box2dData.fixtureDefs;
	}
	
	get box2dID(): number {
		return this._box2dData.id;
	}
	
	get body(): TBox2dObjectBody {
		return this._box2dData.body;
	}
	
	set body(body: TBox2dObjectBody) {
		this._box2dData.body = body;
	}
	
	setX(x: number): void {
		this.x = x;
		
		const body = this._box2dData.body;
		if (!body) {
			return;
		}
		
		const p = body.GetPosition();
		p.x = x * PixiToBox2d;
		body.SetPosition(p);
	}
	
	setY(y: number): void {
		this.y = y;
		
		const body = this._box2dData.body;
		if (!body) {
			return;
		}
		
		const p = body.GetPosition();
		p.y = y * PixiToBox2d;
		body.SetPosition(p);
	}
	
	setRotation(rotation: number): void {
		this.rotation = rotation;
		
		const body = this._box2dData.body;
		if (!body) {
			return;
		}
		
		body.SetAngle(rotation);
	}
	
	reflect(): void {
		this.setX(this.x);
		this.setY(this.y);
		this.setRotation(this.rotation);
		this.addMask(this._box2dData.maskBits);
	}
	
	/**
	 * Adds the object with the specified "category Bits" to collision detection.
	 */
	addMask(bits: number): void {
		this._box2dData.maskBits |= bits;
		
		if (!this._box2dData.body) {
			return;
		}
		
		let list = this._box2dData.body.GetFixtureList();
		
		while (list) {
			const data = list.GetFilterData();
			data.maskBits = this._box2dData.maskBits;
			list.SetFilterData(data);
			
			list = list.GetNext();
		}
	}
	
	/**
	 * Set to perform collision detection with all objects.
	 */
	addAllMask(): void {
		this._box2dData.maskBits = 65535;
		
		if (!this._box2dData.body) {
			return;
		}
		
		let list = this._box2dData.body.GetFixtureList();
		
		while (list) {
			const data = list.GetFilterData();
			data.maskBits = 65535;
			list.SetFilterData(data);
			
			list = list.GetNext();
		}
	}
	
	/**
	 * Removes the object with the specified "category bit" from collision detection.
	 */
	removeMask(bits: number): void {
		this._box2dData.maskBits ^= this._box2dData.maskBits & bits;
		
		if (!this._box2dData.body) {
			return;
		}
		
		let list = this._box2dData.body.GetFixtureList();
		
		while (list) {
			const data = list.GetFilterData();
			data.maskBits = this._box2dData.maskBits;
			list.SetFilterData(data);
			
			list = list.GetNext();
		}
	}
	
	/**
	 * Set not to perform collision detection with any object.
	 */
	removeAllMask(): void {
		this._box2dData.maskBits = 0;
		
		if (!this._box2dData.body) {
			return;
		}
		
		let list = this._box2dData.body.GetFixtureList();
		
		while (list) {
			const data = list.GetFilterData();
			data.maskBits = 0;
			list.SetFilterData(data);
			
			list = list.GetNext();
		}
	}
	
	toDynamic(): void {
		if (!this._box2dData.body) {
			return;
		}
		
		this._box2dData.body.SetType(Body.b2_dynamicBody);
	}
	
	toStatic(): void {
		if (!this._box2dData.body) {
			return;
		}
		
		this._box2dData.body.SetType(Body.b2_staticBody);
	}
}

delete(Box2dObject.prototype.BeginContact);
delete(Box2dObject.prototype.EndContact);
delete(Box2dObject.prototype.PreSolve);
delete(Box2dObject.prototype.PostSolve);