const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/load-game-CacwU5H5.js","assets/rolldown-runtime-hePW80VL.js","assets/game-world-OmVqljBd.js","assets/Geometry-CpapZaL5.js","assets/init-BMcv3fNt.js","assets/canvasUtils-BEyQHGCa.js","assets/CanvasRenderer-D0gj4jmF.js","assets/RenderTargetSystem-CkAhTZ_2.js","assets/getTextureBatchBindGroup-DYfL3yhX.js"])))=>i.map(i=>d[i]);
import{A as e,C as t,Ct as n,E as r,F as i,Ft as a,I as o,M as s,P as c,T as l,Wt as u,Z as d,_t as f,a as p,at as m,b as h,ct as g,d as _,f as v,g as y,h as b,ht as x,k as S,l as C,lt as w,mt as ee,n as T,p as E,q as D,r as O,rt as k,s as A,u as j,v as M,w as N,x as P,y as F,yt as I}from"./game-world-OmVqljBd.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function L(e,t){return R(e,t)}var R=r(class extends l{element;lastListenerMetaData;isPartDisconnected=!1;constructor(e){super(e),this.element=M(e,`listen`)}resetListener(e){this.removeCurrentListener(),this.lastListenerMetaData=e,this.isConnected&&this.addCurrentListener()}addCurrentListener(){this.lastListenerMetaData&&this.element.addEventListener(this.lastListenerMetaData.eventType,this.lastListenerMetaData.listener)}removeCurrentListener(){this.lastListenerMetaData&&this.element.removeEventListener(this.lastListenerMetaData.eventType,this.lastListenerMetaData.listener)}isMidDispatchDisconnect(e){return!this.element.isConnected&&e.composedPath().some(e=>e instanceof Node&&e.isConnected)}createListenerMetaData(e,t){return{eventType:e,callback:t,listener:e=>{if(!this.isPartDisconnected||this.isMidDispatchDisconnect(e))return this.lastListenerMetaData?.callback(e)}}}render(t,n){let r=typeof t==`string`?t:t.type;if(typeof r!=`string`)throw TypeError(`Cannot listen to an event with a name that is not a string. Given event name: '${String(r)}'`);return this.lastListenerMetaData&&this.lastListenerMetaData.eventType===r?this.lastListenerMetaData.callback=n:this.resetListener(this.createListenerMetaData(r,n)),e}disconnected(){this.isPartDisconnected=!0}reconnected(){this.isPartDisconnected=!1,this.addCurrentListener()}}),z=P`
    /* iOS Safari */
    -webkit-touch-callout: none;
    /* Safari */
    -webkit-user-select: none;
    /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
    user-select: none;
