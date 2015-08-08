$(document).ready(function () {


	var url = window.location.href;
	var pos = url.search("index.html#/menu/");
	
	if (pos != -1) {
	  document.styleSheets[0].insertRule("@page {size: A4 landscape;}", 1);
	} else 
	{
	  document.styleSheets[0].insertRule("@page {size: A4 portrait;}", 1);
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
	
	
	
	

});




