var url = window.location.href;
var pos = url.search("pompidou/app/index.html#/menu/"); 
if (pos > 1)
{
    document.styleSheets[0].addRule("@page", "size: A4 landscape;");
}