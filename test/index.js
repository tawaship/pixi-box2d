const assert = require('assert');
const PIXI = require('pixi.js-legacy');
const Box2d = require('../');
const path = require('path');

describe('PIXI.Box2d', () => {
	it('basic', () => {
		const app = new PIXI.Application({
			width: 450,
			height: 800
		});
		
		return new Promise(resolve => {
			class Root extends PIXI.Container {
				constructor() {
					super();
					
					this.addChild(new PIXI.Graphics()).beginFill(0x00FF00).drawRect(0, 0, 450, 800 / 2)
					this.interactive = true;
					this.cursor = 'pointer'
					
					const world = this.addChild(new Box2d.WorldContainer({
						listenPreSolve: false,
						listenPostSolve: false,
						listenBeginContact: false,
						listenEndContact: true,
						ticker: app.ticker
					}));
					
					const r = Math.random() > 0.5;
					const w = 100
					const h = 150
					
					const a2 = world.addBox2d(new Box2d.Rectangle(w, h, {
						density: 0.1,
						restitution: 0.1,
						friction: 0.9,
						categoryBits: 1
					}));
					
					a2.addChild(new PIXI.Graphics().beginFill(0xFF0000).drawRect(0, 0, w, h));
					a2.setX(100 - a2.width / 2);
					a2.setY(100 - a2.height / 2);
					
					const dead = world.addBox2d(new Box2d.Edge(new Box2d.Common.Math.b2Vec2(450 + 2000, 0), { isStatic: true, isSensor: true, maskBits: 1 }));
					dead.setX(-1000);
					dead.setY(800 - 10);
					dead.on('EndContact', (opponent) => {
						resolve();
					});
				}
			}
			
			app.stage.addChild(new Root());
			document.body.appendChild(app.view);
		});
	});
});