import { Container, filters } from 'pixi.js';
import { createjs } from './alias';
import { CreatejsColorFilter } from './ColorFilter';
import { createPixiData, createCreatejsParams, IPixiData, ICreatejsParam, updateDisplayObjectChildren, ITickerData, mixinCreatejsDisplayObject, mixinPixiContainer } from './core';
import { createObject } from './utils';

/**
 * [[http://pixijs.download/release/docs/PIXI.Container.html | PIXI.Container]]
 */
export class PixiMovieClip extends mixinPixiContainer(Container) {
	private _createjs: CreatejsMovieClip;
	private _filterContainer: Container | null;
	
	constructor(cjs: CreatejsMovieClip) {
		super();
		
		this._createjs = cjs;
	}
	
	get filterContainer() {
		return this._filterContainer;
	}
	
	set filterContainer(value) {
		this._filterContainer = value;
	}
	
	get createjs() {
		return this._createjs;
	}
}

export interface ICreatejsMovieClipParam extends ICreatejsParam {

}

/**
 * @ignore
 */
function createCreatejsMovieClipParams(): ICreatejsMovieClipParam {
	return createCreatejsParams();
}

export interface IPixiMoveClipData extends IPixiData<PixiMovieClip> {
	subInstance: Container;
}

/**
 * @ignore
 */
function createPixiMovieClipData(cjs: CreatejsMovieClip): IPixiMoveClipData {
	const pixi = new PixiMovieClip(cjs);
	
	return Object.assign(createPixiData(pixi, pixi.pivot), {
		subInstance: pixi
	});
}

/**
 * @ignore
 */
const P = createjs.Bitmap;

/**
 * [[https://createjs.com/docs/easeljs/classes/MovieClip.html | createjs.MovieClip]]
 */
export class CreatejsMovieClip extends mixinCreatejsDisplayObject<IPixiMoveClipData, ICreatejsMovieClipParam>(createjs.MovieClip) {
	constructor(...args: any[]) {
		super(...args);
		
		this._initForPixi();
		
		P.apply(this, args);
	}
	
	private _initForPixi() {
		this._createjsParams = createCreatejsMovieClipParams();
		this._pixiData = createPixiMovieClipData(this);
	}
	
	initialize(...args: any[]) {
		this._initForPixi();
		
		return super.initialize(...args);
	}
	
	protected _updateForPixi(e: ITickerData) {
		this._updateState();
		
		return updateDisplayObjectChildren(this, e);
	}
	
	get filters() {
		return this._createjsParams.filters;
	}
	
	set filters(value: CreatejsColorFilter[]) {
		if (value) {
			const list = [];
			
			for (var i = 0; i < value.length; i++) {
				const f = value[i];
				
				if (f instanceof createjs.ColorMatrixFilter) {
					continue;
				}
				
				const m = new filters.ColorMatrixFilter();
				m.matrix = [
					f.redMultiplier, 0, 0, 0, f.redOffset / 255,
					0, f.greenMultiplier, 0, 0, f.greenOffset / 255,
					0, 0, f.blueMultiplier, 0, f.blueOffset / 255,
					0, 0, 0, f.alphaMultiplier, f.alphaOffset / 255,
					0, 0, 0, 0, 1
				];
				list.push(m);
			}
			
			var o = this._pixiData.instance;
			var c = o.children;
			var n = new Container();
			var nc = this._pixiData.subInstance = n.addChild(new Container());
			
			while (c.length) {
				nc.addChild(c[0]);
			}
			
			o.addChild(n);
			o.filterContainer = nc;
			
			nc.updateTransform();
			nc.calculateBounds();
			
			const b = nc.getLocalBounds();
			const x = b.x;
			const y = b.y;
			
			for (var i = 0; i < nc.children.length; i++) {
				const child = nc.children[i];
				
				child.x -= x;
				child.y -= y;
				
				if (child instanceof PixiMovieClip) {
					const fc = child.filterContainer;
					if (fc) {
						fc.cacheAsBitmap = false;
					}
				}
			}
			n.x = x;
			n.y = y;
			
			nc.filters = list;
			nc.cacheAsBitmap = true;
		} else {
			const o = this._pixiData.instance;
			
			if (o.filterContainer) {
				const nc = this._pixiData.subInstance;
				const n = nc.parent;
				const c = nc.children;
				
				o.removeChildren();
				o.filterContainer = null;
				while (c.length) {
					const v = o.addChild(c[0]);
					v.x += n.x;
					v.y += n.y;
				}
				
				nc.filters = null;
				nc.cacheAsBitmap = false;
				
				this._pixiData.subInstance = o;
			}
		}
		
		this._createjsParams.filters = value;
	}
	
	addChild(child) {
		this._pixiData.subInstance.addChild(child._pixiData.instance);
		
		return super.addChild(child);
	}
	
	addChildAt(child, index) {
		this._pixiData.subInstance.addChildAt(child._pixiData.instance, index);
		
		return super.addChildAt(child, index);
	}
	
	removeChild(child) {
		this._pixiData.subInstance.removeChild(child._pixiData.instance);
		
		return super.removeChild(child);
	}
	
	removeChildAt(index) {
		this._pixiData.subInstance.removeChildAt(index);
		
		return super.removeChildAt(index);
	}
	
	removeAllChldren() {
		this._pixiData.subInstance.removeChildren();
		
		return super.removeAllChldren();
	}
}

// temporary prototype
Object.defineProperties(CreatejsMovieClip.prototype, {
	_createjsParams: {
		value: createCreatejsMovieClipParams(),
		writable: true
	},
	_pixiData: {
		value: createPixiMovieClipData(createObject<CreatejsMovieClip>(CreatejsMovieClip.prototype)),
		writable: true
	}
});

