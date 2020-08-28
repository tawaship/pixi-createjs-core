import * as PIXI from 'pixi.js';
import * as createjs from './createjs/index';

/**
 * @ignore
 */
declare const window: any;

export type TAnimateLibrary = {
	[ name: string ]: any;
}

export type TPlayerOption = {
	/**
	 * Whether synchronous playback of movie clips is enabled.
	 */
	useSynchedTimeline?: boolean
};

/**
 * Prepare createjs content published with Adobe Animate.
 * @param id "lib.properties.id" in Animate content.
 * @param basepath Directory path of Animate content.
 */
export function prepareAnimateAsync(id: string, basepath: string, options: TPlayerOption = {}) {
	const comp = window.AdobeAn.getComposition(id);
	if (!comp) {
		throw new Error('no composition');
	}
	
	const lib: TAnimateLibrary = comp.getLibrary();
	
	if (!options.useSynchedTimeline) {
		Object.defineProperties(window.createjs.MovieClip.prototype, {
			updateForPixi: {
				value: function(e) {
					return this._tick(e);
				}
			}
		});
	}
	
	return new Promise((resolve, reject) => {
		if (lib.properties.manifest.length === 0) {
			resolve({});
		}
		
		const loader = new window.createjs.LoadQueue(false);
		
		loader.installPlugin(window.createjs.Sound);
		
		loader.addEventListener('fileload', function(evt: any) {
			handleFileLoad(evt, comp);
		});
		
		loader.addEventListener('complete', function(evt: any) {
			resolve(evt);
		});
		
		if (basepath) {
			basepath = (basepath + '/').replace(/([^\:])\/\//, "$1/");
			const m = lib.properties.manifest;
			for (let i = 0; i < m.length; i++) {
				m[i].src = basepath + m[i].src;
			}
		}
		
		loader.loadManifest(lib.properties.manifest);
	})
	.then((evt: any) => {
		const ss = comp.getSpriteSheet();
		const queue = evt.target;
		const ssMetadata = lib.ssMetadata;
		
		for (let i = 0; i < ssMetadata.length; i++) {
			ss[ssMetadata[i].name] = new window.createjs.SpriteSheet({
				images: [
					queue.getResult(ssMetadata[i].name)
				],
				frames: ssMetadata[i].frames
			});
		}
		
		return lib;
	});
}

export function initializeAnimate(obj: { [name: string]: any } = {}) {
	window.createjs.StageGL = createjs.CreatejsStageGL;
	window.createjs.MovieClip = createjs.CreatejsMovieClip;
	window.createjs.Sprite = createjs.CreatejsSprite;
	window.createjs.Shape = createjs.CreatejsShape;
	//window.createjs.Bitmap = createjs.CreatejsBitmap;
	window.createjs.Graphics = createjs.CreatejsGraphics;
	window.createjs.Text = createjs.CreatejsText;
	window.createjs.ButtonHelper = createjs.CreatejsButtonHelper;
	
	for (let i in obj) {
		window.createjs[i] = obj[i];
	}
}

/**
 * @ignore
 */
function handleFileLoad(evt: any, comp: any) {
	const images = comp.getImages();
	if (evt && (evt.item.type == 'image')) {
		images[evt.item.id] = evt.result;
	}
}