if(typeof window == 'undefined') window = {}; // for command line testing
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
        Interface.prototype = {
            _pattern: null,
            _count: 0, 
            _shelf: '',
            usage:'PatternInterface(String pattern)',
            _validate_string: function(name, str)
            {
                if(!(typeof str == 'string')) 
                    throw Error('PatternInterface: "' + name + '" must be instanceof "string" see Pattern.usage for details');
            }, 
            init_pattern: function(pattern)
            {
                this._validate_string('pattern', pattern);
                this._pattern = pattern
            }, 
            is_match: function(c)
            { 
                if(this._pattern[this._count] == c)
                {
                    if(this._count == 0) this._get_shelf();
                    if(this._count == (this._pattern.length -1)) 
                    {
                        this.reset()
                        return [Interface.MATCH, this.get(this._get_shelf() + c)];
                    }else{ 
                        this._add_to_shelf(c);
                        return [Interface.MATCHING, ''];
                    }
                }    
                else
                {
                    this.reset()
                    return [Interface.NO_MATCH, this._get_shelf() + c]; 
                }
            },
            _add_to_shelf: function(c)
            {
                this._shelf += c;
                this._count++;
            },
            reset:function()
            {
                this._count = 0; 
            },
            _get_shelf: function()
            {
                var val = this._shelf;
                this._shelf = ''; 
                return val; 
            }, 
            get: function(content)
            { 
                return content;
            }, 
            toString: function()
            {
                return '[object PatternInterface]';
            }
        }

    var Pattern = function(pattern)
        this.init_pattern(pattern);

        Pattern.prototype = new Interface;

    copyprops(ns, {'PatternInterface':Interface, 'Pattern':Pattern});

})(window.firecrow); 

(function(ns){// parser 
    
    if(!ns.PatternInterface)
        throw new Error('parser namespace: depends on "PatternInterface", not found in "ns"');
    
    function copyprops(to, from)
    { 
        for(prop in from)
            to[prop] = from[prop];
    }
     
    var Interface = function(){};
        Interface.prototype = {
            _value:'',  
            comparemanager:{},
            init_parser: function()
            {
                // enable dynamic argument assigment 
                // e.g. var parser_obj = new Parser(); Parser.apply(parser_obj, args);
                if(arguments.length) this.comparemanager = new CompareManager(arguments);
            },
            parse: function(content) 
            {
                this._value = '';
                for(var i = 0; i < content.length; i++)  
                    this._value += this.comparemanager.run(content[i]);  
                
                this._value += this.comparemanager.clear();
                return this._value;
            },
            parse_debug: function(content)
            {
                var debug_val = '';
                this._value = '';
                function parse_normal(c)
                {
                    val = this.comparemanager.run(content[i]);  
                    this._value += val;
                    return val;
                }

                function debug(c) 
                {
                    val = parse_normal.call(this, content[i]); 
                    debug_val += 'c:' + c + ' process:' + this.comparemanager.statemanager.state + ' value:\'' + val + '\'\n';
                }

                for(var i = 0; i < content.length; i++)  
                {
                    debug.call(this, content[i]);
                }
                
                val = this.comparemanager.clear();
                debug_val += '        clear value:\'' + val + '\'\n';
                this._value += val;

                return debug_val + '\n' + this._value;
            },
            toString: function()
            {
                return '[object ParserInterface]';
            }
        }

    var Parser = function() // usage: Parser(pattern,[pattern,[...]])
        this.init_parser.apply(this, arguments); 

        Parser.prototype = new Interface;

    var CompareManager = function(patterns)
        {
            this.patterns = patterns;
            this.statemanager = new StateManager(this);
        }
        CompareManager.prototype = {
            statemanager:{}, 
            patterns:[],
            run: function(c)
            {
                return this._getvalue(c); 
            },
            _getvalue: function(c)
            {
                values = []; 
                for(var pi = 0; pi < this.patterns.length; pi++)
                    values.push(this._evaluate_pattern(c,pi));
                return this.statemanager.filter_by_state(values);
            },
            _evaluate_pattern: function(c, pattern_index) 
            {
                // result = [status, content]
                var result = this.patterns[pattern_index].is_match(c); 
                this.statemanager.update_state(pattern_index, result[0])
                return result[1];
            }, 
            clear: function(c)
            {
                return this.statemanager.get_largest_shelf(values);
            }
        }

    var StateManager = function(target)
        {
            this._target = target;
            this._init_state(); 
        }
        StateManager.PENDING = 1;
        StateManager.NOT_PENDING = 0;
        StateManager.prototype = {
            state:0,
            _target:{},
            _pattern_states:[],
            update_state: function(pattern_index, value)
            {
                if(value == this._pattern_states[pattern_index])
                    return;

                this._update_pattern_state(pattern_index, value);

                for(var pi=0; pi < this._target.patterns.length; pi++){
                   if(this._pattern_states[pi] == ns.PatternInterface.MATCHING)
                   {
                        this.state = StateManager.PENDING; 
                        return;
                   }
                }
                this.state = StateManager.NOT_PENDING; 
            }, 
            _update_pattern_state: function(pattern_index, value)   
            {
                this._pattern_states[pattern_index] = value; 
            }, 
            _get_longest_result: function(values)
            {
                var longest = ''; 
                for(var i=0; i < values.length; i++)
                {
                    (function(value){
                        if (value.length > longest.length)
                            longest = value;
                        })(values[i]);
                }
                return longest;
            }, 
            filter_by_state: function(values)
            {
                if(this.state == StateManager.PENDING)
                    return '';

                return this._get_longest_result(values);
            },
            get_largest_shelf: function(values)
            {
                if(this.state != StateManager.PENDING)
                    return '';

                this.state = StateManager.NOT_PENDING; 
                var values = [];
                for(var pi=0; pi < this._target.patterns.length; pi++){
                   if(this._pattern_states[pi] == ns.PatternInterface.MATCHING)
                   {
                        values.push(this._target.patterns[pi]._get_shelf()); 
                   }
                }
                if(values.length > 0) 
                    return this.filter_by_state(values);
                return '';
            },
            _init_state: function()
            {
                for(var pi=0; pi < this._target.patterns.length; pi++)
                    this._pattern_states[pi] = ns.PatternInterface.NO_MATCH;
            },
            _show_states_debug: function()
            {
                for(var pi=0; pi < this._target.patterns.length; pi++)
                    print('pi:' + pi + ' state:' + this._pattern_states[pi]);
            }
        }

    copyprops(ns, 
            {'ParserInterface':Interface, 'Parser':Parser, 
            'ParserCompareManager':CompareManager, 
            'ParserStateManager':StateManager});

})(window.firecrow); // pass namespace in here


