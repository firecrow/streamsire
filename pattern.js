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
                this.value = this.value;
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


