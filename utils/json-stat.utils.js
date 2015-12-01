var JSONstatUtils=function(){"use strict";function e(e){function t(t){void 0!==e.selector?e.selector.innerHTML=c[t]:window.alert(c[t])}function n(e,t,n){var r={filter:{}};return n.forEach(function(e){"rows"===e.name||"cols"===e.name?r[e.name]=e.value:r.filter[e.name]=e.value}),"rowscols"===t&&(r.filter={},e.id.forEach(function(t,n){t!==r.rows&&t!==r.cols&&(r.filter[t]=e.Dimension(n).id[0])})),r}function r(e,t){var n,r,i={},o=[],l=e.id;if(t){var a="bigger"===t?function(e,t){return e.len<t.len?1:-1}:function(e,t){return e.len>t.len?1:-1};e.Dimension().forEach(function(e,t){o.push({id:l[t],len:e.length})}),o.sort(a),n=o[0].id,r=o[1].id}else n=l[0],r=l[1];return e.Dimension(n).length<e.Dimension(r).length&&(n=r+(r=n,"")),l.forEach(function(t){t!==n&&t!==r&&(i[t]=e.Dimension(t).id[0])}),{rows:n,cols:r,filter:i}}function i(e){var t=[],n=[].slice.call(e.querySelectorAll("select, input"));return n.forEach(function(e){t.push({name:e.name,value:e.value})}),t}function o(e,t){var n=function(e,t){return e&&"metric"===e.role&&t.unit&&t.unit.hasOwnProperty("label")?" ("+t.unit.label+")":""};return t.label.capitalize()+n(e,t)}function l(e,t,n){var r,i='<select name="'+t+'">',l=[];if(null!==n[1]){if(r=e.id,l=e.Dimension(),2===r.length)return(e.Dimension(n[0]).label||n[0]).capitalize()}else{var a=e.Dimension(t);if(r=a.id,l=a.Category(),1===r.length)return}return r.forEach(function(e,t){var r=e!==n[0]?"":'selected="selected" ';(null===n[1]||e!==n[1])&&(i+="<option "+r+'value="'+e+'">'+o(a,l[t])+"</option>")}),i+="</select>"}function a(e,t,r){var s="",u="",d="",v="",h=r.rows,g=t.Dimension(h),p=g.id,m=r.cols,y=t.Dimension(m),b=y.id,w=t.role&&t.role.metric?t.role.metric[0]:null,D=null!==w?t.Dimension(w):null,S=function(e){return e.hasOwnProperty("unit")&&e.unit&&e.unit.hasOwnProperty("decimals")?e.unit.decimals:null},E=r.filter,O=JSON.parse(JSON.stringify(E)),j=[],C="",x="",R=t.source?c.source+": "+t.source+".":"",L=null!==t.label?'<span class="label">'+t.label.capitalize()+"</span>":"";d+="<caption>"+L,d+=' <form><fieldset id="rowscols"><legend>'+c.rc+"</legend>"+l(t,"rows",[h,m])+" <a>&#x2194;</a> "+l(t,"cols",[m,h])+"</fieldset>";for(var N in E){var q=t.Dimension(N),z=q.label.capitalize();q.length>1?C+="<p>"+l(t,N,[E[N],null])+" <strong>"+z+"</strong></p>":j.push({label:z,value:o(q,q.Category(0)),name:N,id:q.id[0]})}""!==C&&(C='<fieldset id="filters"><legend>'+c.filters+"</legend>"+C+"</fieldset>"),j.forEach(function(e){x+="<p>"+e.value+" <strong>"+e.label+'</strong></p><input type="hidden" name="'+e.name+'" value="'+e.id+'" />'}),""!==x&&(x='<fieldset id="constants"><legend>'+c.constants+"</legend>"+x+"</fieldset>"),d+=C+x+"</form></caption>",v+="<tbody>";var A=Number.toLocaleString?function(e,t){return null===t?e.toLocaleString(f):e.toLocaleString(f,{minimumFractionDigits:t,maximumFractionDigits:t})}:function(e,t){return null===t?e:e.toFixed(t)};return p.forEach(function(e){O[h]=e;var n=t.Data(O),r=function(e,t){var n=m!==w?null===D?null:S(D.Category(O[w])):S(y.Category(t)),r=null!==e.value?A(e.value,n):e.status||c.na;v+="<td>"+r+"</td>"};return null===n?void(v="ERROR"):(v+='<tr><th scope="row">'+o(g,g.Category(e))+"</th>","[object Array]"===Object.prototype.toString.call(n)?n.forEach(function(e,t){r(e,t)}):r(n,0),void(v+="</tr>"))}),"ERROR"===v?c.dataerror:(v+="</tbody>",s+="<thead><tr><th></th>",b.forEach(function(e){s+='<th scope="col">'+o(y,y.Category(e))+"</th>"}),s+="</tr></thead>",""!==R&&(u='<tfoot><tr><td colspan="'+(b.length+1)+'">'+R+"</td></tr></tfoot>"),e.innerHTML="<table>"+d+s+u+v+"</table>",[].slice.call(e.querySelectorAll("select")).forEach(function(r){r.addEventListener("change",function(r){a(e,t,n(t,r.target.parentElement.getAttribute("id"),i(e)))},!1)}),void e.querySelector("a").addEventListener("click",function(){r.cols=h,r.rows=m,a(e,t,r)},!1))}var s,u=function(e){for(var t=e.length,n=1;t--;)n*=e.Dimension(t).length;return n!==e.n?!1:!0},c=void 0===e.i18n||void 0===e.i18n.msgs?{selerror:'tbrowser: "selector" property is required!',urierror:'tbrowser: "jsonstat" property is required!',jsonerror:"Document is not valid JSON-stat.",dserror:"Dataset ID is not correct.",dimerror:"Only one dimension was found in the dataset. At least two are required.",dataerror:"Selection returned no data!",source:"Source",filters:"Filters",constants:"Constants",rc:"Rows &amp; Columns",na:"n/a"}:e.i18n.msgs,f=void 0===e.i18n||void 0===e.i18n.locale?"en-US":e.i18n.locale,d=e.dsid||0;if(void 0===e.selector)return void t("selerror");if(void 0===e.jsonstat)return void t("urierror");if(s="string"==typeof e.jsonstat?JSONstat(e.jsonstat):void 0===e.jsonstat.length?JSONstat(e.jsonstat):e.jsonstat,0===s.length)return void t("jsonerror");var v="dataset"===s["class"]?s:s.Dataset(d);return u(v)?null===v?void t("dserror"):1===v.length?void t("dimerror"):void a(e.selector,v,r(v,e.preset)):void t("jsonerror")}function t(e){var t=e.vfield||"Value",n=e.sfield||"Status",r=e.type||"array",i=e.table,o=[],l=[],a=[],s=[],u={},c={},f=function(e,t){for(var n=1,r=0,i=0;m>i;i++)n*=i>0?t[m-i]:1,r+=n*e[m-i-1];return r},d=function(){a[f(b,l)]=i[y][t]};switch(r){case"array":i=function(e){for(var t=e[0],n=e.slice(1),r=[],i=0,o=n.length;o>i;i++){for(var l=0,a=t.length,s={};a>l;l++)s[t[l]]=n[i][l];r.push(s)}return r}(i);break;case"object":i=function(e){for(var t=e.cols.map(function(e){return e.id}),n=e.rows,r=[],i=0,o=n.length;o>i;i++){for(var l=0,a=t.length,s={};a>l;l++)s[t[l]]=n[i].c[l].v;r.push(s)}return r}(i)}var v=i.length;for(var h in i[0])if(h!==t)if(h!==n){o.push(h),u[h]=[];for(var g=0;v>g;g++){var p=i[g][h];-1===u[h].indexOf(p)&&u[h].push(p)}l.push(u[h].length),c[h]={label:h,category:{index:u[h]}}}else d=function(){a[f(b,l)]=i[y][t],s[f(b,l)]=i[y][n]};for(var m=o.length,y=0;v>y;y++){for(var b=[],w=0;m>w;w++){var D=o[w];b.push(u[D].indexOf(i[y][D]))}d()}return c.id=o,c.size=l,{"class":"dataset",value:a,status:s,dimension:c}}function n(e){return t({table:r(e.csv,e.delimiter),vfield:e.vfield||"Value",sfield:e.sfield||"Status",type:"array"})}function r(e,t){t=t||",";for(var n,r,i=RegExp("(\\"+t+'|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^"\\'+t+"\\r\\n]*))","gi"),o=[[]],l=null;l=i.exec(e);)r=l[1],r.length&&r!=t&&o.push([]),n=l[2]?l[2].replace(RegExp('""',"g"),'"'):l[3],o[o.length-1].push(n);return o}return String.prototype.capitalize=function(){return this.charAt(0).toUpperCase()+this.slice(1)},{tbrowser:e,fromTable:t,fromCSV:n,version:"1.2.0"}}();