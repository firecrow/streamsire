
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
        if(this._count == this._pattern.length) 
        {
            this.reset()
            return this.MATCH;
        }
        else if(this._pattern[this._count] == c)
        {
            this._count++;
            return this.MATCHING;
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

function Parser(name)
{
    this.name = name;
}

Parser.prototype = {
    patterns:[],// patterns to look for 
    _value:'',// end value of  
    _shelves:[],// levels of syntax beeing built
    highlight: function(content)
    { 
        // will eventually be dynamic
        l_i = 0; // shelf level
        this._shelves[l_i] = '';
        p_i = 0; // hard coded to 0 for single pattern mode for now 

        this._run_stream(content);

        return this._value;
    }, 
    _run_stream: function(content) 
    {
        for(var i = 0; i < content.length; i++)  
        {
            c = content[i];
            this._run_char(c);
        }
        this._run_char(null); // clear the last pattern if necessary 
    },
    _run_char: function(c){
        match_value = this._test_match(c, p_i); 
        this._evaluate(c, this.patterns[p_i], match_value, l_i);
    },
    _test_match: function(c,p_i)
    {
        return this.patterns[p_i].is_match(c); 
    },
    _evaluate: function(c, pattern, match_value, level) 
    {
        if(match_value == PatternBody.NOMATCH) 
            this._value += this._get_shelf(level) + c;
        else if(match_value == PatternBody.MATCHING)
            this._shelves[level] += c;
        else if(match_value == PatternBody.MATCH)
            this._value += pattern.start_tag() + this._get_shelf(level) + pattern.end_tag();
    }, 
    _get_shelf: function(level)
    {
        value = this._shelves[level];
        this._shelves[level] = '';
        return value; 
    }
}


// ---------------- testing code --------------------------
parser = new Parser('first parser'); 
//parser.patterns = [syntax_function, syntax_for, syntax_for]
parser.patterns = [ syntax_function ]; 
//parser.patterns = [ syntax_for ]; 

test_string = 'a function in here for'; 
print("\n\n\n")
print(parser.highlight(test_string));

print(parser._shelves.length);
for(var i in parser._shelves)
{
    print(parser._shelves[i])
}