`,B=class extends u()(`local-storage-client-all-values-event`){},V=class{shapes;options;listenTarget=new f;keyEvents;get AllValuesType(){throw Error(`Cannot use AllValuesType as a runtime value. It is a type only.`)}get ValueType(){throw Error(`Cannot use ValueType as a runtime value. It is a type only.`)}constructor(e,t={}){this.shapes=e,this.options=t,this.storeName=t.storeName||`local-storage-client`,this.keyEvents=d(e,e=>class extends u()(`local-storage-client-${String(e)}-event`){}),this.get=d(this.shapes,e=>(t={})=>this.getAllValues(t)[e]),this.listen=d(this.shapes,e=>t=>this.listenTarget.listen(this.keyEvents[e],async e=>{await t(e.detail)})),this.set=d(this.shapes,e=>t=>{s(t,this.shapes[e],{allowExtraKeys:!0},`LocalStorageClient: Invalid value for key '${String(e)}'.`);let n=this.getAllValues();return n[e]=t,globalThis.localStorage.setItem(this.storeName,JSON.stringify(n)),this.listenTarget.dispatch(new B({detail:n})),this.listenTarget.dispatch(new this.keyEvents[e]({detail:t})),t}),this.delete=d(this.shapes,e=>()=>{let t=this.getAllValues();delete t[e],globalThis.localStorage.setItem(this.storeName,JSON.stringify(t)),this.listenTarget.dispatch(new B({detail:t})),this.listenTarget.dispatch(new this.keyEvents[e]({detail:void 0}))})}storeName;getAllValues({throwErrorOnFailure:e=!1}={}){return w(()=>{let t=JSON.parse(globalThis.localStorage.getItem(this.storeName)||`{}`);return m(t,(t,n)=>{let r=this.shapes[t];if(r){if(e)s(n,r,{allowExtraKeys:!0});else if(!c(n,r,{allowExtraKeys:!0}))return;return{key:t,value:n}}})},{handleError:t=>{if(e)throw a(t,`LocalStorageClient: store '${this.storeName}' is corrupt and cannot be loaded.`);return{}}})}listenToAllValues(e){return this.listenTarget.listen(B,async t=>{await e(t.detail)})}listen;get;set;delete;clear(){globalThis.localStorage.removeItem(this.storeName)}destroy(){this.listenTarget.destroy()}};function H(e){return[D(e.prefix),`theme-vir-style`].join(`-`)}function U(e,n,r){let i=ee(I(e.colors).flatMap(e=>[W({layerKey:`background`,themeColor:e,themeOverride:n}),W({layerKey:`foreground`,themeColor:e,themeOverride:n})]));return t(i,H(e),r)}function W({layerKey:e,themeOverride:t,themeColor:n}){let r=String(n[e].name);return[r,t?.overrides[r]||n[e].default]}var G;(function(e){e.Light=`light`,e.Dark=`dark`,e.Auto=`auto`})(G||={});var K=({useDarkTheme:e})=>{U(v,e?E:void 0)},q=`(prefers-color-scheme: dark)`,J={selectedTheme:o({theme:i(G)})},Y=class{applyThemeCallback=K;localStorageClient;removeThemePreferenceListener=x(globalThis.matchMedia(q),`change`,e=>{n.instanceOf(e,MediaQueryListEvent),this.currentTheme===G.Auto&&this.applyThemeCallback({useDarkTheme:e.matches})});constructor(e={}){e.applyTheme&&(this.applyThemeCallback=e.applyTheme),this.localStorageClient=new V(J,{storeName:e.storeName||`vira-theme`}),this.applySelection(this.currentTheme)}get currentTheme(){return this.localStorageClient.get.selectedTheme()?.theme||G.Auto}setSelectedTheme(e){this.applySelection(e),this.localStorageClient.set.selectedTheme({theme:e})}destroy(){this.removeThemePreferenceListener(),this.localStorageClient.destroy()}applySelection(e){let t=e===G.Dark||e===G.Auto&&globalThis.matchMedia(q).matches;this.applyThemeCallback({useDarkTheme:t})}},X=1e3;function Z({hostElement:e,loadingScreenElement:t,options:n,screenSize:r}){let i=e.style.zoom?void 0:_({screenSize:r,virtualHeight:n.virtualHeight,virtualWidth:n.virtualWidth})?.scale;i==null?t.style.removeProperty(`zoom`):t.style.zoom=String(i)}var Q=F()({tagName:`antha-asset-loading-screen`,state(){return{resizeObserver:void 0}},cssVars:{"antha-asset-loading-screen-fade-ms":k({value:X,suffix:`ms`})},hostClasses:{"antha-asset-loading-screen-completed"({inputs:e}){return e.completed}},init({host:e,inputs:t,updateState:n}){let{resizeObserver:r}=y(t.hostElement,({contentRect:n})=>{Z({hostElement:t.hostElement,loadingScreenElement:e,options:t.options,screenSize:n})});n({resizeObserver:r})},cleanup({state:e}){e.resizeObserver?.disconnect()},styles({cssVars:e,hostClasses:t}){return P`
            :host {
                position: fixed;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background-color: black;
                color: white;
                z-index: 9999;
                gap: 24px;
                opacity: 1;
                transition: opacity ${e[`antha-asset-loading-screen-fade-ms`].value} ease-in;
            }

            .loading-text {
                font-size: 24px;
                position: relative;
            }

            .dots {
                font-family: monospace;
                position: absolute;
                left: 100%;
                bottom: 0;
            }

            .progress-track {
                width: 300px;
                height: 1em;
                overflow: hidden;
                border: 4px solid white;
            }

            .current-resource-name {
                font-size: 14px;
                opacity: 0.7;
            }

            .progress-fill {
                height: 100%;
                background-color: white;
                transition: width ${200}ms ease-in;
            }

            ${t[`antha-asset-loading-screen-completed`].selector} {
                opacity: 0;
            }
        `},render({host:e,inputs:t,cssVars:n}){N({forCssVar:n[`antha-asset-loading-screen-fade-ms`],onElement:e,toValue:k({value:t.loadingScreenFadeMs,suffix:`ms`})});let r=t.dotCount%4,i=`.`.repeat(r)+`\xA0`.repeat(3-r);return b`
            <span class="loading-text">
                Loading
                <span class="dots">${i}</span>
            </span>
            <div>
                <span class="current-resource-name">
                    ${t.currentResourceName||b`
                        &nbsp;
                    `}
                </span>
                <div class="progress-track">
                    <div
                        class="progress-fill"
                        style=${P`
                            width: ${t.progressPercent}%;
                        `}
                    ></div>
                </div>
            </div>
        `}}),te=`antha-asset`;function ne(e={}){let t=e.loadingScreenFadeMs??1e3;return C({modName:te,async cleanup({state:e}){await e.assetLoader?.destroy()},execute({hostElement:n,state:r,engine:i}){if(r.assetLoader||=new O({logger:i.log}),r.assetLoader.advanceLoadState({currentTick:i.currentTick,engineTime:i.engineTime}),e.hideLoadingScreen)return;let a=r.assetLoader.loadState;if(a&&(a.completedAt==null||i.engineTime<=a.completedAt+t)){let r=a.total>0?a.current/a.total*100:0;return b`
                    <${Q.assign({hostElement:n,options:e,progressPercent:r,dotCount:Math.floor(i.engineTime/500)%4,completed:a.completedAt!=null,currentResourceName:a.currentResourceName,loadingScreenFadeMs:t})}></${Q}>
                `}}})}function re(){return function(e){return C({modName:`antha-bootstrap`,execute({engine:t,state:n}){let r=n.assetLoader;if(!r||n.hasStartedBootstrap)return A;n.hasStartedBootstrap=!0;let i=r.createLoadSession();return i.reportProgress({current:0,currentResourceName:e.assetName||`Game code`,total:0}),Promise.resolve().then(()=>e.loadModule()).then(async a=>{let o=await e.bootstrap({assetLoader:r,engine:t,loadSession:i,module:a,state:n});t.currentMods.push(...o.mods),i.complete()}).catch(e=>{i.complete(),t.log.error(a(e,`Failed to bootstrap game.`))}),A}})}}var $=F()({tagName:`vir-game`,events:{loadingScreenRendered:h()},styles:P`
        :host {
            background: black;
            display: block;
            height: 100%;
            overflow: hidden;
            position: relative;
            width: 100%;
        }

        ${j} {
            display: block;
            height: 100%;
            padding: 0;
            position: relative;
            width: 100%;
        }
    `,state(){return{engine:new p({mods:[ne({loadingScreenFadeMs:500,virtualHeight:T.height,virtualWidth:T.width}),re()({assetName:`Game code`,async loadModule(){return await g(()=>import(`./load-game-CacwU5H5.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8]))},bootstrap({assetLoader:e,engine:t,loadSession:n,module:r,state:i}){return r.bootstrapGame({assetLoader:e,engine:t,loadSession:n,state:i})}})]}),cleanup:void 0}},init({dispatch:e,events:t,state:n,updateState:r}){let i=n.engine.observable.listen(!1,()=>{i(),e(new t.loadingScreenRendered({detail:void 0}))});r({cleanup:i})},cleanup({state:e}){e.cleanup?.()},render({state:e}){return b`
            <${j.assign({engine:e.engine})}></${j}>
        `}});F()({tagName:`vir-app`,styles:P`
        :host {
            color: ${v.colors[`theme-default`].foreground.value};
            display: block;
            font-family: sans-serif;
            height: 100%;
            width: 100%;
            ${z}
        }
    `,state(){let e=new Y;return e.setSelectedTheme(G.Dark),{hasRenderedGameLoadingScreen:!1,themeClient:e}},cleanup({state:e}){e.themeClient.destroy()},render({state:e,updateState:t}){return b`
            <${$}
                ${L($.events.loadingScreenRendered,()=>{t({hasRenderedGameLoadingScreen:!0})})}
            ></${$}>
            ${e.hasRenderedGameLoadingScreen?S:b`
                      <slot></slot>
                  `}
        `}});