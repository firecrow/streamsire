// import syntax_highlight.js up here to run

/* utility functions for debugging */


/* testing the Pattern 

var p = new window.firecrow.Pattern('he');
print(p);

var content = 'hi there';
for(var i = 0; i < content.length; i++)
{
    c = content[i];
    print('c:' + c + ' match:' + p.is_match(c));
}
*/

/* testing the tag pattern 

var p = new window.firecrow.TagPattern('testwork','he');
print(p);
print(p instanceof window.firecrow.PatternInterface);

var content = 'hi there';
for(var i = 0; i < content.length; i++)
{
    c = content[i];
    print('c:' + c + ' match:' + p.is_match(c));
}
*/

/* ------------- checking the parser ----------

var content = 'hi there';
var p = new window.firecrow.TagPattern('testwork','he');

var parser = new window.firecrow.Parser(p);
for(var i = 0; i < content.length; i++)
{
    c = content[i];
    print('c:' + c + ' match:' + p.is_match(c));
}
print(parser.parse_debug(content));

*/

// ---------------- testing code for RegionPattern --------------------------
/*
var syntax_string = new window.firecrow.RegionPattern(
    new window.firecrow.Pattern('"'),
        [new window.firecrow.Pattern('\\r')],
            new window.firecrow.Pattern('"'));
print('\n\n');
var content = " llalalal \" fjksldfkj fjdkfj \" fjskdlfkjfdks"
print(syntax_string); 

for(var i = 0; i < content.length; i ++)
{
    c = content[i]; 
    print('c:' + c + ' is:' + syntax_string.is_match(c));
}
*/

// ---------------- testing code for RegionTagPattern --------------------------
/*
var nl = new window.firecrow.TagPattern('string-escape-n','\\n');
var ret = new window.firecrow.TagPattern('string-escape-r','\\r');
var tab = new window.firecrow.TagPattern('string-escape-t','\\t');
var syntax_string = new window.firecrow.RegionTagPattern(
    'string', 
    new window.firecrow.TagPattern('string','"'),
    [nl,ret,tab],
    new window.firecrow.TagPattern('string','"'));

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

// ---------------- testing code for Parser and TagPattern and RegionTagPattern --------------------------
/*
 */
 
var syntax_function = new window.firecrow.TagPattern('function','function');
var syntax_for = new window.firecrow.TagPattern('keyword','for');
var syntax_is = new window.firecrow.TagPattern('keyword','is');

var start = new window.firecrow.TagPattern('start','"');
var nl = new window.firecrow.TagPattern('string-escape-n','\\n');
var ret = new window.firecrow.TagPattern('string-escape-r','\\r');
var tab = new window.firecrow.TagPattern('string-escape-t','\\t');
var end = new window.firecrow.TagPattern('end','"');
var syntax_string = new window.firecrow.RegionTagPattern(
    'string', 
    start,
    [nl,ret,tab], 
    end);

print("\n"); 
parser = new window.firecrow.Parser(syntax_function, syntax_for, syntax_is, syntax_string); 
test_string = 'a function in "\\tthere\\n" for is'; 
print(test_string + '\n')
// print(parser.parse_debug(test_string));
print(parser.parse_debug(test_string));
print('--------------------- again -----------------------');
print(parser.parse_debug(test_string));

