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
            }, 
            is_match: function(c)
            { 
                if(this._pattern[this._count] == c)
                {
                    if(this._count == (this._pattern.length -1)) 
                    {
                        this.reset()
                        var val = this._get_shelf() + c;
                        return [Interface.MATCH, this.handle(val), val.length];
                    }else{ 
                        this._add_to_shelf(c);
                        return [Interface.MATCHING, '', 0];
                    }
                }    
                else
                {
                    this.reset()
                    var val = this._get_shelf() + c; 
                    return [Interface.NO_MATCH, val, val.length]; 
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
            handle: function(content)
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
                function plot_shelves(stack, patterns, padding)
                {
                    var content = '';
                    for(var i=0; i<stack.length; i++)
                    {
                        if(typeof patterns[stack[i]]._pattern == 'string')
                            content += padding + patterns[stack[i]]._pattern + ':' + patterns[stack[i]]._shelf + '\n';
                        else if(typeof patterns[stack[i]]._pattern == 'object'){ 
                            content += padding + 'region shelf:' + patterns[stack[i]]._shelf + '\n';
                            content += run_plot_shelves(patterns[stack[i]]._pattern.mid,'        ')
                        }
                        else if(typeof patterns[stack[i]]._pattern == 'undefined')
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
                    debug_val += 'c:' + c + ' :\'' + val + '\'\n'
                    +   run_plot_shelves(this,'    ');
                }

                for(var i = 0; i < content.length; i++)  
                {
                    debug.call(this, content[i]);
                }
                
                val = this.comparemanager.clear();
                debug_val += 'clear value:\'' + val + '\'\n';
                this._value += val;

                return debug_val + '\n' + this._value;
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
        }
        CompareManager.prototype = {
            run: function(c)
            {
                var result = this._getvalue(c); 
                return result[1];
            },
            _getvalue: function(c)
            {
                var val = c;
                var res;
                var values = [];
                for(var pi = 0; pi < this.patterns.length; pi++)
                    values.push(this._evaluate_pattern(c, pi));
                 
                var result = this.statemanager.value_by_state(values, c);  // c not needed in for debugging
                return result;
            }, 
            _get_longest: function(arr)
            {
                var val = '';
                for(var i = 0; i<arr.length ;i++)
                {
                    if(arr[i] == -1) return false; // blank if any patterns are mid process 
                    else if(arr[i].length > val.length) val = arr[i];
                }
                return val;
            }, 
            _evaluate_pattern: function(c, pattern_index) 
            {
                // result = [status,content]
                var result = this.patterns[pattern_index].is_match(c); 
                this.statemanager.register_pattern_state(pattern_index, result); 
                return result; 
            }, 
            clear: function(c)
            {
                return this.statemanager.get_shelf();
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
        StateManager.prototype = {
            init_states: function()
            {
                this.state = 0;
                this._target= {};
                this._pending_stack = [];
                this._pattern_states = [];
                this._new_content = [];
            },
            register_pattern_state: function(pattern_index, result)
            {
                // result = [statuscode, content]
                if(this._pattern_states[pattern_index] == result[0])
                    return;

                this._pattern_states[pattern_index] = result[0];
                this._to_pending_stack(pattern_index, result);
            },
            _to_pending_stack: function(pattern_index, result)
            {
                // compare to leading pattern
                if(this._pending_stack[0] != undefined && pattern_index == this._pending_stack[0]) 
                {
                    if(result[0] == ns.PatternInterface.NO_MATCH || result[0] == ns.PatternInterface.MATCH)
                    {
                        this._pending_stack.shift();
                        this._new_content.push(result);
                    }
                // or add/remove froms stack 
                }else{ 
                    if(result[0] == ns.PatternInterface.MATCHING)
                    {
                        this._pending_stack.push(pattern_index); 
                    }
                    else if(result[0] == ns.PatternInterface.NO_MATCH || result[0] == ns.PatternInterface.MATCH)
                    {
                        this._del_from_pending_stack(pattern_index);
                    }
                }
            }, 
            _del_from_pending_stack: function(pattern_index)
            {
                var index = this._pending_stack.indexOf(pattern_index); 
                if(index != -1)
                    this._pending_stack.splice(index, 1); 
            }, 
            _get_longest_result: function(results)
            {
                // result object is [statuscode, content]
                var res = [null,''];
                for(var i=0; i<results.length; i++)
                    if(results[i][1].length > res[1].length)
                        res = results[i];
                return res;
            },
            _servey: function()
            {
                // will eventually switch over to serveying pending stack
                for(var pi=0; pi < this._target.patterns.length; pi++)
                {
                   if(this._pattern_states[pi] == ns.PatternInterface.MATCHING)
                   {
                        this.state = StateManager.PENDING; 
                        return;
                   }
                }
                this.state = StateManager.NOT_PENDING; 
            }, 
            _less_pending: function(result)
            {
                var pending = this._target.patterns[this._pending_stack[0]];
                var val = result[1].substring(0, result[1].length-pending._shelf.length);
                return [result[0], val, val.length];
            },
            value_by_state: function(results, c)
            {
                this._servey();
                if(this.state == StateManager.PENDING)
                {
                    if(this._new_content.length > 0)
                    {
                        var result = this._new_content.pop(); 
                        
                        var val = this._less_pending(result); 
                        this._new_content = [];
                        return val; 
                    }
                        
                    this._new_content = [];
                    return [null,'', 0];// blank result object 
                }
                
                if(this._new_content.length > 0 && this._pending_stack.length == 0)
                {
                    // append the previous content
                    var back_result = this._new_content.pop();
                    this._new_content = [];
                    var front_result = this._get_longest_result(results);
                    // account for front_res as possible match
                    if(back_result[1] != front_result[1])// temporary fix, should make sure 
                                                         // completed patterns not in new_content 
                                                         // as a long term fix
                    { 
                        var val = back_result[1].substring(0, back_result[1].length - front_result[2]) + front_result[1];
                        return [front_result[0], val, val.length];
                    }
                }
                 
                this._new_content = [];
                return this._get_longest_result(results);
            },
            get_shelf: function()
            {
                if(this._pending_stack.length > 0)
                    return this._target.patterns[this._pending_stack[0]]._get_shelf();
                return '';
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
            is_match: function(c)
            {
                switch(this._match_stage)
                {
                    case ns.PatternInterface.NO_MATCH:
                    case Overlay._START_MATCHING:
                        return this._is_start_match(c); 
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
                        var val = this._get_shelf() + c; 
                        return [ns.PatternInterface.NO_MATCH, val, val.length];
                        break;
                    case ns.PatternInterface.MATCHING:
                        this._match_stage = Overlay._START_MATCHING;
                        this._shelf += c;
                        return [ns.PatternInterface.MATCHING, '', 0];
                        break; 
                    case ns.PatternInterface.MATCH:
                        this._match_stage = Overlay._MID_MATCHING;
                        this._shelf += c;
                        return [ns.PatternInterface.MATCHING, '', 0];
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
                        return [ns.PatternInterface.MATCHING, '', 0];
                        break; 
                    case  ns.PatternInterface.MATCH:
                        this.reset()
                        var val = this._get_shelf() + c; 
                        return [ns.PatternInterface.MATCH, this.handle(val), val.length];
                        break; 
                    default:
                        this._is_mid_match(c);
                        return [ns.PatternInterface.MATCHING, '', 0];
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
                handle: function(content)
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

