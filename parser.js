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
				},
				toString: function()
				{
						return '[object ParserInterface]';
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
            },
            add_patterns: function(/*patterns(*/){
								for(var i =0,l =arguments.length; i<l; i++){
									 var pattern = arguments[i];
									 if(!(pattern instanceof ns.PatternInterface))
											throw new Error('ParserInterface: pattern not instance of PatternInterface');
								 	 pattern._id = this._next_pattern_id;
									 this.patterns[pattern._id] = pattern;
									 this._next_pattern_id++;
								}
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
            },
            clear: function()
            {
                this._pattern_states = [];
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

