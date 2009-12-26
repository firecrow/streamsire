// import syntax_highlight.js up here to run

/* utility functions for debugging */


/* testing the Pattern 
var p = new Pattern('he');
print(p);

var content = 'hi there';
for(var i = 0; i < content.length; i++)
{
    c = content[i];
    print('c:' + c + ' match:' + p.is_match(c));
}
*/

/* testing the tag pattern 

var p = new TagPattern('testwork','he');
print(p);
print(p instanceof PatternInterface);

var content = 'hi there';
for(var i = 0; i < content.length; i++)
{
    c = content[i];
    print('c:' + c + ' match:' + p.is_match(c));
}

var parser = new Parser(p);
print(parser.comparemanager.patterns.length);
print( parser.comparemanager.statemanager._target.patterns[0] instanceof PatternInterface);
print( parser.comparemanager.statemanager._target.patterns[0] == p);
print( parser.comparemanager.statemanager._target.patterns[0]);
print(parser.parse(content));
*/



// ---------------- testing code for RegionPattern --------------------------
/*
var syntax_string = new RegionPattern(new Pattern('"'),[new Pattern('\\r')],new Pattern('"'));
print('\n\n');
var content = " llalalal \" fjksldfkj fjdkfj \" fjskdlfkjfdks"
print(syntax_string); 

for(var i = 0; i < content.length; i ++)
{
    c = content[i]; 
    print('c:' + c + ' is:' + syntax_string.is_match(c));
}
*/

/*
base = new Pattern(null,'basic');

var content = 'hi there basic';
for(var i = 0; i < content.length; i ++)
{
    c = content[i]; 
    print(base.is_match(c));
}
*/

// ---------------- testing code for RegionTagPattern --------------------------
/*

*/
/*
var nl = new TagPattern('string-escape-n','\\n');
var ret = new TagPattern('string-escape-r','\\r');
var tab = new TagPattern('string-escape-t','\\t');
var syntax_string = new RegionTagPattern(
    'string', 
    new TagPattern('string','"'),
    [nl,ret,tab],
    new TagPattern('string','"'));

print('\n\n');
var content = " llalalal \" fjksldfkj\\t fjdkfj\\n \" fjskdlfkjfdks"
print(syntax_string); 

print('start: ' + syntax_string._pattern.start);
print('end: ' + syntax_string._pattern.end);
print('mid ' + syntax_string._pattern.mid);

for(var i = 0; i < content.length; i ++)
{
    c = content[i]; 
    print('c:' + c + ' is:' + syntax_string.is_match(c));
}
*/

/*
base = new Pattern('basic');

var content = 'hi there basic';
for(var i = 0; i < content.length; i ++)
{
    c = content[i]; 
    print(base.is_match(c));
}
*/
// ---------------- testing code for Parser and TagPattern and RegionTagPattern --------------------------
/*
 */
 
var syntax_function = new TagPattern('function','function');
var syntax_for = new TagPattern('keyword','for');
var syntax_is = new TagPattern('keyword','is');

var start = new TagPattern('start','"');
var nl = new TagPattern('string-escape-n','\\n');
var ret = new TagPattern('string-escape-r','\\r');
var tab = new TagPattern('string-escape-t','\\t');
var end = new TagPattern('end','"');
var syntax_string = new RegionTagPattern(
    'string', 
    start,
    [nl,ret,tab], 
    end);

print("\n"); 
parser = new Parser(syntax_function, syntax_for, syntax_is, syntax_string); 
test_string = 'a function in "\\tthere\\n" for is'; 
print(test_string + '\n')
// print(parser.parse_debug(test_string));
print(parser.parse(test_string));


