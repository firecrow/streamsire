

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
    _pattern: 'function',
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

function Pattern(name)
{
   this.name = name 
}

Pattern.prototype = PatternBody;

function MatchPattern()
{
    this.name = name;
}

function MatchPattern(name)
{
    this.name = name;
}

MatchPattern.prototype = PatternBody;

syntax_function = new Pattern('function');

syntax_string = new Pattern('');


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
        shelf_level = 0;
        this._shelves[shelf_level] = '';
        pattern = 0;

        for(var i = 0; i < content.length ;i++)
        {
            // syntax function to be replaced by  
            match_value = this.patterns[pattern].is_match(content[i]); 

            if(match_value == PatternBody.NOMATCH) 
            {
                this._value += content[i];
            }
            else if(match_value == PatternBody.MATCHING)
            {
                this._shelves[shelf_level] += content[i];
            }
            else if(match_value == PatternBody.MATCH)
            {
                this._value += this.patterns[pattern].start_tag();
                this._value += this._shelves[shelf_level];
                this._value += this.patterns[pattern].end_tag();
            }
        }
        return this._value;
    }
}

parser = new Parser('first parser'); 

test_string = 'a function in here'; 
print(parser.highlight(test_string));


