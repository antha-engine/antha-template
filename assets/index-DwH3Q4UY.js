const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/load-game-C9Wk2BC3.js","assets/rolldown-runtime-XKyaHtl9.js","assets/game-world-CXxsYXZy.js","assets/Geometry-DGHCW6R2.js","assets/init-BG-CwQVW.js","assets/canvasUtils-Bi70rviZ.js","assets/CanvasRenderer-B69VmyOg.js","assets/RenderTargetSystem-DHJgmfMM.js","assets/getTextureBatchBindGroup-DOCUYq_M.js"])))=>i.map(i=>d[i]);
import{A as e,C as t,Ct as n,E as r,F as i,Ft as a,I as o,M as s,P as c,T as l,Wt as u,Z as d,_t as f,a as p,at as m,b as ee,ct as h,d as g,f as _,g as v,h as y,ht as b,k as x,l as S,lt as C,mt as w,n as T,p as te,q as E,r as D,rt as O,s as k,u as A,v as j,w as M,x as N,y as P,yt as F}from"./game-world-CXxsYXZy.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function I(e,t){return L(e,t)}var L=r(class extends l{element;lastListenerMetaData;isPartDisconnected=!1;constructor(e){super(e),this.element=j(e,`listen`)}resetListener(e){this.removeCurrentListener(),this.lastListenerMetaData=e,this.isConnected&&this.addCurrentListener()}addCurrentListener(){this.lastListenerMetaData&&this.element.addEventListener(this.lastListenerMetaData.eventType,this.lastListenerMetaData.listener)}removeCurrentListener(){this.lastListenerMetaData&&this.element.removeEventListener(this.lastListenerMetaData.eventType,this.lastListenerMetaData.listener)}isMidDispatchDisconnect(e){return!this.element.isConnected&&e.composedPath().some(e=>e instanceof Node&&e.isConnected)}createListenerMetaData(e,t){return{eventType:e,callback:t,listener:e=>{if(!this.isPartDisconnected||this.isMidDispatchDisconnect(e))return this.lastListenerMetaData?.callback(e)}}}render(t,n){let r=typeof t==`string`?t:t.type;if(typeof r!=`string`)throw TypeError(`Cannot listen to an event with a name that is not a string. Given event name: '${String(r)}'`);return this.lastListenerMetaData&&this.lastListenerMetaData.eventType===r?this.lastListenerMetaData.callback=n:this.resetListener(this.createListenerMetaData(r,n)),e}disconnected(){this.isPartDisconnected=!0}reconnected(){this.isPartDisconnected=!1,this.addCurrentListener()}}),R=N`
    /* iOS Safari */
    -webkit-touch-callout: none;
    /* Safari */
    -webkit-user-select: none;
    /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
    user-select: none;
