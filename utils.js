/*
 * by Fire Crow
 * http://firecrow.com
 */

if(typeof window == 'undefined') window = {}; 
if(typeof window.utils == 'undefined') window.utils = {}; 
if(typeof window.utils.dom == 'undefined') window.utils.dom = {}; 

ELEMENT_NODE = 1;  
TEXT_NODE = 3;

(function(ns){ 
	ns.map = function(list, func){
		var res = [], i = 0, len = list.length;
		while(len--){ res.push(func(list[i++])); }
		return res;
	}
	
	ns.filter = function(list, func){
		var res = [], i = 0, len = list.length;
		while(len--){ 
			var itm = list[i++]; 
			if(func(itm)){ res.push(itm); } 
		} 
		return res;
	}

	ns.reduce = function(list, func){
		var res = list[0], i = 1, len = list.length-1;
		while( len-- ){ res = func(res, list[i], list, i++); }
		return res;
	}

})(window.utils); 

(function(ns){ 
	var doc = document; 
	ns.clear = function(node){
		var len = node.childNodes.length;
		while(len--){ 
				node.removeChild(node.firstChild); 
		}
	}
	ns.mknode = function(obj/*, var args */){
		if(arguments.length > 1){
			var frag = doc.createDocumentFragment();
			for(var i = 0, len = arguments.length; i < len; i++){
				frag.appendChild(ns.mknode(arguments[i]));
			} 
			return frag;
		} 
		if(obj instanceof HTMLElement){ 
			return obj;
		}
		if(obj instanceof DocumentFragment){ 
			return obj;
		}
		if(typeof obj == 'string'){ 
			return doc.createTextNode(obj); 
		}
		var node = doc.createElement(obj.nodeName); 
		ns._alternode(node, obj.attributes, 'setAttribute'); 
		ns._alternode(node, obj.style, 'style'); 
		ns._alternode(node, obj.properties); 
		if(obj.children){
			node.appendChild(ns.mknode.apply(null, obj.children)); 
		} 
		return node;
	} 
	ns._alternode = function(node, values, property){
		if(!property){
			for(var p in values){ node[p] = values[p]; } 
		}else if(typeof node[property] == 'function'){ 
			for(var p in values){ node[property](p, values[p]); } 
		}else{
			for(var p in values){ node[property][p] = values[p]; } 
		}
	} 
  var q = function(root, r, funcli){
    if(r.length == 0){// create branches if empty
      for(var i = 0, l = funcli.length; l--; i++){
        r[i] = [];
      }
    }
    for(var i = 0, l = root.childNodes.length; l--; i++){
      var node = root.childNodes[i]; 
      if(node.nodeType != ELEMENT_NODE){ 
        continue;
      }
      // push each node to the corresponding functions that it matches to 
      for (var ii = 0, ll = funcli.length; ll--; ii++){
        if(funcli[ii](node)){ 
          r[ii].push(node);
        }
      }
      if(node.hasChildNodes()){ 
        q(node, r, funcli);
      }
    }
  }
  ns.query = q;

})(window.utils.dom); 
