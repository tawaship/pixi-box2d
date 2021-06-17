import { Container } from 'pixi.js';
import { Vec2, PolygonShape } from './Box2dAlias';
import { Box2dObject, IBox2dObjectOption } from './Box2dObject';
import { PixiToBox2d }from './utils';

export class Rectangle extends Box2dObject {
	constructor(width: number, height: number, options: IBox2dObjectOption = {}) {
		super(options);
		
		width *= PixiToBox2d;
		height *= PixiToBox2d;
		
		const fixtureDef = this.getFixtureDefs()[0];
		const shape = new PolygonShape();
		shape.SetAsArray([
			new Vec2(0, 0),
			new Vec2(width, 0),
			new Vec2(width, height),
			new Vec2(0, height)
		]);
		
		fixtureDef.shape = shape;
	}
	
	/**
	 * Create a "Rectangle" instance that circumscribes the shape of the "PIXI.Container" instance at that point.
	 * Note that if you change the shape of the "PIXI.Container" instance after creating this method, the appearance and collision detection will not match.
	 */
	static from(pixi: Container, options: IBox2dObjectOption = {}): Rectangle {
		const b2d = new Rectangle(pixi.width, pixi.height, options);
		
		const c = b2d.addChild(new Container());
		c.addChild(pixi);
		
		const b = b2d.getLocalBounds();
		c.x = -b.x;
		c.y = -b.y;
		
		return b2d;
	}
}