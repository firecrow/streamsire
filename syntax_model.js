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
        Interface.status_codes = ['NO_MATCH','MATCHING','MATCH']; 
        Interface.prototype = {
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
                this._count = 0; 
                this._shelf = '';
                this.state = 0;
                this.value = '';
            }, 
            increment: function(c)
            { 
                if(this._pattern[this._count] == c)
                {
                    if(this._count == (this._pattern.length -1)) 
                    {
                        this._add_to_shelf(c);
                        this._set(Interface.MATCH, this._get_shelf());
                    }else{ 
                        this._add_to_shelf(c);
                        this._set(Interface.MATCHING, '');
                    }
                }    
                else
                {
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
            comparemanager:{},
            init_parser: function()
            {
                // enable dynamic argument assigment 
                // e.g. var parser_obj = new Parser(); Parser.apply(parser_obj, args);
                if(arguments.length)
                { 
                    this.comparemanager = new CompareManager(arguments);
                }
            },
            parse: function(content) 
            {
                for(var i = 0; i < content.length; i++)  
                    this.comparemanager.run(content[i]); 
                
                this.comparemanager.clear();
                return this.comparemanager.value || '';
            },
            parse_debug: function(content)
            {
                function plot_shelves(stack, patterns, padding)
                {
                    var content = '';
                    for(var i=0; i<stack.length; i++)
                    {         
                        if(typeof stack[i]._pattern == 'string')
                            content += padding + stack[i]._pattern + ':' + stack[i]._shelf + '\n';
                        else if(typeof stack[i]._pattern == 'object'){ 
                            content += padding + 'region shelf:' + stack[i]._shelf + '\n';
                            content += run_plot_shelves(stack[i]._pattern.mid,'        ')
                        }
                        else if(typeof stack[i]._pattern == 'undefined')
                            content += padding + 'stack[' + i + '] not found \n';
                            
                    }
                    return content;
                }
                
                function run_plot_shelves(parser, padding)
                {
                    var stack = parser.comparemanager.statemanager._pending_stack; 
                    var patterns = parser.comparemanager.patterns;
                    return plot_shelves(stack, patterns,padding);
                }

                function plot_values()
                {
                    var values = [];
                    var patterns = this.comparemanager.patterns;
                    for(var i = 0; i < patterns.length; i++)
                        values.push(patterns[i]._pattern  + ':\'' + patterns[i].value + '\'');
                         
                    return '' + values;
                }

                function plot_content_stack()
                {
                    var values = [];
                    var new_content = this.comparemanager.statemanager._content_stack;;
                    for(var i = 0; i < new_content.length; i++)
                        values.push(new_content[i]._pattern  + ':\'' + new_content[i].value + '\'');
                         
                    return '' + values;
                }
                
                var debug_val = '';
                this._value = '';
                function parse_normal(c)
                {
                    this.comparemanager.run(c);  
                    //print('c:' + c + '|' +  StateManager.status_codes[this.comparemanager.statemanager.state]);// debug
                    return this.comparemanager._round_val;
                }

                function debug(c) 
                {
                    val = parse_normal.call(this, content[i]); 
                    return 'c:' + c + ' :\'' + val + '\'\n'
                    +   plot_values.call(this) + '\n' 
                    +   plot_content_stack.call(this) + '\n' 
                    +   run_plot_shelves(this,'    ');
                }

                for(var i = 0; i < content.length; i++)  
                {
                    var val = debug.call(this, content[i]);
                    // debug_val += val;
                    print(val);
                }
                
                this.comparemanager.clear();

                // print(debug_val);
                return this.comparemanager.value || '';
            },
            toString: function()
            {
                return '[object ParserInterface]';
            }
        }

    var Parser = function() // usage: Parser(pattern,[pattern,[...]])
        {
            this.init_parser.apply(this, arguments); 
        }

        Parser.prototype = new Interface;

    var CompareManager = function(patterns)
        {
            this.patterns = patterns;
            this.statemanager = new StateManager(this);
            this.value = '';
            this._char = '';
        }
        CompareManager.prototype = {
            run: function(c)
            {
                this._char = c;
                for(var pi = 0; pi < this.patterns.length; pi++)
                    this._evaluate_pattern(c, pi);
                
                this._round_val = this.statemanager.value_by_state() || '';
                this.value += this._round_val; 
            },
            _evaluate_pattern: function(c, pattern_index) 
            {
                var pattern = this.patterns[pattern_index];
                pattern.increment(c);
                this.statemanager.register(pattern_index, pattern); 
            }, 
            clear: function(c)
            {
                this.value += this.statemanager.get_shelf();
            }
        }

    var StateManager = function(target)
        {
            this.init_states();
            this._target = target;
            this._init_state(); 
        }
        StateManager.NOT_PENDING = 0;
        StateManager.PENDING = 1;
        StateManager.NEW_PENDING = 2;
        StateManager.status_codes = ['NOT_PENDING','PENDING','NEW_PENDING'];
        StateManager.prototype = {
            init_states: function()
            {
                this.state = 0;
                this._target= {};
                this._pending_stack = [];
                this._pattern_states = [];
                this._content_stack = [];
            },
            value_by_state: function()
            {
                var pattern = this._content_stack[0] || {'state':ns.PatternInterface.NO_MATCH, 'value': this._target._char};
                var back_pattern = this._get_back_pattern(pattern); 
                this.handle_if_match(pattern); 
                 
                 print('value_by_state: pattern: ' + pattern._pattern + ':' + pattern.value  
                    + ' back_pattern: ' + back_pattern._pattern + ':' + back_pattern.value);  

                var state = this.state;
                this.reset();
                if(state == StateManager.PENDING)
                { 
                    if(back_pattern)
                        return back_pattern.value;
                    else
                        return '';
                }
                else if(back_pattern)
                {
                    return back_pattern.value + pattern.value;
                }else{ 
                    return pattern.value;
                }
            },
            handle_if_match: function(pattern)
            {
                if(pattern.state == ns.PatternInterface.MATCH)
                    pattern.handle();
                return pattern;
            }, 
            _get_back_pattern: function(pending)
            {
                if(this._content_stack.length > 0)
                {
                    var pattern = this._content_stack.pop(); 
                    if(pattern == pending) // this is a quickfix, underlying condition should be eliminated
                        return false;
                    this._less_value(pattern, pending);
                    return pattern;
                }
                return false;
            }, 
            register: function(pattern_index, pattern)
            {

                if(pattern.state == ns.PatternInterface.MATCHING ) this.state = StateManager.PENDING; 
                if(this._pattern_states[pattern_index] != pattern.state)
                {
                    this._pattern_states[pattern_index] = pattern.state; 
                    this._to_pending_stack(pattern_index, pattern);
                }
            },
            _to_pending_stack: function(pattern_index, pattern)
            {
                // compare to leading pattern
                if(this._pending_stack[0] != undefined && this._pending_stack[0] == pattern)
                {
                    if(pattern.state == ns.PatternInterface.NO_MATCH)
                    {
                        this._pending_stack.shift();
                        this._content_stack.push(pattern);
                    }
                    if(pattern.state == ns.PatternInterface.MATCH)
                    {
                        this._pending_stack.shift();
                        this._content_stack.unshift(pattern);
                    }
                // or add/remove froms stack 
                }else{
                    if(pattern.state == ns.PatternInterface.MATCHING)
                        this._pending_stack.push(pattern); 
                    else if(pattern.state == ns.PatternInterface.NO_MATCH || pattern.state == ns.PatternInterface.MATCH)
                        this._del_from_pending_stack(pattern);
                        this._content_stack.push(pattern);
                }
            }, 
            _del_from_pending_stack: function(pattern)
            {
                var index = this._pending_stack.indexOf(pattern); 
                if(index != -1)
                    this._pending_stack.splice(index, 1); 
            }, 
            reset: function()
            {
                this._content_stack = [];
                this.state = StateManager.NOT_PENDING; 
            }, 
            _less_value: function(pattern, pending)
            {
                var pending_length = pending._shelf.length || pending.value.length;
                pattern.value = pattern.value.substring(0, pattern.value.length - pending_length); 
                return pending;
            },
            get_shelf: function()
            {
                if(this._pending_stack.length > 0)
                    return this._pending_stack[0]._get_shelf();
                return '';
            },
            set: function(state)
            {
                this.state = state;
            },
            _init_state: function()
            {
                for(var pi=0; pi < this._target.patterns.length; pi++)
                    this._pattern_states[pi] = ns.PatternInterface.NO_MATCH;
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
                print('is end match called');
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

    copyprops(ns, {'TagPatternInterface':Interface, 'TagPattern':TagPattern, 'RegionTagPattern':RegionTagPattern}); 

})(window.firecrow); // pass namespace in here 

