import { Container } from 'pixi.js';
import { CircleShape } from './Box2dAlias';
import { Box2dObject, IBox2dObjectOption } from './Box2dObject';
import { PixiToBox2d } from './utils';

export class Circle extends Box2dObject {
	constructor(radius: number, options: IBox2dObjectOption = {}) {
		super(options);
		
		const fixtureDef = this.getFixtureDefs()[0];
		fixtureDef.shape = new CircleShape(radius * PixiToBox2d);
	}
	
	/**
	 * Create a "Circle" instance whose radius is the larger width or height of the "PIXI.Container" instance at that point.
	 * Note that if you change the shape of the "PIXI.Container" instance after creating this method, the appearance and collision detection will not match.
	 */
	static from(pixi: Container, options: IBox2dObjectOption = {}): Circle {
		const b2d = new Circle(Math.max(pixi.width / 2, pixi.height/ 2), options);
		
		const c = b2d.addChild(new Container());
		c.addChild(pixi);
		
		const b = b2d.getLocalBounds();
		c.x = -b.x - pixi.width / 2;
		c.y = -b.y - pixi.height / 2;
		
		return b2d;
	}
}