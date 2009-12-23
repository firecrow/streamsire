
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
    NO_MATCH: 0,  
    MATCHING: 1,
    MATCH:2,
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
    start_tag: function()
    {
        return  '<span class="syntax-' + this.name + '" >'; 
    },
    end_tag: function()
    {
        return  '</span>'; 
    },
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
            return this.NO_MATCH; 
        }
    },
    reset:function()
    {
        this._count = 0; 
    }
}

function Pattern(name,pattern)
{
    this.name = name 
    this._pattern = pattern
}

for(prop in PatternBody)
    Pattern.prototype[prop] = PatternBody[prop];


function RegionPattern(name,start,end)
{
    this.name = name;
    this._pattern = {'start':new Pattern(null,start),'end':new Pattern(null,end)}
}


RegionPatternBody = {
    _match_stage:0,
    _START_MATCHING:3,
    _MID_MATCHING:4,
    _END_MATCHING:5,
    is_match: function(c)
    {
        switch(this._match_stage)
        {
            case this.NO_MATCH:
            case this._START_MATCHING:
                return this._is_start_match(c); 
                break;
            case this._MID_MATCHING:
            case this._END_MATCHING:
                return this._is_end_match(c); 
                break;
        }
        return this.NO_MATCH;
    }, 
    _is_start_match: function(c)
    {
        switch(this._pattern.start.is_match(c))
        {
            case this.NO_MATCH:
                return this.NO_MATCH;
                break;
            case this.MATCHING:
                this._match_stage = this._START_MATCHING;
                return this.MATCHING;
                break; 
            case this.MATCH:
                this._match_stage = this._MID_MATCHING
                return this.MATCHING;
                break; 
        }
    },
    _is_end_match: function(c)
    {
        switch(this._pattern.end.is_match(c))
        {
            case this.MATCHING:
                this._match_stage = this._END_MATCHING
                return this.MATCHING;
                break; 
            case this.MATCH:
                this.reset()
                return this.MATCH;
                break; 
            default:
                return this.MATCHING;
                break;
        }
    }, 
    reset: function()
    {
        this._match_stage = this.NO_MATCH;
    }
}    

for(prop in PatternBody)
    RegionPattern.prototype[prop] = PatternBody[prop];

for(prop in RegionPatternBody)
    RegionPattern.prototype[prop] = RegionPatternBody[prop];

// syntax_apos_string = new RegionPattern('string','\'','\'');
// syntax_quote_string = new RegionPattern('string','"','"');


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
            case Pattern.prototype.NO_MATCH:
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
            this._pattern_states[pi] = Pattern.prototype.NO_MATCH;
    },
    _show_states_debug: function()
    {
        for(var pi=0; pi < this._target.patterns.length; pi++)
            print('pi:' + pi + ' state:' + this._pattern_states[pi]);
    }
}



// ---------------- testing code for Parser --------------------------
/**/
var syntax_function = new Pattern('function','function');
var syntax_for = new Pattern('keyword','for');
var syntax_is = new Pattern('keyword','is');
var regpatt = new RegionPattern('string','"','"');
print("\n"); 
parser = new Parser(syntax_function, syntax_for, syntax_is, regpatt); 
test_string = 'a function in "here" for is'; 
print(test_string + '\n')
// print(parser.parse_debug(test_string));
print(parser.parse(test_string));
/**/

// ---------------- testing code for RegionPattern --------------------------

// print('\n\n');
// var content = " llalalal < fjksldfkj fjdkfj > fjskdlfkjfdks"
// print(regpatt); 
// 
// for(var i = 0; i < content.length; i ++)
// {
//     c = content[i]; 
//     print('c:' + c + ' is:' + regpatt.is_match(c));
// }
// 

