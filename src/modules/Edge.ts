import { Vec2, PolygonShape } from './Box2dAlias';
import { Box2dObject, IBox2dObjectOption } from './Box2dObject';
import { PixiToBox2d } from './utils';

export class Edge extends Box2dObject {
	constructor(to: Vec2, options: IBox2dObjectOption = {}) {
		super(options);
		
		const fixtureDef = this.getFixtureDefs()[0];
		const shape = new PolygonShape();
		shape.SetAsEdge(new Vec2(0, 0), new Vec2(to.x * PixiToBox2d, to.y * PixiToBox2d));
		
		fixtureDef.shape = shape;
	}
}