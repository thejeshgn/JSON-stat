/*

JSON-stat Javascript Utilities Suite v. 2.5.0 (requires JJT 0.10+) (Nodejs module)
https://json-stat.com
https://github.com/badosa/JSON-stat/tree/master/utils

Copyright 2018 Xavier Badosa (https://xavierbadosa.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied. See the License for the specific language governing
permissions and limitations under the License.

*/

/* jshint newcap:false */
var
	JSONstat=require("jsonstat"),
	JSONstatUtils=function(){
		"use strict";

		//////////////////////////////////////////////////////
		//tbrowser and killconst removed in nodejs module

		//on error returns null; on success, html table string
		//jsonstat {dsid: , na:, caption:, vlabel:, slabel:, status:, }
		function datalist(jsonstat, options){
			if(typeof jsonstat==="undefined"){
				return null;
			}

			if(typeof options==="undefined"){
				options={};
			}

			var
				trs="",
				tfoot="",
				ncols=0,
				na=options.na || "n/a", //for empty cells in the resulting datalist table
				dsid=options.dsid || 0,
				vlabel=options.vlabel || null, //take default value from toTable
				slabel=options.slabel || null, //take default value from toTable
				counter=options.counter || false,
				tblclass=options.tblclass || "",
				numclass=options.numclass || "",
				valclass=options.valclass || "",
				shstatus=options.status || false,
				locale=options.locale || "en-US",
				source=options.source || "Source",
				ds=dataset(jsonstat, dsid),

				format=(Number.toLocaleString) ?
					function(n){
						return n.toLocaleString(locale);
					}
					:
					function(n){
						return n;
					},

				trows=(counter) ?
					function(r,i){
						trs+=(i) ? '<tr><td class="'+numclass+'">'+i+'</td>' : '<tr><th class="'+numclass+'">#</th>';
						r.forEach(function(e,c){
							var
								cls=(colvalue===c) ? ' class="'+numclass+" "+valclass+'"' : '',
								val=(e===null) ? na : format(e)
							;

							trs+=(i) ? '<td'+cls+'>'+val+'</td>' : '<th'+cls+'>'+val+'</th>';
						});
						trs+="</tr>";
					}
					:
					function(r,i){
						trs+='<tr>';
						r.forEach(function(e,c){
							var
								cls=(colvalue===c) ? ' class="'+numclass+" "+valclass+'"' : '',
								val=(e===null) ? na : format(e)
							;

							trs+=(i) ? '<td'+cls+'>'+val+'</td>' : '<th'+cls+'>'+val+'</th>';
						});
						trs+="</tr>";
					}
			;

			if(!checkds(ds)){
				return null;
			}

			var
				table=ds.toTable({
					status: shstatus,
					vlabel: vlabel,
					slabel: slabel
				}),
				colvalue=table[0].length-1
			;

			table.forEach( function(r,i){ trows(r,i); } );

			if(ds.source){
				ncols=ds.length+1;
				if(counter) ncols++;
				if(shstatus) ncols++;

				source+=": "+ds.source;
				if(source.slice(-1)!==".") source+=".";

				tfoot='<tfoot><td colspan="'+ncols+'">'+source+'</td></tfoot>';
			}

			return '<table class="'+tblclass+'"><caption>'+(options.caption || ds.label || "")+'</caption>'+tfoot+'<tbody>'+trs+"</tbody></table>";
		}

		//Since 2.4.2 ovalue, ostatus
		function fromTable(tbl, options){
			if(typeof tbl==="undefined"){
				return null;
			}

			if(typeof options==="undefined"){
				options={};
			}

			if(typeof options.ovalue!=="boolean"){
				options.ovalue=false;
			}
			if(typeof options.ostatus!=="boolean"){
				options.ostatus=false;
			}

			var
				vlabel=options.vlabel || "Value",
				slabel=options.slabel || "Status",
				type=options.type || "array", //default is array as in .toTable()
				label=options.label || "",
				header=options.header || null, //internal option for rich CSV (CSV-stat) v. 2.3.3

				id=[],
				size=[],
				value=[],
				status=[],
				odims={},
				dimension={},
				getPos=function(e,size){
					var
						mult=1,
						res=0
					;
					for(var i=0; i<dims; i++){
						mult*=(i>0) ? size[(dims-i)] : 1;
						res+=mult*e[dims-i-1];
					}
					return res;
				},
				valuestatus=function(){
					var v=tbl[dd][vlabel];
					value[getPos(pos, size)]=( isNaN(v) ) ? null : v;
				}
			;

			//Convert to "arrobj". Not efficient but simple.
			switch(type){
				case "array":
					//From array to arrobj
					tbl=(function(tbl){
						var
							head=tbl[0],
							arr=tbl.slice(1)
						;

						var arrobj=[];
						for(var d=0, dlen=arr.length; d<dlen; d++){
							for(var f=0, flen=head.length, o={}; f<flen; f++){
								o[head[f]]=arr[d][f];
							}
							arrobj.push(o);
						}
						return arrobj;
					})(tbl);
				break;

				case "object":
					//From object to arrobj
					tbl=(function(tbl){
						var
							head=tbl.cols.map(function(e) {return e.id;}),
							//Pending: retrieve labels
							arr=tbl.rows
						;

						var arrobj=[];
						for(var d=0, dlen=arr.length; d<dlen; d++){
							for(var f=0, flen=head.length, o={}; f<flen; f++){
								o[head[f]]=arr[d].c[f].v;
							}
							arrobj.push(o);
						}
						return arrobj;
					})(tbl);
				break;
			}

			var
				hdim,
				obs=tbl.length
			;

			if(options.hasOwnProperty("drop") && Object.prototype.toString.call(options.drop)==="[object Array]" && options.drop.length){
				tbl.forEach(function(row){
					options.drop.forEach(function(d){
						delete row[d];
					});
				});
			}

			//Dimensions are taken from first observation
			for(var field in tbl[0]){
				if(field!==vlabel){
					if(field!==slabel){
						id.push(field);

						//if rich
						if(header){
							hdim=header.dimension[field];
							odims[field]=hdim.category.index;
						}else{
							odims[field]=[];
							for(var j=0; j<obs; j++){
								var e=tbl[j][field];

								if(odims[field].indexOf(e)===-1){
									odims[field].push(e);
								}
							}
						}
						size.push(odims[field].length);

						dimension[field]={
							"label": header ? hdim.label : field,
							"category": {
								"index": odims[field]
							}
						};

						if(header){
							dimension[field].category.label=hdim.category.label;
							if(hdim.category.unit){
								dimension[field].category.unit=hdim.category.unit;
							}
						}
					}else{ //status field is present
						valuestatus=function(){
							var
								v=tbl[dd][vlabel],
								s=tbl[dd][slabel]
							;
							value[getPos(pos, size)]=( isNaN(v) ) ? null : v;//when missing na string
							status[getPos(pos, size)]=( s==="" ) ? null : s; //when missing status, there will be a blank string
						};
					}
				}
			}

			var dims=id.length;

			for(var dd=0; dd<obs; dd++){
				var pos=[];
				for(var i=0; i<dims; i++){
					var d=id[i];
					pos.push( odims[d].indexOf(tbl[dd][d]) );
				}
				valuestatus();
			}

			/* For JSON-stat<2.00
			dimension.id=id;
			dimension.size=size;
			*/

			var ret={
				"version": "2.0",
				"class": "dataset",
				"value": value,
				"dimension": dimension,

				//JSON-stat 2.00+
				"id": id,
				"size": size
			};

			//Since 3.0.0 we don't write these optional properties if not set
			if(label){
				ret.label=label; //it will be rewritten if rich (header set)
			}
			if(status.length){
				ret.status=status;
			}

			if(header){
				if(header.label){
					ret.label=header.label;
				}
				if(header.source){
					ret.source=header.source;
				}
				if(header.updated){
					ret.updated=header.updated;
				}
				if(header.href){
					ret.href=header.href;
				}
				if(header.role){
					ret.role=header.role;
				}
			}


			//in fromTable (and as a consequence in fromCSV), vs. fromSDMX,
			//ovalue and ostatus is done in a post processing (because it as added mainly
			//for jsonstat-conv where speed is not super important)
			if(options.ovalue){
				ret.value=arr2obj(ret, "value");
			}
			if(options.ostatus && ret.hasOwnProperty("status")){
				ret.status=arr2obj(ret, "status");
			}

			return ret;
		}

		//o object p property
		function arr2obj(o,p){
			var ret={};

			if(Object.prototype.toString.call(o[p]) === '[object Array]'){
				o[p].forEach(function(e,i){
					if(e!==null){
						ret[String(i)]=e;
					}
				});

				return ret;
			}

			return o[p];
		}

		//s string del delimiter
		function dcomma(s,del){
			if(typeof s==="undefined" || s===null){
				return "";
			}
			return (s.indexOf(del)!==-1) ? '"'+ s +'"' : s;
		}

		//jsonstat, {rich, dsid, delimiter, decimal, na, [ignored if rich: vlabel, slabel, status], [ignored if not rich: separator]}
		//Returns text (CSV or JSV[JSON-stat Comma Separed values or "CSV-stat" -Rich CSV-])
		function toCSV(jsonstat, options){
			if(typeof jsonstat==="undefined"){
				return null;
			}

			if(typeof options==="undefined"){
				options={};
			}

			var
				csv="",
				header="jsonstat",
				rich=(options.rich===true), //2.3.0 Default: false (backward compat)

				//The following options are ignored when rich
				//When rich, toTable uses field=id and vlabel/slabel are ignored
				vlabel=rich ? "value" : (options.vlabel || "Value"), //Same default as .toTable()
				slabel=rich ? "status" : (options.slabel || "Status"), //Same default as .toTable()
				status=(options.status===true), //Same default as .toTable(). If rich, it will be rewritten and set according to ds content

				na=options.na || "n/a",

				delimiter=options.delimiter || ",",
				separator=options.separator || "|", //2.3.0 only if rich
				decimal=(delimiter===";") ?
					(options.decimal || ",")
					:
					(options.decimal || "."),
				dsid=options.dsid || 0,
				ds=dataset(jsonstat, dsid)
			;

			if(!checkds(ds)){
				return null;
			}

			//If rich, include status if available
			if(rich){
				status=(ds.status!==null);
			}

			var
				table=ds.toTable({
					vlabel: vlabel,
					slabel: slabel,
					status: status,
					field: rich ? "id" : "label",
					content: rich ? "id" : "label",
					type: "array"
				}),
				vcol=table[0].indexOf(vlabel),
				scol=status ? table[0].indexOf(slabel) : -1
			;

			table.forEach(function(r, j){
				r.forEach(function(c, i){
					if(j && i===vcol){
						if( c===null ){
							r[i]=dcomma(na,delimiter);
						}else{
							if(decimal!=="."){
								r[i]=String(r[i]).replace(".", decimal);
							}
						}
					}else{
						if(j && i===scol && c===null){
							r[i]=""; //Status does not use n/a because usually lacking of status means "normal".
						}else{
							r[i]=dcomma(r[i],delimiter);
						}
					}
				});

				csv+=r.join(delimiter)+"\n";
			});

			if(rich){
				header+=delimiter+decimal+delimiter+separator+"\n";
				["label", "source", "updated", "href"].forEach(function(s){
					if(ds[s]){
						header+=s+delimiter+dcomma(ds[s],delimiter)+"\n";
					}
				});

				//dimensions
				ds.id.forEach(function(e,i){
					var
						unit=[],
						dim=ds.Dimension(i),
						role=dim.role,
						hasUnit=false
					;

					header+="dimension"+delimiter+dcomma(e,delimiter)+delimiter+dcomma(dim.label,delimiter)+delimiter+dim.length;

					if(role==="metric" && dim.__tree__.category.unit){
						hasUnit=true;
					}

					//categories
					dim.id.forEach(function(e,i){
						var
							u=[],
							cat=dim.Category(i)
						;
						header+=delimiter+dcomma(e,delimiter)+delimiter+dcomma(cat.label,delimiter);
						if(hasUnit){
							u.push(
								cat.unit.hasOwnProperty("decimals") ? cat.unit.decimals : ""
							);
							u.push(cat.unit.label||"");
							if(cat.unit.symbol){
								u.push(cat.unit.symbol);
								u.push(cat.unit.position);
							}
							unit.push(dcomma( u.join(separator), delimiter));
						}
					});

					if(role!==null && role!=="classification"){
						header+=delimiter+dim.role;
						if(hasUnit){
							header+=delimiter+unit.join(delimiter);
						}
					}

					header+="\n";
				});

				csv=header+"data\n"+csv;
			}

			return csv;
		}

		//csv, {delimiter, decimal, vlabel, slabel, label, ostatus, ovalue} All options ignored if rich
		//Returns JSONstat
		function fromCSV(csv, options){
			if(typeof csv==="undefined"){
				return null;
			}

			if(typeof options==="undefined"){
				options={};
			}

			var
				header=[],
				vcol=null,
				obj=null,
				nrows,
				i,
				roleExist=false,
				role={ time: [], geo: [], metric: [] },
				separator,

				rich=(csv.substring(0,8)==="jsonstat"), //Rich CSV (CSV-stat)
				//All options will be ignored if rich
				vlabel=rich ? "value" : options.vlabel,
				slabel=rich ? "status" : options.slabel,

				delimiter=rich ? csv.substring(8,9) : (options.delimiter || ","), //CSV column delimiter
				decimal=(delimiter===";") ?
					(options.decimal || ",")
					:
					(options.decimal || "."),
				table=CSVToArray( csv.trim(), delimiter )
			;

			if(rich){
				decimal=table[0][1];
				separator=table[0][2];

				table.shift();
				while(table[0][0]!=="data"){
					header.push(table.shift());
				}
				table.shift();

				obj={ dimension: {} };
				header.forEach(function(e){
					var i, label, len, dim, cat, unit, id, lab;
					switch (e[0]) {
						case "dimension":
							obj.dimension[e[1]]={};
							dim=obj.dimension[e[1]];
							dim.label=e[2];
							dim.category={};
							cat=dim.category;
							cat.index=[]; //Ignore index returned by fromTable(): take ids order from header

							label={};
							len=(e[3]*2)+3;
							if(e.length>=len){
								for(i=4; i<len; i++){ //3=4-1
									id=e[i];
									lab=e[++i];
									Object.defineProperty( label, id, {
										value: lab,
										writable: true,
										configurable: true,
										enumerable: true
									});

									cat.label=label;
									cat.index.push(id);
								}

								//role info available?
								if(typeof e[i]==="string" && ["time", "geo", "metric"].indexOf(e[i])!==-1){
									role[e[i]].push(e[1]);
									roleExist=true;

									//Unit info available?
									if(e[i]==="metric" && typeof e[++i]==="string"){
										cat.unit={};
										//For each category extract unit info
										cat.index.forEach(function(c,j){
											var u=e[i+j].split(separator);
											cat.unit[c]={};
											unit=cat.unit[c];

											if(typeof u[0]!=="undefined" && u[0]!==""){
												unit.decimals=u[0]*1;
											}
											if(typeof u[1]!=="undefined" && u[1]!==""){
												unit.label=u[1];
											}
											if(typeof u[2]!=="undefined" && u[2]!==""){
												unit.symbol=u[2];
											}
											if(typeof u[1]!=="undefined" && ["start","end"].indexOf(u[3])!==-1){
												unit.position=u[3];
											}
										});
									}
								}
							}
						break;
						case "label":
						case "source":
						case "updated":
						case "href":
							obj[e[0]]=e[1] || null;
						break;
						//No default case: ignore lines with unknown tags. If known tags are void, empty string
					}
				});

				if(roleExist){
					if(!role.time.length){
						delete role.time;
					}
					if(!role.geo.length){
						delete role.geo;
					}
					if(!role.metric.length){
						delete role.metric;
					}
					obj.role=role;
				}
			}

			nrows=table.length;
			i=table[0].length;

			//2.1.3: If no vlabel, last column used
			if(typeof vlabel!=="undefined"){
				for(;i--;){
					if(table[0][i]===vlabel){
						vcol=i;
						break;
					}
				}
				if(vcol===null){
					return null; //vlabel not found in the CSV
				}
			}else{//simple standard CSV without status: value is last column
				vcol=i-1;
				vlabel=table[0][vcol];
			}

			if(decimal===","){
				for(i=1; i<nrows; i++){
					table[i][vcol]=Number(table[i][vcol].replace(",", "."));
				}
			}else{
				for(i=1; i<nrows; i++){
					table[i][vcol]=Number(table[i][vcol]);
				}
			}

			return fromTable(
				table, {
					header: obj, //internal option for rich (CSV-stat)
					vlabel: vlabel,
					slabel: slabel,
					type: "array",
					label: options.label || "", //It will be rewritten if rich,
					ovalue: options.ovalue || false,
					ostatus: options.ostatus || false
				})
			;
		}

		//Private

		function checkds(ds){
			if(ds===null || ds.length===0 || ds.class!=="dataset"){
				return false;
			}

			for(var i=ds.length, len=1; i--;){
				len*=ds.Dimension(i).length;
			}
			if(len!==ds.n){
				return false;
			}
			return true;
		}

		String.prototype.capitalize=function() {
			return this.charAt(0).toUpperCase() + this.slice(1);
		};

		//CSVToArray by Ben Nadel: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
		function CSVToArray( strData, strDelimiter ){
			// Check to see if the delimiter is defined. If not,
			// then default to comma.
			strDelimiter = (strDelimiter || ",");

			// Create a regular expression to parse the CSV values.
			var
				objPattern = new RegExp(
					(
					// Delimiters.
					"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
					// Quoted fields.
					"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
					// Standard fields.
					"([^\"\\" + strDelimiter + "\\r\\n]*))"
					),
					"gi"
				),
				// Create an array to hold our data. Give the array
				// a default empty first row.
				arrData = [[]],
				// Create an array to hold our individual pattern
				// matching groups.
				arrMatches = null,
				strMatchedValue,
				strMatchedDelimiter
			;

			// Keep looping over the regular expression matches
			// until we can no longer find a match.
			while (arrMatches = objPattern.exec( strData )){
				// Get the delimiter that was found.
				strMatchedDelimiter = arrMatches[ 1 ];

				// Check to see if the given delimiter has a length
				// (is not the start of string) and if it matches
				// field delimiter. If id does not, then we know
				// that this delimiter is a row delimiter.
				if (
					strMatchedDelimiter.length &&
					(strMatchedDelimiter != strDelimiter)
					){
					// Since we have reached a new row of data,
					// add an empty row to our data array.
					arrData.push( [] );
				}

				// Now that we have our delimiter out of the way,
				// let's check to see which kind of value we
				// captured (quoted or unquoted).
				if (arrMatches[ 2 ]){
					// We found a quoted value. When we capture
					// this value, unescape any double quotes.
					strMatchedValue = arrMatches[ 2 ].replace(
						new RegExp( "\"\"", "g" ),
						"\""
					);
				}else{
					// We found a non-quoted value.
					strMatchedValue = arrMatches[ 3 ];
				}

				// Now that we have our value string, let's add
				// it to the data array.
				arrData[ arrData.length - 1 ].push( strMatchedValue );
			}

			// Return the parsed data.
			return( arrData );
		}

		function dataset(j, dsid){
			if(typeof j==="undefined" || j===null){
				return null;
			}
			if(
				typeof j==="string" || //uri (synchronous!)
				typeof j.length==="undefined" //JSON-stat response
				){
				j=JSONstat(j);
			}

			if(j.length===0 ||
				(
					j.class!=="dataset" &&
					j.class!=="collection" &&
					j.class!=="bundle"
				)
			){
				return null;
			}

			return (j.class==="dataset") ? j : j.Dataset(dsid);
		}

		//Takes an array of JSON-stat 2.0 Dataset responses
		function join(arrobj, options){
			if(typeof arrobj==="undefined" ||
				Object.prototype.toString.call(arrobj) !== "[object Array]"
			){
				return null;
			}

			var
				arr=JSON.parse( JSON.stringify(arrobj) ), //clone
				output=arr[0]
			;

			if(!output.hasOwnProperty("version") || //Not JSON-stat v.2.0
				!output.hasOwnProperty("class") ||
				output.class!=="dataset"
			){
				return null;
			}

			if(typeof options==="undefined"){
				options={};
			}

			var
				dslabel=(typeof options.label==="undefined") ? null : options.label,
				dimid=(typeof options.by==="undefined") ? null : options.by,
				input=[]
			;

			//Join metadata+data1+data2+...
			if(dimid===null){
				for(var i=1, len=arr.length; i<len; i++){
					input=input.concat( arr[i].value ); //or .push.apply
				}

				output.value=input;

				if(dslabel!==null){
					output.label=dslabel;
				}

				return output;
			}

			//Join by dimension
			var
				index, label, unit,
				oAdd=function(o, e, i){
					if(Object.prototype.toString.call(o) === "[object Array]"){
						o=o.concat(e);
					}else{
						for(var p in e){
							o[p]=(e[p]===0) ? i : e[p];
						}
					}
					return o;
				}
			;

			arr.forEach(function(e, i){
				var
					tbl=JSONstat(e).toTable({ status: true }),
					cat=e.dimension[dimid].category
				;

				//header
				if(i===0){
					input=[tbl[0]];
					index=cat.index;
					label=cat.label;
					unit=cat.unit;
				}else{
					index=oAdd(index, cat.index, i);
					label=oAdd(label, cat.label, i);
					unit=oAdd(unit, cat.unit, i);
				}
				input=input.concat( tbl.slice(1) ); //or .push.apply
			});

			var ds=fromTable(input);

			output.value=ds.value;
			output.size=ds.size;
			output.status=ds.status || null;
			output.label=dslabel || "";
			output.href=null;

			output.dimension[dimid].category.index=index || null;
			output.dimension[dimid].category.label=label || null;
			output.dimension[dimid].category.unit=unit || null;

			return output;
		}

		//Since 2.4.0. Input: SDMX-JSON flat flavor
		//Options (ovalue, ostatus) added in 2.4.2
		function fromSDMX(sdmx, options){
			if(typeof sdmx!=="object" || !sdmx.hasOwnProperty("dataSets") || Object.prototype.toString.call(sdmx.dataSets) !== "[object Array]"){
				return null;
			}

			//Only support for flat format with 1 dataset
			if(sdmx.dataSets.length!==1){
				return null;
			}
			//Only flat flavor is supported (no series)
			if(!sdmx.dataSets[0].hasOwnProperty("observations")){ //better to look for dataset with "action": "Information"?
				return null;
			}

			if(typeof options==="undefined"){
				options={
					ovalue: false, //array
					ostatus: false //array
				};
			}else{
				if(typeof options.ovalue!=="boolean"){
					options.ovalue=false;
				}
				if(typeof options.ostatus!=="boolean"){
					options.ostatus=false;
				}
			}

			var
				meta=sdmx.structure,
				data=sdmx.dataSets[0].observations, //assuming one dataset and flat flavor
				attr=meta.attributes.observation,
				dim=meta.dimensions
			;

			if(!dim.hasOwnProperty("observation")){
				return null;
			}
			//series not null or empty {}?
			if(dim.hasOwnProperty("series") && (dim.series!==null || Object.keys(dim.series).length) ){
				return null;
			}

			var
				id=[],
				size=[],
				dimension={},
				statusId=[],
				role={ time: [], geo: [] /*, metric: [] no metric so far*/ },
				assignStatus=function(){}, //void unless there's status info

				getValueIndex=function(jsonstat, indices){
					var size=jsonstat.size;

					//If metadata at the dataSet level, indices.length<size.length: difference must be filled with 0
					for( var j=size.length-indices.length; j--; ){
						indices.push(0);
					}

					for( var i=0, ndims=size.length, num=0, mult=1; i<ndims; i++ ){
						mult*=( i>0 ) ? size[ndims-i] : 1;
						num+=mult*indices[ndims-i-1];
					}

					return num;
				},
				getDimInfo=function(o){
					dimension[o.id]={ label: o.name };

					if(o.hasOwnProperty("role")){
						switch(o.role){
							case "REF_AREA": role.geo.push(o.id); break;
							case "TIME_PERIOD": role.time.push(o.id); break;
							//case "UNIT_MEASURE": attribute
						}
					}

					Object.defineProperty(dimension[o.id], "category", {
						value: { index: [], label: {} },
						writable: true,
						enumerable: true
					});

					id.push(o.id);
					size.push(o.values.length);

					var cat=dimension[o.id].category;
					o.values.forEach(function(v){
						cat.index.push(v.id);

						Object.defineProperty(cat.label, v.id, {
							value: v.name,
							writable: true,
							enumerable: true
						});
					});
				},

				self=sdmx.header.links.find(function(e){return e.rel==="request";}),
				statusPos=attr.findIndex(function(e){return e.id==="OBS_STATUS";})
			;

			if(statusPos!==-1){
				//any status value?
				if(!attr[statusPos].values.length){
					statusPos=-1;
				}else{
					statusId=attr[statusPos].values;
				}
			}

			//Metadata: obs level
			dim.observation.forEach(getDimInfo);

			//Metadata: dataset level [constant dimensions]
			//Even though in OECD's API "Dimensions and attributes with only one requested value are not yet moved to dataset level even though the draft specification (see example message) would allow this"
			if(dim.hasOwnProperty("dataSet")){
				dim.dataSet.forEach(getDimInfo);
			}

			//Void dataset
			var stat={
				version: "2.0",
				class: "dataset",
				updated: sdmx.header.prepared || null, //Not exactly the same thing... but publicationYear and publicationPeriod usually missing
				source: sdmx.header.sender.name || null, //Not exactly the same thing...
				label: meta.name || null,
				id: id,
				size: size,
				dimension: dimension,
				value: options.ovalue ? {} : []
			};

			if(self){
				stat.link={
					alternate: [
						{
							type: "application/vnd.sdmx.data+json",
							href: self.href
						}
					]
				};
			}

			//No metric so far (metric treatment in SDMX/JSON-stat completely different)
			if(role.geo.length+role.time.length>0){
				if(!role.time.length){
					delete role.time;
				}
				if(!role.geo.length){
					delete role.geo;
				}
				stat.role=role;
			}

			//Keep status labels in extension (Eurostat-like)
			if(statusPos!==-1){
				stat.status=options.ostatus ? {} : [];
				stat.extension={ status: { label: {} } };
				statusId.forEach(function(e){
					stat.extension.status.label[e.id]=e.name;
				});

				assignStatus=(options.ostatus) ?
					function(){
						var statusVal=data[ndx][statusPos];
						if(statusVal!==null){
							stat.status[ getValueIndex(stat, posArr) ] = statusId[ statusVal ].id;
						}
					}
					:
					function(){
						var statusVal=data[ndx][statusPos];
						stat.status[ getValueIndex(stat, posArr) ] = statusVal===null ? null : statusId[ statusVal ].id;
					}
				;
			}

			//Data+Status
			statusPos++; //index 1 instead of 0 because obs array has value in pos 0.
			for(var ndx in data){
				var posArr=ndx.split(":");

				if(!options.ovalue || data[ndx][0]!==null){
					stat.value[ getValueIndex(stat, posArr) ] = data[ndx][0];
				}

				assignStatus();
			}

			//When array, padding with nulls if last values/status not set
			var k;
			if(!options.ovalue){
				for( k=size.reduce(function(a, b){ return a * b;})-stat.value.length; k--; ){
					stat.value.push(null);
				}
			}
			if(!options.ostatus && stat.hasOwnProperty("status")){
				for( k=size.reduce(function(a, b){ return a * b;})-stat.status.length; k--; ){
					stat.status.push(null);
				}
			}

			return stat;
		}

		return {
			datalist: datalist,
			fromTable: fromTable,
			fromCSV: fromCSV,
			toCSV: toCSV,
			join: join,
			fromSDMX: fromSDMX,
			version: "2.5.0"
		};
	}()
;

//nodejs
module.exports=JSONstatUtils;
