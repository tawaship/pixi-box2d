/*!
 * pixi-box2d - v1.0.0
 * 
 * @require pixi.js v^5.3.3
 * @require Box2d.js
 * @author tawaship (makazu.mori@gmail.com)
 * @license MIT
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pixi_js = require('pixi.js');
var box2dwebModule = require('@tawaship/box2dweb-module');

/**
 * @ignore
 */
var Vec2 = box2dwebModule.Common.Math.b2Vec2; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var DebugDraw = box2dwebModule.Dynamics.b2DebugDraw; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var World = box2dwebModule.Dynamics.b2World; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var Contact = box2dwebModule.Dynamics.Contacts.b2Contact; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var ContactListener = box2dwebModule.Dynamics.b2ContactListener; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var BodyDef = box2dwebModule.Dynamics.b2BodyDef; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var FixtureDef = box2dwebModule.Dynamics.b2FixtureDef; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var Body = box2dwebModule.Dynamics.b2Body; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var CircleShape = box2dwebModule.Collision.Shapes.b2CircleShape; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var PolygonShape = box2dwebModule.Collision.Shapes.b2PolygonShape; // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @ignore
 */
var EdgeShape = box2dwebModule.Collision.Shapes.b2EdgeShape; // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * @ignore
 */
const Box2dToPixi = 30;
/**
 * @ignore
 */
const PixiToBox2d = 1 / Box2dToPixi;

/**
 * @ignore
 */
function beginContactHandler(contact) {
    const dataA = contact.GetFixtureA().GetUserData();
    const dataB = contact.GetFixtureB().GetUserData();
    dataA && dataA.emit && dataA.emit('BeginContact', dataB);
    dataB && dataB.emit && dataB.emit('BeginContact', dataA);
}
/**
 * @ignore
 */
function endContactHandler(contact) {
    const dataA = contact.GetFixtureA().GetUserData();
    const dataB = contact.GetFixtureB().GetUserData();
    dataA && dataA.emit && dataA.emit('EndContact', dataB);
    dataB && dataB.emit && dataB.emit('EndContact', dataA);
}
/**
 * @ignore
 */
function preSolveHandler(contact) {
    const dataA = contact.GetFixtureA().GetUserData();
    const dataB = contact.GetFixtureB().GetUserData();
    dataA && dataA.emit && dataA.emit('PreSolve', dataB);
    dataB && dataB.emit && dataB.emit('PreSolve', dataA);
}
/**
 * @ignore
 */
function postSolveHandler(contact) {
    const dataA = contact.GetFixtureA().GetUserData();
    const dataB = contact.GetFixtureB().GetUserData();
    dataA && dataA.emit && dataA.emit('PostSolve', dataB);
    dataB && dataB.emit && dataB.emit('PostSolve', dataA);
}
/**
 * @see http://pixijs.download/release/docs/PIXI.Container.html
 */
