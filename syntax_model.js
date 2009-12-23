
/*
 * todo: 
 * -> make region version of pattern
 *    for matching strings
 *      would work by defining another 
 *      constant called matching which
 *      designates a match but no 
 *      increment, so it's a starting
 *      pattern unlimited space in
 *      the middle and then an ending 
 *      pattern
 *
 * expand parser to detect multiple words
 * in a region,
 *
 * make parser use embedded patterns
 * recursively
 */

/*
 * the basic idea is to have regions
 * then patterns inside the regions
 */

/*
 * when the begining of a pattern or region
 * is found, a pattern object is created
 * this pattern object is iterated
 * through until the end
 *
 * patterns which appear inside the main
 * pattern are in the contains attribute
 * of a pattern
 */

function alert(message)
{
    print(message);
} 

PatternBody = {
    start_tag: function()
    {
        return  '<span class="syntax-' + this.name + '" >'; 
    },
    end_tag: function()
    {
        return  '</span>'; 
    },
    _pattern: '!!!!',
    /*
     * the arguments for if the object matches
     * or not are the character and the index 
     * of that character in the pattern
     *
     * todo: plans are to expand this to
     * evaluate regions as well such as
     * strings
     */
    _count: 0, 
    is_match: function(c)
    { 
        if(this._pattern[this._count] == c)
        {
            if(this._count == (this._pattern.length -1)) 
            {
                this.reset()
                this._count++;
                return this.MATCH;
            }else{ 
                this._count++;
                return this.MATCHING;
            }
        }    
        else
        {
            this.reset()
            return this.NOMATCH; 
        }
    },
    reset:function()
    {
        this._count = 0; 
    },
    contains:[],
    MATCH:2,
    MATCHING: 1,
    NOMATCH: 0,
}

function Pattern(name,pattern)
{
    this.name = name 
    this._pattern = pattern
}

Pattern.prototype = PatternBody;

function MatchPattern(name,start,end)
{
    this.name = name;
    this._pattern = {'start':start,'end':end}
}

/*
MatchPattern.prototype = PatternBody;
MatchPattern.prototype.is_match = function()
{
    // customized begining to end comparison will happen here
    return 0 
}
*/

syntax_function = new Pattern('function','function');
syntax_for = new Pattern('keyword','for');
syntax_is = new Pattern('keyword','is');

syntax_apos_string = new MatchPattern('string','\'','\'');
syntax_quote_string = new MatchPattern('string','"','"');


// funcitonality inside Parser Object eventually

function Parser()
{
    if (arguments.length < 1) 
        throw Error('Parser: requires atlest one Pattern object in the arguments list');
    this.comparemanager = new CompareManager(arguments);
}

Parser.prototype = {
    _value:'',  
    comparemanager:{},
    parse: function(content) 
    {
        for(var i = 0; i < content.length; i++)  
            this._value += this.comparemanager.run(content[i]);  
        return this._value;
    },
    parse_debug: function(content)
    {
        var debug_val = ''
        for(var i = 0; i < content.length; i++)  
        {
            var val = this.comparemanager.run(content[i]);  
            debug_val += 'c:' + content[i] + ' process:' + this.comparemanager.statemanager.state + ' value:\'' + val + '\'';
            debug_val += '\n'; 
            this._value += val;  
        }
        return debug_val + '\n\n' + this._value;
    }
}

function CompareManager(patterns)
{
    this.patterns = patterns;
    this.statemanager = new StateManager(this);
    this._setup_shelves();
}

CompareManager.prototype = {
    _shelves:[],// levels of syntax beeing built
    statemanager:{}, 
    patterns:{},
    run: function(c)
    {
        var values = this._getvalues(c); 
        return this.statemanager.filter_by_state(values);
    },
    _getvalues: function(c)
    {
        values = []
        for(var pi = 0; pi < this.patterns.length; pi++)
            values.push(this._evaluate_pattern(c,pi));
        return values;
    },
    _evaluate_pattern: function(c, pattern_index) 
    {
        switch(this.statemanager.test_match(c, pattern_index))
        {
            case Pattern.prototype.NOMATCH:
                var val = this._get_shelf(pattern_index) + c; 
                break;
            case Pattern.prototype.MATCHING:
                var val = this._shelves[pattern_index] += c;
                break;
            case Pattern.prototype.MATCH: 
                var pattern = this.patterns[pattern_index];
                var val = '';
                val += pattern.start_tag();
                val += this._get_shelf(pattern_index) + c;
                val += pattern.end_tag();
                break;
            default:
                var val = '';
                break; 
        }
        return val; 
    }, 
    _get_shelf: function(level)
    {
        value = this._shelves[level];
        this._shelves[level] = '';
        return value; 
    }, 
    _setup_shelves: function()
    {
        for(var i = 0 ; i < this.patterns.length; i ++)
            this._shelves[i] = '';
    } 
}

function StateManager(target)
{
    this._target = target;
    this._init_state(); 
} 

StateManager.prototype = {
    MATCH_PENDING:1,
    NOT_PENDING:0,
    state:0,
    _target:{},
    _pattern_states:[],
    test_match: function(c,pi)
    {
         match_value = this._target.patterns[pi].is_match(c); 
         this._update_state(pi, match_value); 
         return match_value;
    },
    _update_state: function(pattern_index, value)
    {
        if(value == this._pattern_states[pattern_index])
            return;

        this._pattern_states[pattern_index] = value; 

        for(var pi=0; pi < this._target.patterns.length; pi++){
           if(this._pattern_states[pi] == Pattern.prototype.MATCHING)
           {
                this.state = this.MATCH_PENDING; 
                return;
           }
        }
        this.state = this.NOT_PENDING; 
    }, 
    filter_by_state: function(values)
    {
        function get_longest_result(results)
        {
            val = ''; 
            for(var i=0; i < results.length; i++)
                if (values[i].length > val.length)
                    val = values[i];
            return val;
        } 

        if(this.state == this.NOT_PENDING)
            return get_longest_result(values);
        return ''; 
    },
    _init_state: function()
    {
        for(var pi=0; pi < this._target.patterns.length; pi++)
            this._pattern_states[pi] = Pattern.prototype.NOMATCH;
    },
    _show_states_debug: function()
    {
        for(var pi=0; pi < this._target.patterns.length; pi++)
            print('pi:' + pi + ' state:' + this._pattern_states[pi]);
    }
}



// ---------------- testing code --------------------------
// parser = new Parser('first parser',[syntax_function]); 
// parser = new Parser('first parser',[syntax_function, syntax_is]); 
print("\n")
parser = new Parser(syntax_function, syntax_for, syntax_is); 

test_string = 'a function in here for is'; 
print(test_string + '\n')
print(parser.parse_debug(test_string));
//print(parser.parse(test_string));


