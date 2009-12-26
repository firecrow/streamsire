if(!window) window = {};
if(!window.firecrow) window.firecrow = {};

(function(ns){ 

    if(!(ns.TagPattern && ns.ParserInterface))
        throw new Error('javascript syntax: requires "TagPattern" and "ParserInterface" not found in "ns"');

    var patterns = [];
    add_patterns = function(name, patterns_arg)
    {
        for(prop in patterns_arg)
            patterns.push(new ns.TagPattern(name, patterns_arg[prop]));
    }

    make_patterns = function(name, patterns_arg)
    {
        var results = [];
        for(prop in patterns_arg)
            results.push(new ns.TagPattern(name, patterns_arg[prop]));
        return results;
    }
    
    add_patterns('syntax-basic',['var','{','}','[',']','.',';']); 
    add_patterns('syntax-reserved',['function','for','window','[',']','.']); 
    add_patterns('syntax-standout',['(',')']); 
    
    var syntax_string_quote = new ns.RegionTagPattern(
        'syntax-string',
        new ns.Pattern('"'),
        make_patterns('syntax-string-escape',['\\n','\\r','\\t','\\0']),
        new ns.Pattern('"')
    )
    patterns.push(syntax_string_quote);

    ns.JSHighlighter = new ns.Parser(); 
    ns.Parser.apply(ns.JSHighlighter, patterns);

})(window.firecrow);

