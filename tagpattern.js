if(typeof window == 'undefined') window = {}; // for command line testing
if(!window.firecrow) window.firecrow = {};

(function(ns){// tag pattern and tag region pattern 

    if(!(ns.PatternInterface && ns.RegionPatternOverlay))
        throw new Error('tag_patterns: depends on "patterns", and "parser", no found in "ns"');

    function copyprops(to, from)
    { 
        for(prop in from)
            to[prop] = from[prop];
    }

    var Interface = function(){};
        Interface.prototype = new ns.PatternInterface;
        copyprops(
            Interface.prototype, {
                name:'',
                usage: 'TagPattern(String css-class-name, String pattern)',
                _validate_string: function(name, str)
                {
                    if(!(typeof str == 'string')) 
                        throw Error('TagPattern: "' + name + '" must be typeof "string" see TagPattern.usage for details');
                }, 
                init_tag: function(name)
                {
                    this._validate_string('name', name);
                    this.name = name;
                }, 
                start_tag: function()
                {
                    return  '<span class="' + this.name + '" >'; 
                },
                end_tag: function()
                {
                    return  '</span>'; 
                }, 
                handle: function()
                {
                    this.value = this.start_tag() + this.value + this.end_tag();
                    return this.value;
                }, 
                toString: function()
                {
                    return '[object TagPattern]';
                } 
            });

    var TagPattern = function(tagname, pattern)
        { 
            this.init_tag(tagname); 
            this.init_pattern(pattern); 
        }
        TagPattern.prototype = new Interface;

    var RegionTagPattern = function(name, start, mid_patterns, end)
        {
            this.init_tag(name);
            this.init_region(start, mid_patterns, end);
        } 
        RegionTagPattern.prototype = new Interface;
        copyprops(RegionTagPattern.prototype, ns.RegionPatternOverlay);

    var TagWordPattern = function(tagname,pattern)
        { 
            this.init_tag(tagname); 
            this.init_pattern(pattern);
            this._prev_char = '';
            this._before_subexp = /./.compile('\\W');
            this._after_subexp = /./.compile('\\W');
        }
        TagWordPattern.prototype = new Interface;
        TagWordPattern.prototype._increment = ns.PatternInterface.prototype.increment;
        TagWordPattern.prototype._conclude = ns.PatternInterface.prototype.conclude;
        copyprops(TagWordPattern.prototype, {
                // store previous character
                // compare to end character before match
                // increment
                increment: function(c)
                { 
                    if(!(this._test_if_first(c) && this._test_if_lastafter(c)))
                    {
                        this._prev_char = c;
                        return; 
                    }
                    this._prev_char = c;
                    this._increment(c);
                },
                _test_if_first: function(c)
                {
                    if(this._count == 0)
                    {
                        if(!(this._prev_char === '' || this._before_subexp.test(this._prev_char)))
                        {
                            this._add_to_shelf(c);
                            this._set(ns.PatternInterface.NO_MATCH, this._get_shelf());
                            return false;
                        }
                    }
                    return true; 
                }, 
                _test_if_lastafter: function(c)
                {
                    if(this._count == (this._pattern.length -1))
                    {
                        if(this._pattern[this._count] == c)
                        {
                            this._add_to_shelf(c);
                            this._set(ns.PatternInterface.MATCHING, '');
                            return false;
                        }
                    }
                    else if(this._count == this._pattern.length)
                    {
                        this._add_to_shelf(c);      
                        if(!(this._prev_char === '' || this._after_subexp.test(c)))
                            this._set(ns.PatternInterface.NO_MATCH, this._get_shelf());
                        else
                            this._set(ns.PatternInterface.MATCH, this._get_shelf());
                        return false;
                    }
                    return true; 
                }, 
                handle: function()
                {
                    this.value = this.start_tag() + this.value.substring(0, this._pattern.length) 
                        +   this.end_tag() + this.value.substring(this._pattern.length, this.value.length);
                    return this.value;
                }, 
                conclude: function()
                {
                    if(this._count >= this._pattern.length)
                    {
                        this._set(ns.PatternInterface.MATCH, this._get_shelf());
                        return;
                    }
                    this._conclude();
                },
             });

    copyprops(ns, {'TagPatternInterface':Interface, 'TagPattern':TagPattern, 
        'RegionTagPattern':RegionTagPattern,
        'TagWordPattern':TagWordPattern}); 

})(window.firecrow); // pass namespace in here 

