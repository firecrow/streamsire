// import syntax_highlight.js up here to run

/* utility functions for debugging */
var ns = window.firecrow;

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

var content = 'hi there nice day';
var p = new window.firecrow.TagPattern('testwork','nice');

var parser = new window.firecrow.Parser(p);
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
var nil = new window.firecrow.TagPattern('string-escape-t','\\0');
var end = new window.firecrow.TagPattern('end','"');
var syntax_string = new window.firecrow.RegionTagPattern(
    'string', 
    start,
    [nl,ret,tab,nil], 
    end);

print("\n"); 
parser = new window.firecrow.Parser(syntax_function, syntax_for, syntax_is, syntax_string); 
test_string = 'a function in "\\tthere\\n" for ifor'; 
print(test_string + '\n')
print(parser.parse_debug(test_string));
// print(parser.parse(test_string));

// ---------------- simple set testing code for Parser and TagPattern and RegionTagPattern --------------------------
/*
 
var syntax_for = new window.firecrow.TagPattern('keyword','for');
var syntax_is = new window.firecrow.TagPattern('keyword','is');
test_string = 'c is for "\\tcookie\\n"'; 
parser = new window.firecrow.Parser(syntax_for, syntax_is); 


//--- slightly more complex set
var syntax_for = new window.firecrow.TagPattern('keyword','for');
var syntax_is = new window.firecrow.TagPattern('keyword','is');
var syntax_function = new window.firecrow.TagPattern('keyword','function');
var syntax_window = new window.firecrow.TagPattern('keyword','window');
test_string = 'c is for "\\tcookie\\n" and function firecrow'; 
parser = new window.firecrow.Parser(syntax_for, syntax_is, syntax_function, syntax_window); 

print("\n"); 
print(test_string + '\n')
print(parser.parse_debug(test_string));
// print(parser.parse(test_string));
 */

/* ---------------- testing patterns with character found twice bug -------------
 
var pattwo = new ns.TagPattern('name','window');
var pat = new ns.TagPattern('name','rowboat');

//var content = 'firecrow likes to look out the window, like a winrowboat';
var content = 'firecrow likes to look out the window, like a crowboawin';
for(var i = 0; i < content.length; i ++)
{
    c = content[i]; 
    print('c:' + c + ' is:' + pat.is_match(c));
}

var p = new ns.Parser(pat,pattwo);
print(p.parse_debug(content));

 


var content = 'function(){\n' 
+   '\n'
+   '  var val = "hi \\n"\n'
+   '\n'
+   '})(window.firecrow);\n';


var pattwo = new ns.TagPattern('name',')');
var pat = new ns.TagPattern('name','window');
var p = new ns.Parser(pat,pattwo);
// print(p.parse_debug(content));
print(p.parse(content));

 */
