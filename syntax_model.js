

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
    startTag: function()
    {
        return  '<span class="syntax-' + this.name + '" >'; 
    },
    endTag: function()
    {
        return  '</span>'; 
    },
    _pattern: 'function',
    /*
     * the arguments for if the object matches
     * or not are the character and the index 
     * of that character in the pattern
     */
    _count: 0, 
    isMatch: function(c)
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

alert(syntax_function); 


// funcitonality inside Parser Object eventually

function Parser(name)
{
    this.name = name;
}

Parser.prototype = {
    patterns:[],// patterns to look for 
    value:'',// end value of  
    shelves:[],// levels of syntax beeing built
    highlight: function(content){ 
        /*
        for(var i = 0; i < content.length ;i++)
        {
            // syntax function to be replaced by  
            if(syntax_function.isMatch(content[i]) == Parser.NOMATCH) 
            {
                ;
            }
            print('current char:' + test_string[i] + ' is: ' + );
        }
        */
        return content;
    }
}

parser = new Parser('first parser'); 

test_string = 'a function in here'; 
print(parser.highlight(test_string));
