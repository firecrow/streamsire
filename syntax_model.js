
/*
 * todo: 
 * -> make region version of pattern
 *    for matching strings
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
            this._count = 0; 
            return this.MATCH;
        }
        else if(this._pattern[this._count] == c)
        {
            this._count++;
            return this.MATCHING;
        }    
        else
        {
            return this.NOMATCH; 
        }
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

syntax_apos_string = new MatchPattern('string','\'','\'');
syntax_quote_string = new MatchPattern('string','"','"');


// funcitonality inside Parser Object eventually

function Parser(name)
{
    this.name = name;
}

Parser.prototype = {
    patterns:[syntax_function],// patterns to look for 
    _value:'',// end value of  
    _shelves:[],// levels of syntax beeing built
    highlight: function(content)
    { 
        // will eventually be dynamic
        l_i = 0; // shelf level
        this._shelves[l_i] = '';
        p_i = 0; // pattern index 

        this._run_highlight(content);

        return this._value;
    }, 
    _run_highlight: function(content) 
    {
        count = 0;
        while(count < content.length) 
        {
            i = count
            match_value = this._test_match(content[i], p_i); 
            this._evaluate(content[i], this.patterns[p_i], match_value, l_i);
            if(match_value != PatternBody.MATCH)
                count++;
        }
    },
    _test_match: function(c,p_i)
    {
        return this.patterns[p_i].is_match(c); 
    },
    _evaluate: function(c, pattern, match_value, level) 
    {
        if(match_value == PatternBody.NOMATCH) 
            this._value += c;
        else if(match_value == PatternBody.MATCHING)
            this._shelves[level] += c;
        else if(match_value == PatternBody.MATCH)
            this._value += pattern.start_tag() + this._shelves[level] + pattern.end_tag();
    }
}

parser = new Parser('first parser'); 

test_string = 'a function in here'; 
print(parser.highlight(test_string));


