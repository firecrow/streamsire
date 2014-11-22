/*-- pattern.js --*/
if(typeof window == 'undefined') window = {}; // for command line testing
if(!window) window = {}; // for command line testing
if(!window.firecrow) window.firecrow = {};
(function(ns){// pattern

    function copyprops(to, from)
    { 
        for(prop in from)
            to[prop] = from[prop];
    }

    var Interface = function(){};
        Interface.NO_MATCH = 0;
        Interface.MATCHING = 1;
        Interface.MATCH = 2;
        Interface.status_codes = ['NO_MATCH','MATCHING','MATCH'];
        Interface.prototype = {
            init_pattern: function(pattern)
            {
                if(!(typeof pattern == 'string')) 
                    throw Error('PatternInterface: "' + name + '" must be instanceof "string"');
                this._pattern = pattern
                this._count = 0; 
                this._shelf = '';
                this.state = this.NO_MATCH;
                this._id = null;//set and used by controller objects to an int
                this.value = '';
            }, 
            increment: function(c)
            {
                if(this._pattern.charAt(this._count) == c){
                    if(this._count == (this._pattern.length-1)) {
                        this._add_to_shelf(c);
                        this._set(Interface.MATCH, this._get_shelf());
                    }else{
                        this._add_to_shelf(c);
                        this._set(Interface.MATCHING, '');
                    }
                }else{
                    this._add_to_shelf(c);
                    this._set(Interface.NO_MATCH, this._get_shelf());
                }
            },
            _set: function(state, value)
            {
                this.state = state;
                this.value = value;
            },
            _add_to_shelf: function(c)
            {
                this._shelf += c;
                this._count++;
            },
            _get_shelf: function()
            {
                var val = this._shelf;
                this._shelf = ''; 
                this._count = 0; 
                return val; 
            }, 
            handle: function()
            { 
                return this.value;
            }, 
            reset: function()
            {
                this.state = Interface.NO_MATCH;
                this.value = '';
                this._shelf = '';
                this._count = 0;
            }
        }

    var Pattern = function(pattern){   this.init_pattern(pattern);   }

        Pattern.prototype = new Interface;

    copyprops(ns, {'PatternInterface':Interface, 'Pattern':Pattern});


})(window.firecrow); 


/*-- parser.js --*/
if(!window) window = {}; // for command line testing
if(!window.firecrow) window.firecrow = {};

(function(ns){// parser 
    
    if(!ns.PatternInterface)
        throw new Error('parser namespace: depends on "PatternInterface", not found in "ns"');
     
    ns.Parser = function(){// usage: Parser(pattern,[pattern,[...]])
        this.comparemanager = new CompareManager();
    }
    ns.Parser.prototype = {
        comparemanager:{},
        pre_conclude_callback:function(){},
        parse: function(content) 
        {
            this.comparemanager.reset();
            for(var i = 0, l = content.length; i<l; i++){
                this.comparemanager.run(content.charAt(i)); 
            }
            this.conclude();
            return this.comparemanager.value + this.comparemanager._shelf || '';
        },
        conclude: function(){
            this.pre_conclude_callback();
            this.comparemanager.run(String.fromCharCode(4));
        },
    }


    var CompareManager = function(patterns)
        {
            this._next_pattern_id = 0;
            this.patterns = [];
            this.add_patterns(patterns);
            this.value = '';
            this._pending = [];// new
            this._shelf = '';
            this._confirmed_out = '';
        }
        CompareManager.prototype = {
            add_patterns: function(patterns){
                if(!patterns){
                    return;
                }
                for(var i =0,l = patterns.length; i<l; i++){
                   var pattern = patterns[i];
                   if(!(pattern instanceof ns.PatternInterface))
                      throw new Error('ParserInterface: pattern not instance of PatternInterface');
                    pattern._id = this._next_pattern_id;
                   this.patterns[pattern._id] = pattern;
                   this._next_pattern_id++;
                }
            },
            run: function(c)
            {
                for(var pi = 0; pi < this.patterns.length; pi++){
                    this._evaluate_pattern(c, this.patterns[pi]);
                }
                var match_found = this.evaluate_state();
                if(c != String.fromCharCode(4)){// terminating string not part of content
                    if(!match_found && this.state === ns.PatternInterface.NO_MATCH){
                        this.value += this._shelf+c;
                        this._shelf = '';
                    }else if(this.state === ns.PatternInterface.MATCHING){
                        this._shelf += c;
                    }
                }
            },
            _evaluate_pattern: function(c, pattern){
                pattern.increment(c);
                if(pattern.state === ns.PatternInterface.MATCHING || pattern.state === ns.PatternInterface.MATCH){
                   if(this._pending.indexOf(pattern) === -1){
                      this._pending.push(pattern);
                   }
                }else if(pattern.state === ns.PatternInterface.NO_MATCH){
                    var idx = this._pending.indexOf(pattern);
                    if(idx !== -1){
                      this._pending.splice(idx,1);
                   }
                }
            },
            evaluate_state: function(){// returns boolean for match found this character
               if(!this._pending.length){
                 this.state = ns.PatternInterface.NO_MATCH;
               }else{
                   this.state = ns.PatternInterface.MATCHING;
                   for(var i = 0,l = this._pending.length; i<l; i++){
                       var pattern = this._pending[i];
                       if(pattern.state === ns.PatternInterface.MATCH){
                           if(pattern.handle_custom){
                                return pattern.handle_custom(this);
                           }else{
                               this.value += this._shelf.substr(0, this._shelf.length-pattern._pattern.length+1);
                               this.value += pattern.handle();
                               this._shelf = '';
                               this.reset_pending();
                               this.state = ns.PatternInterface.NO_MATCH;
                           }
                           return true;
                       }
                   }
               }
               return false;
            },
            reset_pending:function(){
               for(var i = 0, l= this._pending.length; i<l; i++){
                   this._pending[i].reset();
               }
               this._pending = [];
            },
            reset: function()
            {
                this.value = '';
                for(var i=0; i< this.patterns.length; i++)
                    this.patterns[i].reset();
                this.state = ns.PatternInterface.NO_MATCH;
                this._shelf = '';
            }
        }

})(window.firecrow); // pass namespace in here

