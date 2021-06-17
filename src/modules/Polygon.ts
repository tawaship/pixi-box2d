import { Vec2, PolygonShape } from './Box2dAlias';
import { Box2dObject, IBox2dObjectOption } from './Box2dObject';

export class Polygon extends Box2dObject {
	constructor(vertices: Vec2[], options: IBox2dObjectOption = {}) {
		super(options);
		
		const fixtureDef = this.getFixtureDefs()[0];
		const shape = new PolygonShape();
		shape.SetAsArray(vertices);
		
		fixtureDef.shape = shape;
	}
}