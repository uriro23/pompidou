

$(document).ready(function(){
    
    
    var url = window.location.href;
    var pos = url.search("pompidou/app/index.html#/menu/"); 
    
    if (pos != -1)
    { 
        document.styleSheets[0].insertRule("@page {size: A4 landscape;}", 1);
    } else
    {
        document.styleSheets[0].insertRule("@page {size: A4 portrait;}", 1);    
    }
    
alert();  
 $(document).on("click", ".moveLeft", function() {
    alert('ggggggggggggggggggggg');
});   
    
});  




 