`,z=class extends u()(`local-storage-client-all-values-event`){},B=class{shapes;options;listenTarget=new f;keyEvents;get AllValuesType(){throw Error(`Cannot use AllValuesType as a runtime value. It is a type only.`)}get ValueType(){throw Error(`Cannot use ValueType as a runtime value. It is a type only.`)}constructor(e,t={}){this.shapes=e,this.options=t,this.storeName=t.storeName||`local-storage-client`,this.keyEvents=d(e,e=>class extends u()(`local-storage-client-${String(e)}-event`){}),this.get=d(this.shapes,e=>(t={})=>this.getAllValues(t)[e]),this.listen=d(this.shapes,e=>t=>this.listenTarget.listen(this.keyEvents[e],async e=>{await t(e.detail)})),this.set=d(this.shapes,e=>t=>{s(t,this.shapes[e],{allowExtraKeys:!0},`LocalStorageClient: Invalid value for key '${String(e)}'.`);let n=this.getAllValues();return n[e]=t,globalThis.localStorage.setItem(this.storeName,JSON.stringify(n)),this.listenTarget.dispatch(new z({detail:n})),this.listenTarget.dispatch(new this.keyEvents[e]({detail:t})),t}),this.delete=d(this.shapes,e=>()=>{let t=this.getAllValues();delete t[e],globalThis.localStorage.setItem(this.storeName,JSON.stringify(t)),this.listenTarget.dispatch(new z({detail:t})),this.listenTarget.dispatch(new this.keyEvents[e]({detail:void 0}))})}storeName;getAllValues({throwErrorOnFailure:e=!1}={}){return C(()=>{let t=JSON.parse(globalThis.localStorage.getItem(this.storeName)||`{}`);return m(t,(t,n)=>{let r=this.shapes[t];if(r){if(e)s(n,r,{allowExtraKeys:!0});else if(!c(n,r,{allowExtraKeys:!0}))return;return{key:t,value:n}}})},{handleError:t=>{if(e)throw a(t,`LocalStorageClient: store '${this.storeName}' is corrupt and cannot be loaded.`);return{}}})}listenToAllValues(e){return this.listenTarget.listen(z,async t=>{await e(t.detail)})}listen;get;set;delete;clear(){globalThis.localStorage.removeItem(this.storeName)}destroy(){this.listenTarget.destroy()}};function V(e){return[E(e.prefix),`theme-vir-style`].join(`-`)}function H(e,n,r){let i=w(F(e.colors).flatMap(e=>[U({layerKey:`background`,themeColor:e,themeOverride:n}),U({layerKey:`foreground`,themeColor:e,themeOverride:n})]));return t(i,V(e),r)}function U({layerKey:e,themeOverride:t,themeColor:n}){let r=String(n[e].name);return[r,t?.overrides[r]||n[e].default]}var W;(function(e){e.Light=`light`,e.Dark=`dark`,e.Auto=`auto`})(W||={});var G=class extends u()(`vira-theme-applied`){},K=({useDarkTheme:e})=>{H(_,e?te:void 0)},q=`(prefers-color-scheme: dark)`,J={selectedTheme:o({theme:i(W)})},Y=class extends f{applyThemeCallback=K;localStorageClient;storage;selectedTheme;appliedTheme;removeThemePreferenceListener=b(globalThis.matchMedia(q),`change`,e=>{n.instanceOf(e,MediaQueryListEvent),this.selectedTheme===W.Auto&&this.applySelection(W.Auto)});constructor(e={}){if(super(),e.applyTheme&&(this.applyThemeCallback=e.applyTheme),e.storage)this.storage=e.storage;else{let t=new B(J,{storeName:e.storeName||`vira-theme`});this.localStorageClient=t,this.storage={init:t.get.selectedTheme()?.theme,save(e){t.set.selectedTheme({theme:e})}}}this.selectedTheme=this.storage.init||W.Auto,this.applySelection(this.selectedTheme)}getCurrentTheme(){return this.selectedTheme}getAppliedTheme(){return this.appliedTheme||W.Light}setSelectedTheme(e){this.selectedTheme=e,this.applySelection(e),this.storage.save(e)}destroy(){this.removeThemePreferenceListener(),this.localStorageClient?.destroy(),super.destroy()}applySelection(e){let t=e===W.Dark||e===W.Auto&&globalThis.matchMedia(q).matches,n=t?W.Dark:W.Light;this.applyThemeCallback({useDarkTheme:t}),n!==this.appliedTheme&&(this.appliedTheme=n,this.dispatch(new G({detail:n})))}},X=1e3;function Z({hostElement:e,loadingScreenElement:t,options:n,screenSize:r}){let i=e.style.zoom?void 0:g({screenSize:r,virtualHeight:n.virtualHeight,virtualWidth:n.virtualWidth})?.scale;i==null?t.style.removeProperty(`zoom`):t.style.zoom=String(i)}var Q=P()({tagName:`antha-asset-loading-screen`,state(){return{resizeObserver:void 0}},cssVars:{"antha-asset-loading-screen-fade-ms":O({value:X,suffix:`ms`})},hostClasses:{"antha-asset-loading-screen-completed"({inputs:e}){return e.completed}},init({host:e,inputs:t,updateState:n}){let{resizeObserver:r}=v(t.hostElement,({contentRect:n})=>{Z({hostElement:t.hostElement,loadingScreenElement:e,options:t.options,screenSize:n})});n({resizeObserver:r})},cleanup({state:e}){e.resizeObserver?.disconnect()},styles({cssVars:e,hostClasses:t}){return N`
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
        `},render({host:e,inputs:t,cssVars:n}){M({forCssVar:n[`antha-asset-loading-screen-fade-ms`],onElement:e,toValue:O({value:t.loadingScreenFadeMs,suffix:`ms`})});let r=t.dotCount%4,i=`.`.repeat(r)+`\xA0`.repeat(3-r);return y`
            <span class="loading-text">
                Loading
                <span class="dots">${i}</span>
            </span>
            <div>
                <span class="current-resource-name">
                    ${t.currentResourceName||y`
                        &nbsp;
                    `}
                </span>
                <div class="progress-track">
                    <div
                        class="progress-fill"
                        style=${N`
                            width: ${t.progressPercent}%;
                        `}
                    ></div>
                </div>
            </div>
        `}}),ne=`antha-asset`;function re(e={}){let t=e.loadingScreenFadeMs??1e3;return S({modName:ne,async cleanup({state:e}){await e.assetLoader?.destroy()},execute({hostElement:n,state:r,engine:i}){if(r.assetLoader||=new D({logger:i.log}),r.assetLoader.advanceLoadState({currentTick:i.currentTick,engineTime:i.engineTime}),e.hideLoadingScreen)return;let a=r.assetLoader.loadState;if(a&&(a.completedAt==null||i.engineTime<=a.completedAt+t)){let r=a.total>0?a.current/a.total*100:0;return y`
                    <${Q.assign({hostElement:n,options:e,progressPercent:r,dotCount:Math.floor(i.engineTime/500)%4,completed:a.completedAt!=null,currentResourceName:a.currentResourceName,loadingScreenFadeMs:t})}></${Q}>
                `}}})}function ie(){return function(e){return S({modName:`antha-bootstrap`,execute({engine:t,state:n}){let r=n.assetLoader;if(!r||n.hasStartedBootstrap)return k;n.hasStartedBootstrap=!0;let i=r.createLoadSession();return i.reportProgress({current:0,currentResourceName:e.assetName||`Game code`,total:0}),Promise.resolve().then(()=>e.loadModule()).then(async a=>{let o=await e.bootstrap({assetLoader:r,engine:t,loadSession:i,module:a,state:n});t.currentMods.push(...o.mods),i.complete()}).catch(e=>{i.complete(),t.log.error(a(e,`Failed to bootstrap game.`))}),k}})}}var $=P()({tagName:`vir-game`,events:{loadingScreenRendered:ee()},styles:N`
        :host {
            background: black;
            display: block;
            height: 100%;
            overflow: hidden;
            position: relative;
            width: 100%;
        }

        ${A} {
            display: block;
            height: 100%;
            padding: 0;
            position: relative;
            width: 100%;
        }
    `,state(){return{engine:new p({mods:[re({loadingScreenFadeMs:500,virtualHeight:T.height,virtualWidth:T.width}),ie()({assetName:`Game code`,async loadModule(){return await h(()=>import(`./load-game-C9Wk2BC3.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8]))},bootstrap({assetLoader:e,engine:t,loadSession:n,module:r,state:i}){return r.bootstrapGame({assetLoader:e,engine:t,loadSession:n,state:i})}})]}),cleanup:void 0}},init({dispatch:e,events:t,state:n,updateState:r}){let i=n.engine.observable.listen(!1,()=>{i(),e(new t.loadingScreenRendered({detail:void 0}))});r({cleanup:i})},cleanup({state:e}){e.cleanup?.()},render({state:e}){return y`
            <${A.assign({engine:e.engine})}></${A}>
        `}});P()({tagName:`vir-app`,styles:N`
        :host {
            color: ${_.colors[`theme-default`].foreground.value};
            display: block;
            font-family: sans-serif;
            height: 100%;
            width: 100%;
            ${R}
        }
    `,state(){let e=new Y;return e.setSelectedTheme(W.Dark),{hasRenderedGameLoadingScreen:!1,themeClient:e}},cleanup({state:e}){e.themeClient.destroy()},render({state:e,updateState:t}){return y`
            <${$}
                ${I($.events.loadingScreenRendered,()=>{t({hasRenderedGameLoadingScreen:!0})})}
            ></${$}>
            ${e.hasRenderedGameLoadingScreen?x:y`
                      <slot></slot>
                  `}
        `}});