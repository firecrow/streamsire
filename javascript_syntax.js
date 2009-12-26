if(!window) window = {};
if(!window.firecrow) window.firecrow = {};

(function(ns){ 

    if(!(ns.TagPattern && ns.ParserInterface))
        throw new Error('javascript syntax: requires "TagPattern" and "ParserInterface" not found in "ns"');

    var patterns = [];
    add_patterns = function(name,patterns_arg)
    {
        for(prop in patterns_arg)
            patterns.push(new ns.TagPattern(name, patterns_arg[prop]));
    }
    
    add_patterns('syntax-keyword',['function','for','var','(',')','[',']','.']); 

    ns.JSHighlighter = new ns.Parser(); 
    ns.Parser.apply(ns.JSHighlighter, patterns);

})(window.firecrow);