class WorldContainer extends pixi_js.Container {
    constructor(options) {
        super();
        const gravityX = typeof (options.gravityX) === 'number' ? options.gravityX : 0;
        const gravityY = typeof (options.gravityY) === 'number' ? options.gravityY : 9.8;
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
        this.box2dEnabled = true;
    }
    /**
     * @param canvas The canvas element on which the content is drawn.
     * @return Canvas element for debug display.
     */
    addDebugDraw(pixiCanvas) {
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
    _handleTick(delta) {
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
            delete (targets[i]);
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
    get speed() {
        return this._box2dData.speed;
    }
    set speed(speed) {
        this._box2dData.speed = speed;
    }
    get box2dEnabled() {
        return this._box2dData.enabled;
    }
    set box2dEnabled(flag) {
        this._box2dData.enabled = flag;
    }
    get world() {
        return this._box2dData.world;
    }
    addBox2d(b2d) {
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
        delete (this._box2dData.deletes[b2d.box2dID]);
        return b2d;
    }
    removeBox2d(b2d) {
        this.removeChild(b2d);
        this._box2dData.deletes[b2d.box2dID] = b2d;
        return b2d;
    }
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
const dynamicBodyDef = createBodyDef(true);
/**
 * @ignore
 */
const staticBodyDef = createBodyDef(false);
/**
 * @ignore
 */
function createFixtureDef(options = {}, pixi) {
    const fixtureDef = new FixtureDef();
    fixtureDef.density = typeof (options.density) === 'number' ? options.density : fixtureDef.density;
    fixtureDef.friction = typeof (options.friction) === 'number' ? options.friction : fixtureDef.friction;
    fixtureDef.restitution = typeof (options.restitution) === 'number' ? options.restitution : fixtureDef.restitution;
    fixtureDef.filter.categoryBits = typeof (options.categoryBits) === 'number' ? options.categoryBits : fixtureDef.filter.categoryBits;
    fixtureDef.filter.maskBits = typeof (options.maskBits) === 'number' ? options.maskBits : fixtureDef.filter.maskBits;
    fixtureDef.isSensor = !!options.isSensor;
    fixtureDef.userData = pixi;
    return fixtureDef;
}
/**
 * @see http://pixijs.download/release/docs/PIXI.Container.html
 */
class Box2dObject extends pixi_js.Container {
    constructor(options = {}) {
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
    /**
     * When objects come into contact with each other.
     * @event
     * @param opponent The object to collide with.
     */
    BeginContact(opponent) { } // eslint-disable-line
    /**
     * When objects are separated from each other.
     * @event
     * @param opponent The object to collide with.
     */
    EndContact(opponent) { } // eslint-disable-line
    /**
     * Immediately before performing contact processing between objects.<br />
     * It will not fire if at least one is "isSensor = true".
     * @event
     * @param opponent The object to collide with.
     */
    PreSolve(opponent) { } // eslint-disable-line
    /**
     * Immediately after performing contact processing between objects.<br />
     * It will not fire if at least one is "isSensor = true".
     * @event
     * @param opponent The object to collide with.
     */
    PostSolve(opponent) { } // eslint-disable-line
    getBodyDef() {
        return this._box2dData.bodyDef;
    }
    getFixtureDefs() {
        return this._box2dData.fixtureDefs;
    }
    get box2dID() {
        return this._box2dData.id;
    }
    get body() {
        return this._box2dData.body;
    }
    set body(body) {
        this._box2dData.body = body;
    }
    setX(x) {
        this.x = x;
        const body = this._box2dData.body;
        if (!body) {
            return;
        }
        const p = body.GetPosition();
        p.x = x * PixiToBox2d;
        body.SetPosition(p);
    }
    setY(y) {
        this.y = y;
        const body = this._box2dData.body;
        if (!body) {
            return;
        }
        const p = body.GetPosition();
        p.y = y * PixiToBox2d;
        body.SetPosition(p);
    }
    setRotation(rotation) {
        this.rotation = rotation;
        const body = this._box2dData.body;
        if (!body) {
            return;
        }
        body.SetAngle(rotation);
    }
    reflect() {
        this.setX(this.x);
        this.setY(this.y);
        this.setRotation(this.rotation);
        this.addMask(this._box2dData.maskBits);
    }
    /**
     * Adds the object with the specified "category Bits" to collision detection.
     */
    addMask(bits) {
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
    addAllMask() {
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
    removeMask(bits) {
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
    removeAllMask() {
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
    toDynamic() {
        if (!this._box2dData.body) {
            return;
        }
        this._box2dData.body.SetType(Body.b2_dynamicBody);
    }
    toStatic() {
        if (!this._box2dData.body) {
            return;
        }
        this._box2dData.body.SetType(Body.b2_staticBody);
    }
}
Box2dObject._id = 0;
delete (Box2dObject.prototype.BeginContact);
delete (Box2dObject.prototype.EndContact);
delete (Box2dObject.prototype.PreSolve);
delete (Box2dObject.prototype.PostSolve);

class Circle extends Box2dObject {
    constructor(radius, options = {}) {
        super(options);
        const fixtureDef = this.getFixtureDefs()[0];
        fixtureDef.shape = new CircleShape(radius * PixiToBox2d);
    }
    /**
     * Create a "Circle" instance whose radius is the larger width or height of the "PIXI.Container" instance at that point.
     * Note that if you change the shape of the "PIXI.Container" instance after creating this method, the appearance and collision detection will not match.
     */
    static from(pixi, options = {}) {
        const b2d = new Circle(Math.max(pixi.width / 2, pixi.height / 2), options);
        const c = b2d.addChild(new pixi_js.Container());
        c.addChild(pixi);
        const b = b2d.getLocalBounds();
        c.x = -b.x - pixi.width / 2;
        c.y = -b.y - pixi.height / 2;
        return b2d;
    }
}

class Rectangle extends Box2dObject {
    constructor(width, height, options = {}) {
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
    static from(pixi, options = {}) {
        const b2d = new Rectangle(pixi.width, pixi.height, options);
        const c = b2d.addChild(new pixi_js.Container());
        c.addChild(pixi);
        const b = b2d.getLocalBounds();
        c.x = -b.x;
        c.y = -b.y;
        return b2d;
    }
}

class Polygon extends Box2dObject {
    constructor(vertices, options = {}) {
        super(options);
        const fixtureDef = this.getFixtureDefs()[0];
        const shape = new PolygonShape();
        shape.SetAsArray(vertices);
        fixtureDef.shape = shape;
    }
}

class Edge extends Box2dObject {
    constructor(to, options = {}) {
        super(options);
        const fixtureDef = this.getFixtureDefs()[0];
        const shape = new PolygonShape();
        shape.SetAsEdge(new Vec2(0, 0), new Vec2(to.x * PixiToBox2d, to.y * PixiToBox2d));
        fixtureDef.shape = shape;
    }
}

Object.keys(box2dwebModule).forEach(function (k) {
    if (k !== 'default') Object.defineProperty(exports, k, {
        enumerable: true,
        get: function () {
            return box2dwebModule[k];
        }
    });
});
exports.Box2dObject = Box2dObject;
exports.Circle = Circle;
exports.Edge = Edge;
exports.Polygon = Polygon;
exports.Rectangle = Rectangle;
exports.WorldContainer = WorldContainer;
//# sourceMappingURL=pixi-box2d.cjs.js.map