(function(ns){//  region patterns

    if(!(ns.PatternInterface && ns.ParserInterface))
        throw new Error('region patterns namespace: depends on "PatternInterface" and "ParserInterface", not found in "ns"');
    
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
            usage: 'RegionPatternOverlay(PatternInterface start, Array(PatternInterface, ...) or null mid_patterns, PatternInterface end)', 
            _validate_pattern: function(name, pattern)
            {
                if(!(pattern instanceof ns.PatternInterface)) 
                    throw new Error(
                        'RegionPatternOverlay.init: "' + name + '" must be intanceof "PatternInterface" or subclass, '
                        +     'see RegionPatternOverlay.usage for help');
            }, 
            _validate_init_region: function(start, mid_patterns, end)
            {
                this._validate_pattern('start',start);
                this._validate_pattern('end',end);
                if(mid_patterns)
                    for(var i=0; i < mid_patterns.length; i++)
                        this._validate_pattern('mid_patterns[' + i + ']', mid_patterns[i]);
            },
            init_region: function(start,mid_patterns,end)
            {
                this._validate_init_region(start, mid_patterns, end);
                if(mid_patterns && mid_patterns.constructor == Array)
                {
                    var mid_parser = new ns.Parser();
                    ns.Parser.apply(mid_parser, mid_patterns);
                }
                else
                    var mid_parser = null; 
                this._pattern = {'start':start,'mid':mid_parser,'end':end}
            },
            is_match: function(c)
            {
                switch(this._match_stage)
                {
                    case ns.PatternInterface.NO_MATCH:
                    case Overlay._START_MATCHING:
                        var val= this._is_start_match(c); 
                        return val; 
                        break;
                    case Overlay._MID_MATCHING:
                    case Overlay._END_MATCHING:
                        return this._is_end_match(c); 
                        break;
                }
                return ns.PatternInterface.NO_MATCH;
            }, 
            _is_start_match: function(c)
            {
                // result = [statuscode, content]
                var result = this._pattern.start.is_match(c);
                switch(result[0])
                {
                    case ns.PatternInterface.NO_MATCH:
                        return [ns.PatternInterface.NO_MATCH, c];
                        break;
                    case ns.PatternInterface.MATCHING:
                        this._match_stage = Overlay._START_MATCHING;
                        this._shelf += c;
                        return [ns.PatternInterface.MATCHING, ''];
                        break; 
                    case ns.PatternInterface.MATCH:
                        this._match_stage = Overlay._MID_MATCHING;
                        this._shelf += c;
                        return [ns.PatternInterface.MATCHING, ''];
                        break; 
                }
            },
            _is_end_match: function(c)
            {
                // result = [statuscode, content]
                var result = this._pattern.end.is_match(c)
                switch(result[0])
                {
                    case ns.PatternInterface.MATCHING:
                        this._match_stage = Overlay._END_MATCHING
                        this._shelf += c;
                        return [ns.PatternInterface.MATCHING,''];
                        break; 
                    case  ns.PatternInterface.MATCH:
                        this.reset()
                        this._shelf += c;
                        return [ns.PatternInterface.MATCH, this.get(this._get_shelf() + c)];
                        break; 
                    default:
                        this._is_mid_match(c);
                        return [ns.PatternInterface.MATCHING, ''];
                        break;
                }
            }, 
            _is_mid_match: function(c)
            {
                if(this._pattern.mid)
                    this._shelf += this._pattern.mid.comparemanager.run(c);
            }, 
            reset: function()
            {
                this._match_stage = ns.PatternInterface.NO_MATCH;
            }
        }

    var RegionPattern = function(start, mid_patterns, end)
            this.init_region(start, mid_patterns, end);

        RegionPattern.prototype = new ns.PatternInterface;
        copyprops(RegionPattern.prototype, Overlay);
    
    copyprops(ns, {'RegionPatternOverlay':Overlay, 'RegionPattern':RegionPattern}); 

})(window.firecrow); // pass namespace in here


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
                get: function(content)
                {
                    return this.start_tag() + content + this.end_tag();
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

    copyprops(ns, {'TagPatternInterface':Interface, 'TagPattern':TagPattern, 'RegionTagPattern':RegionTagPattern}); 

})(window.firecrow); // pass namespace in here 

