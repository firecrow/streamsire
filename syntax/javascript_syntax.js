if(!window) window = {};
if(!window.firecrow) window.firecrow = {};

(function(ns){ 

    if(!(ns.TagPattern && ns.Parser))
        throw new Error('javascript syntax: requires "TagPattern" and "Parser" not found in "ns"');

    var patterns = [];
    add_patterns = function(name, patterns_arg)
    {
        for(prop in patterns_arg)
            patterns.push(new ns.TagPattern(name, patterns_arg[prop]));
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
    
    /*
    add_word_patterns('syntax-basic',['var','this']); 
    add_word_patterns('syntax-reserved',['function','for','window']); 
    */

    add_patterns('syntax-basic',['var','this']); 
    add_patterns('syntax-reserved',['function','for','window']); 
    add_patterns('syntax-basic',['{','}','[',']','.',';','']); 
    add_patterns('syntax-reserved',['.','=','+','!=','-','/']); 
    add_patterns('syntax-standout',['(',')']); 
    
    /*
    var syntax_string_quote = new ns.RegionTagPattern(
        'syntax-string',
        new ns.Pattern('"'),
        make_patterns('syntax-string-escape',['\\n','\\r','\\t','\\0']),
        new ns.Pattern('"')
    )
    patterns.push(syntax_string_quote);
    */

    ns.JSHighlighter = new ns.Parser(); 
    ns.Parser.apply(ns.JSHighlighter, patterns);

})(window.firecrow);
