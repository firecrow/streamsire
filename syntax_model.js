
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
    _match_state:0,
    is_match: function(c)
    {   
        if(this._count == (this._pattern.length -1)) 
        {
            this.reset()
            this._match_state = this.MATCH;
        }
        else if(this._pattern[this._count] == c)
        {
            this._count++;
            this._match_state = this.MATCHING;
        }    
        else
        {
            this.reset()
            this._match_state = this.NOMATCH; 
        }
        return this._match_state;
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

function Parser(name,patterns)
{
    this.name = name;
    this.set_patterns(patterns);
}

Parser.prototype = {
    patterns:[],// patterns to look for 
    _value:'',// end value of  
    _shelves:[],// levels of syntax beeing built
    _head:0,// the last character added from the stream
    _state:0,
    _match_in_progress:0,
    set_patterns: function(patterns)
    {
        this.patterns = patterns;
        for(var i = 0 ; i < patterns.length; i ++){
            // make empty strings to avoid undefined or null 
            // appearing in the content
            this._shelves[i] = '';
        }
    }, 
    highlight: function(content)
    { 
        this._run_stream(content);
        return this._value;
    }, 
    _run_stream: function(content) 
    {
        for(var i = 0; i < content.length; i++)  
        {
            c = content[i];
            this._run_char(c);
            // print('pos:' + i + ' head: ' + this._head)
        }
    },
    _run_char: function(c)
    {
        var push = [];
        for(var pi = 0; pi < this.patterns.length; pi++)
        {
            push[pi] = this._run_pattern_on_char(c,pi);
        }
        print('c:' + c + ' match:' + this._match_in_progress); 
        if(!this._match_in_progress)
        {
            value = '';
            for(var i=0; i < push.length; i++){
                val = push[i];
                if (val.length > value.length)
                    value = val;
            }
            // print(value);
            this._append_value(value);
        } 
    },
    _run_pattern_on_char: function(c,pi){
        li = pi; 
        match_value = this._test_match(c, pi); 
        return this._evaluate(c, this.patterns[pi], match_value, li);
    },
    _test_match: function(c,pi)
    {
         var state = this.patterns[pi]._match_state;
         match_value = this.patterns[pi].is_match(c); 
         if (match_value != state)
            this._update_match_state(); 
         return match_value;
    },
    _update_match_state: function()
    {
        var state = PatternBody.NOMATCH;
        for(var i =0; i < this.patterns.length; i++){
           if(this.patterns[i]._match_state == PatternBody.MATCHING)
               state = PatternBody.MATCHING;
        }
        if(state == PatternBody.MATCHING)
            this._match_in_progress = 1; 
        else
            this._match_in_progress = 0; 
    },
    _evaluate: function(c, pattern, match_value, level) 
    {
        var push_value = ''
        if(match_value == PatternBody.NOMATCH) 
        {
            var val = this._get_shelf(level) + c; 
            this._increment_head(val.length);
            push_value = val;
        }
        else if(match_value == PatternBody.MATCHING)
        {
            this._shelves[level] += c;
        }
        else if(match_value == PatternBody.MATCH)
        {
            push_value += pattern.start_tag();
            var val = this._get_shelf(level) + c;
            push_value += val;
            this._increment_head(val.length);
            push_value += pattern.end_tag();
        }
        return push_value; 
    }, 
    _append_value: function(content,extra)
    {
        this._value += content;
    }, 
    _increment_head: function(amount)
    {
        this._head += amount;
    }, 
    _get_shelf: function(level)
    {
        value = this._shelves[level];
        this._shelves[level] = '';
        return value; 
    }
}


// ---------------- testing code --------------------------
// parser = new Parser('first parser',[syntax_function]); 
// parser = new Parser('first parser',[syntax_function, syntax_is]); 
parser = new Parser('first parser',[syntax_function, syntax_for,syntax_is]); 

test_string = 'a function in here for is'; 
print("\n")
print(test_string + '\n')
print(parser.highlight(test_string));

print(parser._shelves.length);
for(var i in parser._shelves)
{
    print(parser._shelves[i])
}