/*-- region.js --*/
if(!window) window = {}; // for command line testing
if(!window.firecrow) window.firecrow = {};

(function(ns){//  region patterns

    if(!(ns.PatternInterface && ns.Parser))
        throw new Error('region patterns namespace: depends on "PatternInterface" and "Parser", not found in "ns"');
    
    function copyprops(to, from)
    { 
        for(prop in from)
            to[prop] = from[prop];
    }
    
    var Overlay = {
            _match_stage:0,
            _START_MATCHING:3,
            _MID_MATCHING:4,
            _END_MATCHING:5,
            init_region: function(start,mid_patterns,end)
            {
                this._shelf = '';
                this.state = 0;
                this.value = '';
                this._validate_init_region(start, mid_patterns, end);
                if(mid_patterns && mid_patterns.constructor == Array && mid_patterns.length > 0)
                {
                    var mid_parser = new ns.Parser();
                    ns.Parser.apply(mid_parser, mid_patterns);
                }
                else
                    var mid_parser = null; 
                this._pattern = {'start':start,'mid':mid_parser,'end':end}
            },
            _validate_pattern: function(name, pattern)
            {
                if(!(pattern instanceof ns.PatternInterface)) 
                    throw new Error(
                        'RegionPatternOverlay.init: "' + name + '" must be intanceof "PatternInterface" or subclass, ');
            }, 
            _validate_init_region: function(start, mid_patterns, end)
            {
                this._validate_pattern('start',start);
                this._validate_pattern('end',end);
                if(mid_patterns)
                    for(var i=0; i < mid_patterns.length; i++)
                        this._validate_pattern('mid_patterns[' + i + ']', mid_patterns[i]);
            },
            increment: function(c)
            {
                switch(this._match_stage)
                {
                    case ns.PatternInterface.NO_MATCH:
                    case Overlay._START_MATCHING:
                        this._is_start_match(c); 
                        break;
                    case Overlay._MID_MATCHING:
                    case Overlay._END_MATCHING:
                        this._is_end_match(c); 
                        break;
                }
            }, 
            _is_start_match: function(c)
            {
                // result = [statuscode, content]
                this._pattern.start.increment(c);
                switch(this._pattern.start.state)
                {
                    case ns.PatternInterface.NO_MATCH:
                        this._shelf += c;
                        this._set(ns.PatternInterface.NO_MATCH, this._get_shelf());
                        break;
                    case ns.PatternInterface.MATCHING:
                        this._match_stage = Overlay._START_MATCHING;
                        this._shelf += c;
                        this._set(ns.PatternInterface.MATCHING, '');
                        break; 
                    case ns.PatternInterface.MATCH:
                        this._match_stage = Overlay._MID_MATCHING;
                        this._shelf += c;
                        this._set(ns.PatternInterface.MATCHING, '');
                        break; 
                }
            },
            _is_end_match: function(c)
            {
                // result = [statuscode, content]
                this._pattern.end.increment(c); 
                switch(this._pattern.end.state)
                {
                    case ns.PatternInterface.MATCHING:
                        this._match_stage = Overlay._END_MATCHING
                        this._shelf += c;
                        this._set(ns.PatternInterface.MATCHING, '');
                        break; 
                    case  ns.PatternInterface.MATCH:
                        this.reset()
                        this._shelf += c; 
                        this._set(ns.PatternInterface.MATCH, this._get_shelf());
                        break; 
                    default:
                        this._is_mid_match(c);
                        this._set(ns.PatternInterface.MATCHING, '');
                        break;
                }
            }, 
            _is_mid_match: function(c)
            {
                if(this._pattern.mid)
                    this._pattern.mid.comparemanager.run(c);
                    this._shelf += this._pattern.mid.comparemanager._round_val; 
            }, 
            reset: function()
            {
                // todo: see if this is important
                this._match_stage = ns.PatternInterface.NO_MATCH;
            },
            toString: function()
            {
                return '[object RegionPattern]';
            }, 
            conclude: function()
            {
                if(this.state == ns.PatternInterface.MATCHING)
                    this.state = ns.PatternInterface.MATCH;
                this.value = this._get_shelf(); 
            }
        }

    var RegionPattern = function(start, mid_patterns, end){ this.init_region(start, mid_patterns, end); }

        RegionPattern.prototype = new ns.PatternInterface;
        copyprops(RegionPattern.prototype, Overlay);
    
    copyprops(ns, {'RegionPatternOverlay':Overlay, 'RegionPattern':RegionPattern}); 

})(window.firecrow); // pass namespace in here

