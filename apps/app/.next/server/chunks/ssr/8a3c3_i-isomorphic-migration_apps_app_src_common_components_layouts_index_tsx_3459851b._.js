module.exports=[70658,a=>{"use strict";a.s(["default",()=>$],70658);var b=a.i(35524),c=a.i(79120),d=a.i(45377),e=a.i(76063),f=a.i(386),g=a.i(55275),h=a.i(25705),i=a.i(57705),j=a.i(5187),k=a.i(90048);let l=(0,g.createContext)({hideNavbar:()=>{}}),m=({title:a,href:d,icon:f,onClick:h,className:i="",children:m,hideIcon:n=!1})=>{let{hideNavbar:o}=(0,g.use)(l),[p,q]=(0,g.useState)(!1),r=d?.includes("http"),s="#"===d,t=(0,e.usePathname)(),u=`flex items-center gap-2 py-2 pl-4 pr-2.5 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 hover:dark:text-neutral-300 rounded-lg group ${t===d?"bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:!text-neutral-200":"hover:dark:lg:bg-neutral-800 hover:dark:!text-neutral-300 hover:lg:bg-neutral-200 hover:lg:rounded-lg lg:transition-all lg:duration-300"}`,v=()=>{o(),h&&h()},w={className:`${u} ${i}`,onClick:v,onMouseEnter:()=>{q(!0)},onMouseLeave:()=>{q(!1)}},x=t===d,y=()=>(0,b.jsxs)("div",{...w,children:[!n&&(0,b.jsx)("div",{className:(0,c.default)("transition-all duration-300 group-hover:-rotate-12",x&&"animate-pulse"),children:f}),(0,b.jsx)("div",{className:"ml-0.5 flex-grow",children:a}),m&&(0,b.jsx)(b.Fragment,{children:m}),x&&(0,b.jsx)(k.BsArrowRightShort,{size:22,className:"animate-pulse text-gray-500"}),r&&p&&(0,b.jsx)(k.BsArrowRightShort,{size:22,className:"-rotate-45 text-gray-500 lg:transition-all lg:duration-300"})]});return s?(0,b.jsx)("div",{className:"cursor-pointer",children:y()}):(0,b.jsx)(j.default,{href:d,target:r?"_blank":"",onClick:v,children:y()})},n=({title:a,list:c})=>(0,b.jsxs)("div",{className:"flex flex-col space-y-1",children:[a&&(0,b.jsx)("div",{className:"mb-2 ml-2 mt-1 hidden  text-sm text-neutral-600 dark:text-neutral-500 lg:block",children:a}),c?.map((a,c)=>(0,b.jsx)(m,{...a},c))]}),o=()=>{let a=i.MENU_ITEMS?.filter(a=>a?.isShow);return i.MENU_APPS?.filter(a=>a?.isShow),(0,b.jsx)(b.Fragment,{children:(0,b.jsx)(n,{list:a})})};var p=a.i(53317),q=a.i(6220),r=a.i(23),s=a.i(14314),t=a.i(98087),u=g,v=a.i(50265);function w(a,b){if("function"==typeof a)return a(b);null!=a&&(a.current=b)}class x extends u.Component{getSnapshotBeforeUpdate(a){let b=this.props.childRef.current;if(b&&a.isPresent&&!this.props.isPresent){let a=b.offsetParent,c=(0,t.isHTMLElement)(a)&&a.offsetWidth||0,d=this.props.sizeRef.current;d.height=b.offsetHeight||0,d.width=b.offsetWidth||0,d.top=b.offsetTop,d.left=b.offsetLeft,d.right=c-d.width-d.left}return null}componentDidUpdate(){}render(){return this.props.children}}function y({children:a,isPresent:c,anchorX:d,root:e}){let f=(0,u.useId)(),h=(0,u.useRef)(null),i=(0,u.useRef)({width:0,height:0,top:0,left:0,right:0}),{nonce:j}=(0,u.useContext)(v.MotionConfigContext),k=function(...a){return g.useCallback(function(...a){return b=>{let c=!1,d=a.map(a=>{let d=w(a,b);return c||"function"!=typeof d||(c=!0),d});if(c)return()=>{for(let b=0;b<d.length;b++){let c=d[b];"function"==typeof c?c():w(a[b],null)}}}}(...a),a)}(h,a?.ref);return(0,u.useInsertionEffect)(()=>{let{width:a,height:b,top:g,left:k,right:l}=i.current;if(c||!h.current||!a||!b)return;let m="left"===d?`left: ${k}`:`right: ${l}`;h.current.dataset.motionPopId=f;let n=document.createElement("style");j&&(n.nonce=j);let o=e??document.head;return o.appendChild(n),n.sheet&&n.sheet.insertRule(`
          [data-motion-pop-id="${f}"] {
            position: absolute !important;
            width: ${a}px !important;
            height: ${b}px !important;
            ${m}px !important;
            top: ${g}px !important;
          }
        `),()=>{o.contains(n)&&o.removeChild(n)}},[c]),(0,b.jsx)(x,{isPresent:c,childRef:h,sizeRef:i,children:u.cloneElement(a,{ref:k})})}let z=({children:a,initial:c,isPresent:d,onExitComplete:e,custom:f,presenceAffectsLayout:h,mode:i,anchorX:j,root:k})=>{let l=(0,q.useConstant)(A),m=(0,g.useId)(),n=!0,o=(0,g.useMemo)(()=>(n=!1,{id:m,initial:c,isPresent:d,custom:f,onExitComplete:a=>{for(let b of(l.set(a,!0),l.values()))if(!b)return;e&&e()},register:a=>(l.set(a,!1),()=>l.delete(a))}),[d,l,e]);return h&&n&&(o={...o}),(0,g.useMemo)(()=>{l.forEach((a,b)=>l.set(b,!1))},[d]),g.useEffect(()=>{d||l.size||!e||e()},[d]),"popLayout"===i&&(a=(0,b.jsx)(y,{isPresent:d,anchorX:j,root:k,children:a})),(0,b.jsx)(s.PresenceContext.Provider,{value:o,children:a})};function A(){return new Map}var B=a.i(44356);let C=a=>a.key||"";function D(a){let b=[];return g.Children.forEach(a,a=>{(0,g.isValidElement)(a)&&b.push(a)}),b}let E=({children:a,custom:c,initial:d=!0,onExitComplete:e,presenceAffectsLayout:f=!0,mode:h="sync",propagate:i=!1,anchorX:j="left",root:k})=>{let[l,m]=(0,B.usePresence)(i),n=(0,g.useMemo)(()=>D(a),[a]),o=i&&!l?[]:n.map(C),s=(0,g.useRef)(!0),t=(0,g.useRef)(n),u=(0,q.useConstant)(()=>new Map),[v,w]=(0,g.useState)(n),[x,y]=(0,g.useState)(n);(0,r.useIsomorphicLayoutEffect)(()=>{s.current=!1,t.current=n;for(let a=0;a<x.length;a++){let b=C(x[a]);o.includes(b)?u.delete(b):!0!==u.get(b)&&u.set(b,!1)}},[x,o.length,o.join("-")]);let A=[];if(n!==v){let a=[...n];for(let b=0;b<x.length;b++){let c=x[b],d=C(c);o.includes(d)||(a.splice(b,0,c),A.push(c))}return"wait"===h&&A.length&&(a=A),y(D(a)),w(n),null}let{forceRender:E}=(0,g.useContext)(p.LayoutGroupContext);return(0,b.jsx)(b.Fragment,{children:x.map(a=>{let g=C(a),p=(!i||!!l)&&(n===x||o.includes(g));return(0,b.jsx)(z,{isPresent:p,initial:(!s.current||!!d)&&void 0,custom:c,presenceAffectsLayout:f,mode:h,root:k,onExitComplete:p?void 0:()=>{if(!u.has(g))return;u.set(g,!0);let a=!0;u.forEach(b=>{b||(a=!1)}),a&&(E?.(),y(t.current),i&&m?.(),e&&e())},anchorX:j,children:a},g)})})};var F=a.i(9166),G=a.i(5678),H=a.i(96317);let I=(0,g.createContext)({isOpen:!1,setIsOpen:()=>{}}),J=()=>{let{setIsOpen:a}=(0,g.use)(I),c=()=>a(!0);return(0,b.jsxs)("div",{className:"flex items-center gap-3 rounded-lg border-[1.8px] border-neutral-300 bg-neutral-100 px-3 py-1 text-neutral-500 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900",children:[(0,b.jsx)(H.FiSearch,{size:28}),(0,b.jsx)("span",{onClick:()=>c(),onKeyDown:a=>{"Enter"===a.key&&(a.preventDefault(),c())},className:"w-full text-[15px] hover:cursor-text",role:"button",tabIndex:0,"aria-label":"Open search command palette",children:"Search"}),(0,b.jsxs)("div",{className:"flex items-center gap-0.5 rounded bg-neutral-200 px-1 py-0.5 text-xs dark:bg-neutral-800",children:[(0,b.jsx)(G.BiCommand,{className:"mt-0.5"}),(0,b.jsx)("span",{children:"k"})]})]})};var K=a.i(98957);let L=()=>{let{resolvedTheme:a,setTheme:c}=(0,d.useTheme)();return(0,b.jsxs)(M,{className:"flex",children:[(0,b.jsx)("input",{checked:"dark"===a,type:"checkbox",className:"mode-toggle",onChange:()=>c("light"===a?"dark":"light"),id:"switch-theme","data-umami-event":`Switch to ${"light"===a?"Dark":"Light"} Mode`}),(0,b.jsxs)("label",{className:"mode-toggle-label",htmlFor:"switch-theme",children:[(0,b.jsx)("span",{className:"sr-only",children:"Toggle dark/light mode"}),(0,b.jsxs)("svg",{width:"45",height:"25",viewBox:"0 0 300 170",xmlns:"http://www.w3.org/2000/svg",children:[(0,b.jsxs)("defs",{children:[(0,b.jsxs)("linearGradient",{id:"bg-night",children:[(0,b.jsx)("stop",{className:"bg-stop-start",offset:"0%"}),(0,b.jsx)("stop",{className:"bg-stop-end",offset:"100%"})]}),(0,b.jsx)("filter",{id:"glow",children:(0,b.jsx)("feDropShadow",{dx:"0",dy:"0",stdDeviation:"8",floodColor:"#ffffff",floodOpacity:"0.75"})}),(0,b.jsx)("filter",{id:"glow-mini",children:(0,b.jsx)("feDropShadow",{dx:"0",dy:"0",stdDeviation:"0.5",floodColor:"#ffffff",floodOpacity:"0.5"})})]}),(0,b.jsx)("rect",{className:"bg",width:"300",height:"170",rx:"90",ry:"90",fill:"url(#bg-night)"}),(0,b.jsx)("circle",{className:"source",cx:"0",cy:"0",r:"70",fill:"#ffffff",style:{filter:"url(#glow)"}}),(0,b.jsxs)("g",{className:"stars",children:[(0,b.jsx)("circle",{className:"star-1",cx:"190",cy:"50",r:"4",fill:"#ffffff",style:{filter:"url(#glow-mini)"}}),(0,b.jsx)("circle",{className:"star-2",cx:"250",cy:"70",r:"4",fill:"#ffffff",style:{filter:"url(#glow-mini)"}}),(0,b.jsx)("circle",{className:"star-3",cx:"220",cy:"130",r:"6",fill:"#ffffff",style:{filter:"url(#glow-mini)"}})]})]})]})]})},M=K.default.div`
	.mode-toggle {
		width: 0;
		height: 0;
		margin: 0;
		display: none;
	}

	.mode-toggle + label {
		display: inline-block;
		cursor: pointer;
		border-radius: 25px;
		position: relative;
	}

	.mode-toggle + label::after {
		content: "";
		display: block;
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		border-radius: 1000px;
		transition: box-shadow 150ms ease-in-out;
	}

	.mode-toggle + label svg {
		vertical-align: middle;
	}

	.mode-toggle + label .source {
		transition:
			fill,
			transform 250ms ease-in-out;
	}

	.mode-toggle + label .bg-stop-start,
	.mode-toggle + label .bg-stop-end {
		transition: stop-color 150ms ease-in-out;
	}

	.mode-toggle + label .stars {
		transition: 50ms ease-in-out;
	}

	.mode-toggle + label::after {
		box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.25);
	}

	.mode-toggle + label .source {
		fill: #f7f7e7;
		transform: translate(70%, 50%);
	}

	.mode-toggle + label .bg-stop-start {
		stop-color: #93d4cc;
	}

	.mode-toggle + label .bg-stop-end {
		stop-color: #c7dfc3;
	}

	.mode-toggle + label .stars {
		transform: translateX(100%);
	}

	.mode-toggle:checked + label::after {
		box-shadow: none;
	}

	.mode-toggle:checked + label .source {
		fill: #ffffff;
		transform: translate(30%, 50%);
	}

	.mode-toggle:checked + label .bg-stop-start {
		stop-color: #173754;
	}

	.mode-toggle:checked + label .bg-stop-end {
		stop-color: #388296;
	}

	.mode-toggle:checked + label .stars {
		transform: translateX(0);
	}

	.mode-toggle:checked + label .star-1,
	.mode-toggle:checked + label .star-2,
	.mode-toggle:checked + label .star-3 {
		animation-name: star;
		animation-duration: 2s;
		animation-iteration-count: infinite;
	}

	.mode-toggle:checked + label .star-1 {
		animation-delay: 0s;
	}

	.mode-toggle:checked + label .star-2 {
		animation-delay: 0.5s;
	}

	.mode-toggle:checked + label .star-3 {
		animation-delay: 1s;
	}

	@keyframes star {
		50% {
			opacity: 0.25;
		}
	}
`;var N=a.i(38345);let O=()=>(0,b.jsx)(N.motion.div,{className:"my-3 flex h-screen flex-col",initial:{y:-100},animate:{opacity:1,y:0},transition:{duration:.3},children:(0,b.jsx)(o,{})}),P=({expandMenu:a,setExpandMenu:d})=>(0,b.jsx)(Q,{className:"flex lg:hidden",onClick:()=>{d(!a)},children:[{index:1},{index:2},{index:3}].map(d=>(0,b.jsx)(R,{className:(0,c.default)("bg-neutral-950 dark:bg-neutral-100 ",a&&"active")},d.index))}),Q=K.default.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 21px;
	width: 26px;
	cursor: pointer;
`,R=K.default.span`
	width: 100%;
	height: 3px;
	transition: all 0.5s ease;
	border-radius: 10px;

	&.active:nth-of-type(1),
	&.active:nth-of-type(3) {
		transform-origin: left;
	}
	&.active:nth-of-type(1) {
		transform: rotate(45deg);
	}
	&.active:nth-of-type(2) {
		width: 0;
	}
	&.active:nth-of-type(3) {
		transform: rotate(-45deg);
	}
`;var S=a.i(64516),T=a.i(64314);let U=({expandMenu:a,imageSize:d})=>(0,b.jsxs)("div",{className:(0,c.default)("flex w-full flex-grow items-center gap-4 lg:flex-col lg:items-start lg:gap-0.5 lg:px-2",a&&"flex-col !items-start"),children:[(0,b.jsx)(T.default,{src:"/images/avatar.jpg",alt:"Adam",width:a?80:d,height:a?80:d,rounded:"rounded-full",className:"rotate-3 dark:border-neutral-600 lg:hover:scale-105"}),(0,b.jsx)("div",{children:(0,b.jsxs)("div",{children:[(0,b.jsxs)("div",{className:"mt-1 flex items-center gap-2 lg:mt-4",children:[(0,b.jsx)(j.default,{href:"/",passHref:!0,children:(0,b.jsx)("h2",{className:"flex-grow  text-lg font-medium lg:text-xl",children:"Adam"})}),(0,b.jsx)(S.MdVerified,{size:18,className:"text-blue-400"})]}),(0,b.jsx)("div",{className:"hidden text-[15px] text-neutral-600 transition-all duration-300 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-400 lg:flex",children:"@qinshi0930"})]})})]}),V=({isScrolled:a=!1})=>{let d=(0,F.default)(),e=(0,g.useCallback)(()=>{let b=d?40:80;return!d&&a&&(b=55),b},[d]),[f,h]=(0,g.useState)(!1),i=(0,g.useMemo)(()=>({hideNavbar:()=>{h(!1)}}),[]);return(0,g.useEffect)(()=>(f?document.body.style.overflow="hidden":document.body.style.overflow="auto",()=>{document.body.style.overflow="auto"}),[f]),(0,b.jsx)(l,{value:i,children:(0,b.jsxs)("div",{className:(0,c.default)("fixed z-20 w-full bg-background p-5 shadow-sm dark:border-b dark:border-neutral-800 sm:shadow-none lg:relative lg:border-none lg:!bg-transparent lg:p-0",f&&"pb-0"),children:[(0,b.jsxs)("div",{className:"flex items-start justify-between lg:flex-col lg:space-y-4",children:[(0,b.jsx)(U,{expandMenu:f,imageSize:e()}),!d&&(0,b.jsxs)("div",{className:"flex justify-between w-full items-center",children:[(0,b.jsxs)("div",{className:"flex items-center gap-1 pl-2",children:[(0,b.jsxs)("span",{className:"relative flex size-3",children:[(0,b.jsx)("span",{className:"absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"}),(0,b.jsx)("span",{className:"relative inline-flex size-3 rounded-full bg-green-500"})]}),(0,b.jsx)("p",{className:"text-sm",children:"Open for collabs!"})]}),(0,b.jsx)(L,{})]}),d&&(0,b.jsxs)("div",{className:(0,c.default)("mt-2 flex items-center gap-5 lg:hidden",f&&"h-[120px] flex-col-reverse !items-end justify-between pb-1"),children:[(0,b.jsx)(L,{}),(0,b.jsx)(P,{expandMenu:f,setExpandMenu:h})]})]}),d&&(0,b.jsx)(E,{children:f&&(0,b.jsxs)("div",{className:"space-y-5 pt-6",children:[(0,b.jsx)(J,{}),(0,b.jsx)(O,{})]})})]})})},W=()=>{let[a,c]=(0,g.useState)(!1),{width:d}=(0,f.useWindowSize)();return(0,g.useEffect)(()=>{let a=()=>{c((window.pageYOffset||document.documentElement.scrollTop)>0)};return window.addEventListener("scroll",a),()=>{window.removeEventListener("scroll",a)}},[]),(0,b.jsxs)("div",{id:"sidebar",className:"sticky top-0 z-10 flex flex-col space-y-6 transition-all duration-300 lg:py-6",children:[(0,b.jsx)(V,{isScrolled:a}),!(d<1024)&&(0,b.jsxs)("div",{className:"space-y-3",children:[(0,b.jsx)(h.default,{className:"mx-1"}),(0,b.jsx)(o,{})]})]})},X=()=>(0,b.jsx)("header",{className:"lg:w-1/5",children:(0,b.jsx)(W,{})});var Y=a.i(98451);let Z=()=>{let{setIsOpen:a}=(0,g.use)(I),[d,f]=(0,g.useState)(!1),h=(0,e.usePathname)(),k=i.MENU_ITEMS.filter(a=>a.isShow&&"Home"!==a.title);return(0,b.jsxs)("header",{children:[(0,b.jsxs)("div",{className:"mx-8 hidden items-center justify-between gap-5 py-8 lg:flex",children:[(0,b.jsxs)("div",{className:"flex items-center gap-5",children:[(0,b.jsx)(T.default,{src:"/images/avatar.jpg",alt:"Adam",width:40,height:40,rounded:"rounded-full",className:"rotate-3 border-2 border-neutral-400 dark:border-neutral-600 lg:hover:scale-105"}),!d&&(0,b.jsxs)("div",{className:"flex items-center gap-3",children:[(0,b.jsx)(j.default,{href:"/",passHref:!0,children:(0,b.jsx)("h2",{className:"flex-grow text-lg font-medium lg:text-xl",children:"Adam"})}),(0,b.jsx)(Y.default,{title:"Verified",children:(0,b.jsx)(S.MdVerified,{size:18,className:"text-blue-400","data-aos":"flip-right"})})]})]}),(0,b.jsxs)("div",{className:"flex items-center justify-between gap-5",children:[d&&(0,b.jsx)("div",{className:"flex items-center gap-6","data-aos":"flip-up",children:k.map((a,d)=>(0,b.jsx)(j.default,{href:a.href,passHref:!0,className:(0,c.default)("text-neutral-700 hover:text-neutral-800 dark:text-neutral-400 hover:dark:text-neutral-100",h===a?.href&&"!text-neutral-800 dark:!text-neutral-100"),children:(0,b.jsx)("div",{children:a.title})},d))}),!d&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(L,{}),(0,b.jsx)(G.BiCommand,{onClick:()=>a(!0),className:"cursor-pointer",size:20})]}),(0,b.jsx)("button",{type:"button",className:"flex items-center gap-2 rounded-md border p-2 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900",onClick:()=>f(!d),children:d?(0,b.jsx)(S.MdClose,{size:18}):(0,b.jsx)(H.FiMenu,{size:18})})]})]}),(0,b.jsx)("div",{className:"block lg:hidden",children:(0,b.jsx)(V,{})})]})},$=({children:a})=>{let{resolvedTheme:h}=(0,d.useTheme)(),i=(()=>{let[a,b]=(0,g.useState)(!1);return(0,g.useEffect)(()=>{b(!0)},[]),a})(),{width:j}=(0,f.useWindowSize)(),k=(0,e.usePathname)(),l=k.split("/")[1],m="playground"===l||"blog"===l||k.startsWith("/blog/")||k.startsWith("/learn/");return(0,b.jsx)(b.Fragment,{children:(0,b.jsxs)("div",{className:(0,c.default)("mx-auto flex min-h-screen max-w-6xl flex-col",i&&"dark"===h?"dark:text-darkText":""),children:[m?(0,b.jsxs)("div",{className:"flex flex-1 flex-col xl:pb-8",children:[(0,b.jsx)(Z,{}),(0,b.jsx)("main",{className:"flex-1 transition-all duration-300",children:a})]}):(0,b.jsxs)("div",{className:"flex flex-1 flex-col lg:flex-row lg:gap-2 lg:py-4 xl:pb-8",children:[(0,b.jsx)(X,{}),(0,b.jsx)("main",{className:"mx-auto flex-1 max-w-[915px] transition-all duration-300 lg:w-4/5",children:a})]}),(0,b.jsxs)("footer",{className:"mt-auto flex justify-center gap-1 py-6 text-sm text-neutral-600 dark:text-neutral-400",children:[(0,b.jsx)("span",{children:"ICP备案号："}),(0,b.jsx)("a",{href:"https://beian.miit.gov.cn/",target:"_blank",rel:"noreferrer noopener",className:"hover:text-neutral-900 dark:hover:text-neutral-200",children:"赣ICP备2025078961号"})]})]})})}}];

//# sourceMappingURL=8a3c3_i-isomorphic-migration_apps_app_src_common_components_layouts_index_tsx_3459851b._.js.map