$(document).ready(function () {


	var url = window.location.href;
	
	//rules for printed menu page
	var pos = url.search("/menu/");
	if (pos != -1) {
	  document.styleSheets[0].insertRule("@page {size: A4 landscape;}", 1);
	} else 
	{
	  document.styleSheets[0].insertRule("@page {size: A4 portrait;}", 1);
	} 

	//rules for printed exit list page
	var pos = url.search("/exitList/");
	if (pos != -1) {
	  document.styleSheets[0].insertRule("@page {margin: 5% !important;}", 1);
	} else 
	{
	  
	}
	

	$(document).on("click", ".moveLeft", function () {
	  	
		var categoryHeader = '<label id="printed_menu_header">' +
		        				 $(this).closest('#printed_menu_category').find('#printed_menu_header').text() +
		      				 '</label>';
		      				 
		var newButton = '<input type="button" class="moveRight hideInPrint"  value="הזז ימינה" />';
		
		var categoryItemsList = '<ul>' + 
								$(this).closest('#printed_menu_category').find('ul').html() + 
								'</ul>';
		
		$('#printed_menu_leftColumn').prepend(
												  '<div id="printed_menu_category">'  
		                                              + categoryHeader 
		                                              + newButton
		                                              + categoryItemsList
		                                          + '</div>'
		                                    );
		
		$(this).closest('#printed_menu_category').remove();
	    
	});
	
	
	
    
	$(document).on("click", ".moveRight", function () {
	  	
	  	var categoryHeader = '<label id="printed_menu_header">' +
	            				 $(this).closest('#printed_menu_category').find('#printed_menu_header').text() +
	          				 '</label>';
	          				 
	    var newButton = '<input type="button" class="moveLeft hideInPrint"  value="הזז שמאלה" />';
	  	
	  	var categoryItemsList = '<ul>' + 
	  							$(this).closest('#printed_menu_category').find('ul').html() + 
	  							'</ul>';
	  	
	    $('#printed_menu_list').append(
	    										  '<div id="printed_menu_category">'  
		                                              + categoryHeader 
		                                              + newButton
		                                              + categoryItemsList
	                                              + '</div>'
	                                        );
	    
	    $(this).closest('#printed_menu_category').remove();
	        
	});
	
	
		//rules for printed exit list page
	var pos = url.search("/quote/");
	if (pos != -1) {


	  document.styleSheets[0].insertRule("@page {margin: 5% !important;}", 1);
	} else 
	{
	  
	}


	
	

});

$($("#quoteMainContainer")).ready(function () {
			var divs = document.getElementsByClassName("greyWhiteAlternate");
		var i;
		for (i = 0; i < divs.length; i++) {
			
			console.log(divs[i].toString());
			divs[i].style.backgroundColor = "red";	
			if (i % 2 == 0) {
				divs[i].style.backgroundColor = "red";	
			}
		}
});