/*-- tagpattern.js --*/
if(!window) window = {}; // for command line testing
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
                init_tag: function(name, group)
                {
                    if(!(typeof name == 'string')) 
                        throw Error('TagPattern: "' + name + '" must be typeof "string"');
                    this.name = name;
                    this.group = group;
                }, 
                start_tag: function()
                {
                    return  '<span class="' + this.name + '" style="color:'+this.group.color+'" >'; 
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

    var TagPattern = function(tagname, pattern, group)
        { 
            this.init_tag(tagname, group); 
            this.init_pattern(pattern); 
        }
        TagPattern.prototype = new Interface;

    ns.TagPatternGroup = function(name, color, pattern_strings, wordpattern_strings){
        this.name = name;
        this.color = color;
        this.patterns = [];
        for(var i = 0, l = pattern_strings.length; i<l; i++){
            this.patterns.push(new ns.TagPattern(name, pattern_strings[i], this));
        }
        if(wordpattern_strings){
            for(var i = 0, l = wordpattern_strings.length; i<l; i++){
                this.patterns.push(new ns.TagWordPattern(name, wordpattern_strings[i], this));
            }
        }
    }

    ns.TagPatternGroup.prototype = {
        add_to_parser:function(parser){
            parser.comparemanager.add_patterns(this.patterns);
        }
    }

    var RegionTagPattern = function(name, start, mid_patterns, end)
        {
            this.init_tag(name);
            this.init_region(start, mid_patterns, end);
        } 
        RegionTagPattern.prototype = new Interface;
        copyprops(RegionTagPattern.prototype, ns.RegionPatternOverlay);

    var TagWordPattern = function(tagname,pattern, group)
        { 
            this.init_tag(tagname, group); 
            this.init_pattern(pattern);
            this._prev_char = '';
            this._before_subexp = /\W/;
            this._after_subexp = /\W/;
        }
        TagWordPattern.prototype = new Interface;
        TagWordPattern.prototype._increment = ns.PatternInterface.prototype.increment;
        TagWordPattern.prototype._conclude = ns.PatternInterface.prototype.conclude;
        TagWordPattern.prototype._reset = ns.PatternInterface.prototype.reset;
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
                handle_custom: function(comparemanager){
                    // get previous shelf before this container
                    comparemanager.value += comparemanager._shelf.substr(0, comparemanager._shelf.length-this._count);
                    // handle content of the word
                    comparemanager.value += this.handle();
                    //after the word
                    comparemanager._shelf = comparemanager._shelf.substr(comparemanager._shelf.length-this._count, comparemanager._shelf.length);
                    var idx = comparemanager._pending.indexOf(this);
                    comparemanager._pending.splice(idx,1);
                    this.reset();
                    // reevaluate for anything in process from the word break char
                    return comparemanager.evaluate_state();
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
                reset: function()
                {
                    this._prev_char = '';
                    this._reset();
                },
                _get_shelf: function()
                {
                    var val = this._shelf;
                    this._shelf = ''; 
                    return val; 
                }, 
             });

    copyprops(ns, {'TagPatternInterface':Interface, 'TagPattern':TagPattern, 
        'RegionTagPattern':RegionTagPattern,
        'TagWordPattern':TagWordPattern}); 

})(window.firecrow); // pass namespace in here 

