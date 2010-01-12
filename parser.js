if(typeof window == 'undefined') window = {}; // for command line testing
if(!window.firecrow) window.firecrow = {};

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
                this.comparemanager.clear();
                for(var i = 0; i < content.length; i++)  
                    this.comparemanager.run(content[i]); 
                
                this.comparemanager.conclude();
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
                    var stack = parser.comparemanager.pendingstack.stack; 
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

                
                var debug_val = '';
                this._value = '';
                function parse_normal(c)
                {
                    this.comparemanager.run_debug(c);  
                    //print('c:' + c + '|' +  StateManager.status_codes[this.comparemanager.statemanager.state]);// debug
                    return this.comparemanager._round_val;
                }

                function debug(c) 
                {
                    val = parse_normal.call(this, content[i]); 
                    return 'c:' + c + ' :\'' + val + '\'\n'
                    + 'plot shelves:\n' +   run_plot_shelves(this,'    ');
                }

                this.comparemanager.clear();
                for(var i = 0; i < content.length; i++)  
                {
                    var val = debug.call(this, content[i]);
                    // debug_val += val;
                    print(val);
                }
                
                this.comparemanager.conclude();

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
            this._next_pattern_id = 0;
            this.patterns = [];
            this.add_patterns_batch(patterns);
            this.statemanager = new StateManager(this);
            this.value = '';
            this._char = '';
            this.pendingstack = new PendingStack();
        }
        CompareManager.prototype = {
            run: function(c)
            {
                this._char = c;
                for(var pi = 0; pi < this.patterns.length; pi++)
                    this._evaluate_pattern(c, this.patterns[pi]);

                this._round_val = this._get_value() || '';
                this.value += this._round_val; 
            },
            run_debug:function(c)
            {
                this._char = c;
                for(var pi=0; pi < this.patterns.length; pi++)
                    this._evaluate_pattern(c, this.patterns[pi]);
                
                print(this.pendingstack._debug.call(this.pendingstack));
                print(this.pendingstack.contentstack._debug.call(this.pendingstack.contentstack));

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
            conclude: function(c)
            {
                this.value += this.pendingstack.conclude();
            },
            clear: function()
            {
                this.value = '';
            },
            add_pattern: function(pattern)
            {
                if(!(pattern instanceof ns.PatternInterface))
                    throw new Error('ParserInterface: pattern not instance of PatternInterface');

                pattern._id = this._next_pattern_id;
                this.patterns[pattern._id] = pattern;
                this._next_pattern_id++;
                return pattern._id;
            }, 
            add_patterns_batch: function(patterns)
            {
                for(var i=0; i < patterns.length; i++)
                    this.add_pattern(patterns[i]);
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
                this._pattern_states = [];
            },
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
            _init_state: function()
            {
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
                var index = this.stack.indexOf(pattern); 
                if(index != -1)
                    this.stack.splice(index, 1); 
            },
            evaluate: function(pattern) // formerly to_pending_stack
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
            _debug: function(state,def) 
            { 
                var values = [];    
                for(var i = 0; i < this.stack.length; i++)
                    values.push('    ' + this.stack[i]._pattern  + ':\'' + this.stack[i]._shelf + '\'');
                     
                return 'pending stack: \n' + values.join('\n') + '\n'; 
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
            _debug: function(state,def) 
            { 
                var values = [];    
                for(var i = 0; i < this.stack.length; i++)
                    values.push('    ' + this.stack[i]._pattern  + ':\'' + this.stack[i].value + '\'');
                     
                return 'content stack: \n' + values.join('\n') + '\n'; 
            }, 
            get: function(state, c) 
            {
                this._mask_len = 0;
                var value = '';
                if(state == StateManager.PENDING) 
                    this._mask_len = this._pending.lead()._shelf.length; 

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
            }, 
        }

    copyprops(ns, 
            {'ParserInterface':Interface, 'Parser':Parser, 
            'ParserCompareManager':CompareManager, 
            'ParserStateManager':StateManager});

})(window.firecrow); // pass namespace in here

