(this["webpackJsonpcioos-metadata-entry-form"]=this["webpackJsonpcioos-metadata-entry-form"]||[]).push([[0],{108:function(e,a,t){e.exports=t(124)},113:function(e,a,t){},124:function(e,a,t){"use strict";t.r(a);var n=t(0),r=t.n(n),l=t(10),o=t.n(l),c=(t(113),t(72)),i=t(14),s=t(11),u=t(27),m=t(7),p=t(73),d=t.n(p);t(114),t(117);d.a.initializeApp({apiKey:"AIzaSyAdlELZS5Lbea5NquotMT8amwO-Lc_7ogc",authDomain:"cioos-metadata-form.firebaseapp.com",databaseURL:"https://cioos-metadata-form.firebaseio.com",projectId:"cioos-metadata-form",storageBucket:"cioos-metadata-form.appspot.com",messagingSenderId:"646114203434",appId:"1:646114203434:web:bccceadc5144270f98f053"});var h=d.a,f=new h.auth.GoogleAuthProvider;f.setCustomParameters({promt:"select_account"});var E=h.auth(),b=t(3),v=t(153),g=t(25),O=t(161),y=t(163),C=t(164),w=t(169),j=t(170),S=t(171),k=t(172),I=t(173),x=t(174),N=t(156),W=t(158),A=t(159),L=t(160),R=t(51),B=t(189),P=t(127),D=t(165),M=t(190),T=t(166),H=t(167),z=t(168),G=t(20),J=t(16),U=t(22),q=t(47),F=Object(n.createContext)({user:null}),K=function(e){Object(U.a)(t,e);var a=Object(q.a)(t);function t(){var e;Object(G.a)(this,t);for(var n=arguments.length,r=new Array(n),l=0;l<n;l++)r[l]=arguments[l];return(e=a.call.apply(a,[this].concat(r))).state={user:null},e.componentDidMount=function(){E.onAuthStateChanged((function(a){e.setState({user:a})}))},e}return Object(J.a)(t,[{key:"render",value:function(){return r.a.createElement(F.Provider,{value:this.state.user},this.props.children)}}]),t}(n.Component),Z=Object(v.a)((function(e){return{root:{display:"flex"},appBar:{zIndex:e.zIndex.drawer+1,transition:e.transitions.create(["width","margin"],{easing:e.transitions.easing.sharp,duration:e.transitions.duration.leavingScreen})},appBarShift:{marginLeft:240,width:"calc(100% - ".concat(240,"px)"),transition:e.transitions.create(["width","margin"],{easing:e.transitions.easing.sharp,duration:e.transitions.duration.enteringScreen})},menuButton:{marginRight:36},hide:{display:"none"},drawer:{width:240,flexShrink:0,whiteSpace:"nowrap"},drawerOpen:{width:240,transition:e.transitions.create("width",{easing:e.transitions.easing.sharp,duration:e.transitions.duration.enteringScreen})},drawerClose:Object(m.a)({transition:e.transitions.create("width",{easing:e.transitions.easing.sharp,duration:e.transitions.duration.leavingScreen}),overflowX:"hidden",width:e.spacing(7)+1},e.breakpoints.up("sm"),{width:e.spacing(9)+1}),toolbar:Object(u.a)({display:"flex",alignItems:"center",justifyContent:"flex-end",padding:e.spacing(0,1)},e.mixins.toolbar),content:{flexGrow:1,padding:e.spacing(3)}}}));function $(e){var a,t,l=Object(i.e)(),o=Z(),c=Object(g.a)(),u=Object(n.useContext)(F),p=r.a.useState(!1),d=Object(s.a)(p,2),h=d[0],v=d[1];return r.a.createElement("div",{className:o.root},r.a.createElement(N.a,null),r.a.createElement(W.a,{position:"fixed",className:Object(b.a)(o.appBar,Object(m.a)({},o.appBarShift,h))},r.a.createElement(A.a,null,r.a.createElement(L.a,{color:"inherit","aria-label":"open drawer",onClick:function(){v(!0)},edge:"start",className:Object(b.a)(o.menuButton,Object(m.a)({},o.hide,h))},r.a.createElement(O.a,null)),r.a.createElement(R.a,{variant:"h6",noWrap:!0},"CIOOS Metadata Tool"))),r.a.createElement(B.a,{variant:"permanent",className:Object(b.a)(o.drawer,(a={},Object(m.a)(a,o.drawerOpen,h),Object(m.a)(a,o.drawerClose,!h),a)),classes:{paper:Object(b.a)((t={},Object(m.a)(t,o.drawerOpen,h),Object(m.a)(t,o.drawerClose,!h),t))}},r.a.createElement("div",{className:o.toolbar},r.a.createElement(L.a,{onClick:function(){v(!1)}},"rtl"===c.direction?r.a.createElement(y.a,null):r.a.createElement(C.a,null))),u&&r.a.createElement(P.a,{button:!0,key:"New Record"},r.a.createElement(D.a,null,r.a.createElement(M.a,{src:u.photoURL})),r.a.createElement(T.a,{primary:u.displayName})),r.a.createElement(H.a,null),r.a.createElement(z.a,null,r.a.createElement(P.a,{button:!0,key:"Home"},r.a.createElement(D.a,{onClick:function(){return l.push("/")}},r.a.createElement(w.a,null)),r.a.createElement(T.a,{primary:"Home"})),!u&&r.a.createElement(P.a,{button:!0,key:"Sign in"},r.a.createElement(D.a,{onClick:function(){return E.signInWithPopup(f).then((function(){return l.push("/")}))}},r.a.createElement(j.a,null)),r.a.createElement(T.a,{primary:"Sign in"})),u&&r.a.createElement(n.Fragment,null,r.a.createElement(P.a,{button:!0,key:"New Record"},r.a.createElement(D.a,{onClick:function(){return l.push("/new")}},r.a.createElement(S.a,null)),r.a.createElement(T.a,{primary:"New Record"})),r.a.createElement(P.a,{button:!0,key:"Contacts"},r.a.createElement(D.a,{onClick:function(){return l.push("/contacts")},disabled:!0},r.a.createElement(k.a,null)),r.a.createElement(T.a,{primary:"Contacts"})),r.a.createElement(P.a,{button:!0,key:"Saved Records"},r.a.createElement(D.a,{onClick:function(){return l.push("/submissions")}},r.a.createElement(I.a,null)),r.a.createElement(T.a,{primary:"Saved Records"})),r.a.createElement(P.a,{button:!0,key:"Logout"},r.a.createElement(D.a,{onClick:function(){return E.signOut().then((function(){return l.push("")}))}},r.a.createElement(x.a,null)),r.a.createElement(T.a,{primary:"Logout"})))),r.a.createElement(H.a,null)),r.a.createElement("main",{className:o.content},r.a.createElement("div",{className:o.toolbar}),e.children))}var _=function(){return r.a.createElement($,null,r.a.createElement("h1",null,"Home"),r.a.createElement(R.a,null,"Welcome home"))},V=function(){return r.a.createElement($,null,r.a.createElement("h1",null,"Submission received!"),r.a.createElement(R.a,null,"Thank you for your submission!"))},X=t(50),Y=t.n(X),Q=t(65),ee=t(4),ae=["oxygen","nutrients","nitrate","phosphate","silicate","inorganicCarbon","dissolvedOrganicCarbon","seaSurfaceHeight","seawaterDensity","potentialTemperature","potentialDensity","speedOfSound","seaIce","seaState","seaSurfaceSalinity","seaSurfaceTemperature","subSurfaceCurrents","subSurfaceSalinity","subSurfaceTemperature","surfaceCurrents"],te=["resourceProvider","custodian","owner","user","distributor","originator","pointOfContact","principalInvestigator","processor","publisher","author","sponsor","coAuthor","collaborator","editor","mediator","rightsHolder","contributor","funder","stakeholder"],ne=["deprecated","proposed","withdrawn","notAccepted","accepted","valid","tentative","superseded","retired","pending","final","underDevelopment","required","planned","onGoing","obsolete","historicalArchive","completed"],re=t(182),le=t(125),oe=t(191),ce=t(181),ie=t(178),se=r.a.memo((function(e){var a=e.onChange,t=(e.value,e.name),l=e.label,o=e.multiline,c=Object(n.useState)({en:"",fr:""}),i=Object(s.a)(c,2),p=i[0],d=i[1];function h(e){var n=Object(u.a)(Object(u.a)({},p),{},Object(m.a)({},e.target.name,e.target.value));d(n),a({target:{name:t,value:n}})}return r.a.createElement("div",null,r.a.createElement("h5",null,l),r.a.createElement("div",null,r.a.createElement(oe.a,{name:"en",fullWidth:!0,onChange:h,InputProps:{startAdornment:r.a.createElement(ie.a,{position:"start"},"EN")},multiline:o})),r.a.createElement("div",null,r.a.createElement(oe.a,{fullWidth:!0,name:"fr",onChange:h,InputProps:{startAdornment:r.a.createElement(ie.a,{position:"start"},"FR")},multiline:o})))}),(function(e,a){return e.value===a.value})),ue=t(177),me=t(193),pe=t(179),de=t(188),he=r.a.memo((function(e){var a=e.onChange,t=e.value,l=e.name,o=e.label,c=e.options,i=e.optionLabels,u=Object(n.useState)([]),m=Object(s.a)(u,2),p=m[0],d=m[1];return r.a.createElement(ue.a,{style:{minWidth:120}},r.a.createElement(me.a,{id:"demo-simple-select-label"},o),c.map((function(e,n){return r.a.createElement(pe.a,{key:e,control:r.a.createElement(de.a,{key:e,value:e,name:l,checked:t.includes(e),onChange:function(e){var t,n,r=e.target.value,o=(t=r,(n=p).includes(t)?n.filter((function(e){return e!==t})):n.concat(t));d(o),a({target:{name:l,value:o}})}}),label:i[n]})})))}),(function(e,a){return e.value===a.value})),fe=t(186),Ee=t(180),be=r.a.memo((function(e){var a=e.value,t=e.name,n=e.label,l=e.options,o=e.optionLabels,c=e.onChange;return r.a.createElement(ue.a,{style:{minWidth:120}},r.a.createElement(me.a,{id:"demo-simple-select-label"},n),r.a.createElement(fe.a,{name:t,fullWidth:!0,value:a,onChange:c},l.map((function(e,a){return r.a.createElement(Ee.a,{key:e,value:e},o[a])}))))}),(function(e,a){return e.value===a.value})),ve=t(90),ge=t(19),Oe=t(185),ye=function(e){var a=e.onChange,t=e.value,n=e.name;return r.a.createElement(ge.a,{utils:ve.a},r.a.createElement(Oe.a,{margin:"normal",id:"date-picker-dialog",label:"Date picker dialog",format:"MM/dd/yyyy",value:t,onChange:function(e){return a({target:{name:n,value:e}})},KeyboardButtonProps:{"aria-label":"change date"}}))};function Ce(e){var a=e.replace(/([A-Z])/g," $1");return a.charAt(0).toUpperCase()+a.slice(1)}var we=function(e){Object(U.a)(t,e);var a=Object(q.a)(t);function t(e){var n;return Object(G.a)(this,t),(n=a.call(this,e)).handleInputChange=function(e){var a=arguments.length>1&&void 0!==arguments[1]&&arguments[1],t=e.target,r=t.name,l=t.value;a?n.setState((function(e){return Object(u.a)(Object(u.a)({},e),{},Object(m.a)({},a,Object(u.a)(Object(u.a)({},e[a]),{},Object(m.a)({},r,l))))})):n.setState((function(e){return Object(u.a)(Object(u.a)({},e),{},Object(m.a)({},r,l))}))},n.state={title:{en:"",fr:""},abstract:{en:"",fr:""},id:"",eov:[],role:"",progress:"",dateStart:new Date,records:{}},n}return Object(J.a)(t,[{key:"handleSubmitClick",value:function(){var e=Object(Q.a)(Y.a.mark((function e(){return Y.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,h.database().ref("test").push(this.state);case 2:this.props.history.push("/success");case 3:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"render",value:function(){var e=this;return r.a.createElement(re.a,{container:!0,direction:"column",justify:"space-between",alignItems:"stretch"},r.a.createElement(le.a,{className:this.props.classes.paper},r.a.createElement("h1",null,"CIOOS Metadata Profile Intake Form"),r.a.createElement(R.a,null,"Welcome to the CIOOS metadata profile generation form! Please fill out each field with as much detail as you can. Using this information we will create your metadata profile for the given dataset.")),r.a.createElement(le.a,{className:this.props.classes.paper},r.a.createElement(R.a,null,"What is the title of the dataset?"),r.a.createElement(se,{label:"Enter a title",name:"title",value:this.state.title,onChange:function(a){return e.handleInputChange(a)}})),r.a.createElement(le.a,{className:this.props.classes.paper},r.a.createElement(R.a,null,"What is the ID for your dataset?"),r.a.createElement(oe.a,{type:"text",label:"Your Answer",name:"id",value:this.state.id,onChange:function(a){return e.handleInputChange(a)},fullWidth:!0,required:!0})),r.a.createElement(le.a,{className:this.props.classes.paper},r.a.createElement(R.a,null,"Select a role for your datase"),r.a.createElement(be,{label:"Select a role",name:"role",value:this.state.role,onChange:function(a){return e.handleInputChange(a)},options:te,optionLabels:te.map(Ce)})),r.a.createElement(le.a,{className:this.props.classes.paper},r.a.createElement(R.a,null,"Select EOVs that apply to your dataset"),r.a.createElement(he,{name:"eov",value:this.state.eov,onChange:function(a){return e.handleInputChange(a)},options:ae,optionLabels:ae.map(Ce)})),r.a.createElement(le.a,{className:this.props.classes.paper},r.a.createElement(R.a,null,"What is the progress?"),r.a.createElement(be,{label:"Select a role",name:"progress",value:this.state.progress,onChange:function(a){return e.handleInputChange(a)},options:ne,optionLabels:ne.map(Ce)})),r.a.createElement(le.a,{className:this.props.classes.paper},r.a.createElement(R.a,null,"What is the abstract for the dataset?"),r.a.createElement(se,{label:"Enter an abstract",name:"abstract",value:this.state.abstract,onChange:function(a){return e.handleInputChange(a)},multiline:!0})),r.a.createElement(le.a,{className:this.props.classes.paper},r.a.createElement(R.a,null,"What is the start date that data was collected?"),r.a.createElement(ye,{name:"dateStart",value:this.state.dateStart,onChange:this.handleInputChange})),r.a.createElement(ce.a,{variant:"contained",color:"primary",onClick:function(a){return e.handleSubmitClick(a)}},"Submit"))}}]),t}(n.Component),je=Object(ee.a)({root:{flexGrow:1,overflow:"hidden",padding:"10px"},paper:{padding:"10px",margin:"20px"}})(we);function Se(){return r.a.createElement($,null,r.a.createElement(je,null))}var ke=t(183),Ie=t(184),xe=function(e){Object(U.a)(t,e);var a=Object(q.a)(t);function t(e){var n;return Object(G.a)(this,t),(n=a.call(this,e)).state={records:{}},n}return Object(J.a)(t,[{key:"componentDidMount",value:function(){var e=Object(Q.a)(Y.a.mark((function e(){var a=this;return Y.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:h.database().ref("test").on("value",(function(e){a.setState({records:e.toJSON()})}));case 1:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}()},{key:"editRecord",value:function(e){this.props.history.push("/edit/".concat(e))}},{key:"deleteRecord",value:function(e){h.database().ref("test/".concat(e)).remove()}},{key:"render",value:function(){var e=this;return r.a.createElement($,null,r.a.createElement("h1",null,"Submission list"),r.a.createElement(R.a,null,"These are the submissions we have received:"),r.a.createElement(z.a,null,Object.entries(this.state.records).map((function(a){var t=Object(s.a)(a,2),n=t[0],l=t[1];return r.a.createElement(P.a,{button:!0,key:n},r.a.createElement(T.a,{primary:l.title.en}),r.a.createElement(D.a,{onClick:function(){return e.editRecord(n)}},r.a.createElement(ke.a,null)),r.a.createElement(D.a,{onClick:function(){return e.deleteRecord(n)}},r.a.createElement(Ie.a,null)))}))))}}]),t}(r.a.Component),Ne=function(){return r.a.createElement($,null,r.a.createElement("h1",null,"Contacts"),r.a.createElement(R.a,null,"Just a stub for now"))},We=function(){return r.a.createElement(K,null,r.a.createElement(c.a,{basename:"/"},r.a.createElement(i.a,{exact:!0,path:"/",component:_}),r.a.createElement(i.a,{path:"/new",component:Se}),r.a.createElement(i.a,{path:"/contacts",component:Ne}),r.a.createElement(i.a,{path:"/success",component:V}),r.a.createElement(i.a,{path:"/submissions",component:xe})))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(r.a.createElement(We,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[108,1,2]]]);
//# sourceMappingURL=main.3ff39f2e.chunk.js.map