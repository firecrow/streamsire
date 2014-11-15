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
            usage:'PatternInterface(String pattern)',
            init_pattern: function(pattern)
            {
                if(!(typeof pattern == 'string')) 
                    throw Error('PatternInterface: "' + name + '" must be instanceof "string" see Pattern.usage for details');
                this._pattern = pattern
                this._count = 0; 
                this._shelf = '';
                this.state = this.NO_MATCH;
                this.value = '';
            }, 
            increment: function(c)
            { 
                if(this._pattern.charAt(this._count) == c)
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
            }, 
            conclude: function()
            {
                if(this.state == Interface.MATCHING)
                    this.state = Interface.NO_MATCH;
                this.value = this._get_shelf(); 
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
				if(arguments.length){
						this.comparemanager = new CompareManager(arguments);
				}
		}
		ns.Parser.prototype = {
				comparemanager:{},
				parse: function(content) 
				{
						this.comparemanager.reset();
						for(var i = 0; i < content.length; i++)  
								this.comparemanager.run(content.charAt(i)); 
						
						this.comparemanager.conclude();
						return this.comparemanager.value || '';
				}
		}


    var CompareManager = function(patterns)
        {
            this._next_pattern_id = 0;
            this.patterns = [];
            this.add_patterns.apply(this, patterns);
            this.statemanager = new StateManager(this);
            this.value = '';
            this._char = '';
            this.pendingstack = new PendingStack();
        }
        CompareManager.prototype = {
            add_patterns: function(/*patterns(*/){
								for(var i =0,l =arguments.length; i<l; i++){
									 var pattern = arguments[i];
									 if(!(pattern instanceof ns.PatternInterface))
											throw new Error('ParserInterface: pattern not instance of PatternInterface');
								 	 pattern._id = this._next_pattern_id;
									 this.patterns[pattern._id] = pattern;
									 this._next_pattern_id++;
								}
            },
            run: function(c)
            {
                this._char = c;
                for(var pi = 0; pi < this.patterns.length; pi++)
                    this._evaluate_pattern(c, this.patterns[pi]);

                this._round_val = this._get_value() || '';
                this.value += this._round_val; 
            },
            _evaluate_pattern: function(c, pattern) 
            {
                pattern.increment(c);
                this.statemanager.register(pattern); 
            }, 
            _get_value: function()
            {
                var state = this.statemanager.state;
                this.statemanager.reset();
                return this.pendingstack.contentstack.get(state, this._char); // this._char planned to be removed
            },
            conclude: function()
            {
                this.value += this.pendingstack.conclude();
            },
            reset: function()
            {
                this.value = '';
                for(var i=0; i< this.patterns.length; i++)
                    this.patterns[i].reset();
                      
                this.statemanager.clear();
                this.statemanager.state = StateManager.NOT_PENDING;
            }
        }

    var StateManager = function(target)
        {
						this.state = 0;
            this._target = target;
						this._pattern_states = [];
        }
        StateManager.NOT_PENDING = 0;
        StateManager.PENDING = 1;
        StateManager.NEW_PENDING = 2;
        StateManager.status_codes = ['NOT_PENDING','PENDING','NEW_PENDING'];
        StateManager.prototype = {
            register: function( pattern)
            {
                if(pattern.state == ns.PatternInterface.MATCHING ) this.state = StateManager.PENDING; 
                if(this._pattern_states[pattern._id] != pattern.state || pattern.state == ns.PatternInterface.MATCH)
                {
                    this._pattern_states[pattern._id] = pattern.state; 
                    this._target.pendingstack.evaluate(pattern);
                }
            },
            reset: function()
            {
                this.state = StateManager.NOT_PENDING; 
            }, 
            set: function(state)
            {
                this.state = state;
            },
            clear: function()
            {
                this._pattern_states = [];
                for(var pi=0; pi < this._target.patterns.length; pi++)
                    this._pattern_states[pi] = ns.PatternInterface.NO_MATCH;
            }
        }
        
    var PendingStack = function()
        {
            this.init_pending_stack();
        }
        PendingStack.prototype = {
            init_pending_stack: function()
            {
                this.stack = [];
                this.contentstack = new ContentStack(this);
            }, 
            remove: function(pattern) // formerly del
            {
								var self = this;
                function indexById()
                {
                  for(var i = 0; i < self.stack.length; i++){
                    if(pattern == self.stack[i])
                      return i;
                  }
                  return -1;
                }
                //var index = this.stack.indexOf(pattern); 
                var index = indexById(this);
                if(index != -1)
                    this.stack.splice(index, 1); 
            },
            evaluate: function(pattern) 
            {
                if(pattern.state == ns.PatternInterface.MATCHING)
                {
                    this.stack.push(pattern); 
                }else{
                    this.remove(pattern);
                    this.contentstack.add(pattern);
                }
            },
            lead: function()
            {
                return this.stack[0] || null;
            },
            _get_shelf: function()
            {
                if(this.stack.length > 0)
                    return this.stack[0]._get_shelf();
                return '';
            },
            conclude: function()
            {
                for( var i=0; i < this.stack.length; i++)
                {
                    var pattern = this.stack[i];
                    pattern.conclude();
                    this.evaluate(pattern);
                }
								return this.contentstack.get(StateManager.NOT_PENDING,'');
            }
        }

    var ContentStack = function(pending)
        {
           this.init_content_stack(pending); 
        }
        ContentStack.prototype = {
            init_content_stack: function(pending)
            {
                this.stack = [];
                this._pending = pending; 
                this._mask_len = 0;
            }, 
            add: function(pattern) 
            {
                if(pattern.state == ns.PatternInterface.MATCH)
                    this.stack.unshift(pattern);
                else
                    this.stack.push(pattern);
            },
            lead: function()
            {
                return this.stack[0] || null;
            },
            get: function(state, c) 
            {
                this._mask_len = 0;
                var value = '';
                if(state == StateManager.PENDING) 
                {
                    var lead = this._pending.lead()
                    if(lead)
                        this._mask_len = lead._shelf.length;
                }
                while(this.stack.length > 0) 
                {
                    var pattern = this.stack.shift(); 
                    this._less_mask(pattern);
                    this._handle_if_match(pattern);
                    value = pattern.value + value; 
                }
                if(state == StateManager.PENDING)
                    return value;
                return value || c;
            }, 
            _less_mask: function(pattern) 
            {
                pattern.value = pattern.value.substring(0, pattern.value.length - this._mask_len); 
                if(pattern.value.length > this._mask_len) this._mask_len = pattern.value.length;
            },
            _handle_if_match: function(pattern)
            {
                if(pattern.state == ns.PatternInterface.MATCH)
                    pattern.handle();
                return pattern;
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
            usage: 'RegionPatternOverlay(PatternInterface start, Array(PatternInterface, ...) or null mid_patterns, PatternInterface end)', 
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
                usage: 'TagPattern(String css-class-name, String pattern)',
                init_tag: function(name)
                {
                    if(!(typeof name == 'string')) 
                        throw Error('TagPattern: "' + name + '" must be typeof "string" see TagPattern.usage for details');
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
                reset: function()
                {
                    this._prev_char = '';
                    this._reset();
                }
             });

    copyprops(ns, {'TagPatternInterface':Interface, 'TagPattern':TagPattern, 
        'RegionTagPattern':RegionTagPattern,
        'TagWordPattern':TagWordPattern}); 

})(window.firecrow); // pass namespace in here 

