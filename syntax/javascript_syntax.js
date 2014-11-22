if(!window) window = {};
if(!window.firecrow) window.firecrow = {};

(function(ns){ 

    if(!(ns.TagPattern && ns.Parser && ns.TagPatternGroup))
        throw new Error('javascript syntax: requires "TagPattern" and "Parser" and "TagPatternGroup" not found in "ns"');

    /*
    var patterns = [];
    add_patterns = function(name, color, patterns_arg)
    {
        for(prop in patterns_arg)
            patterns.push(new ns.TagPattern(name, patterns_arg[prop], group));
    }

    add_word_patterns = function(name, patterns_arg)
    {
        for(prop in patterns_arg)
            patterns.push(new ns.TagWordPattern(name, patterns_arg[prop]));
    }

    make_patterns = function(name, patterns_arg)
    {
        var results = [];
        for(prop in patterns_arg)
            results.push(new ns.TagPattern(name, patterns_arg[prop]));
        return results;
    }
    
    //add_word_patterns('syntax-basic',['var','this']); 
    //add_word_patterns('syntax-reserved',['function','for','window']); 


    var syntax_string_quote = new ns.RegionTagPattern(
        'syntax-string',
        new ns.Pattern('"'),
        make_patterns('syntax-string-escape',['\\n','\\r','\\t','\\0']),
        new ns.Pattern('"')
    )
    patterns.push(syntax_string_quote);
    */

    // object properties and value
    var obj_props = new ns.TagPatternGroup('syntax-reserved',' rgb(150,150,150)', [
        'Array',
        'Date',
        'eval',
        'function',
        'hasOwnProperty',
        'Infinity',
        'isFinite',
        'isNaN',
        'isPrototypeOf',
        'length',
        'Math',
        'NaN',
        'name',
        'Number',
        'Object',
        'prototype',
        'String',
        'toString',
        'undefined',
        'valueOf'
    ]);

    var obj_reserved = new ns.TagPatternGroup('syntax-reserved',
        'rgb(150,150,150)', 
        ['.','=','+','!=','-','/'], 
        ['for','window']);
    var basic = new ns.TagPatternGroup('syntax-basic', 
        'rgb(100,100,100)', 
        ['{','}','[',']','.',';',''], 
        ['var','this']);
    var standout = new ns.TagPatternGroup('syntax-standout',
        'rgb(150,150,150)', 
        ['(',')']);

    ns.JSHighlighter = new ns.Parser(); 
    obj_props.add_to_parser(ns.JSHighlighter);
    obj_reserved.add_to_parser(ns.JSHighlighter)
    basic.add_to_parser(ns.JSHighlighter)
    standout.add_to_parser(ns.JSHighlighter)

    ns.js_groups = {
        obj_props:obj_props,
        obj_reserved:obj_reserved,
        basic: basic,
        standout:standout,
    }

})(window.firecrow);
