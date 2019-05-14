/**
 * @file
 * Global JavaScript file for the site.
 */

$(function() {

	// Only add the toggle class if there are child pages
	// $('#nav .menu > li > a + ul').after('<span class="js-toggle-dropdown"><span class="icon icon-plus-sign"></span></span>');
	// $('.js-toggle-dropdown').click(function(e) {
	// 	e.preventDefault();
	// 	$(this).parent().toggleClass('nav-dropdown-expanded');
	// 	$(this).find('span').toggleClass('icon-plus-sign icon-remove-sign');
	// });
	// if(Modernizr.mq('only all and (min-width: 900px)')) {
	// 	$('body').addClass('mq-desktop');
	// } else if(Modernizr.mq('only all and (min-width: 700px)')) {
	// 	$('body').addClass('mq-lg_tab');
	// } else if(Modernizr.mq('only all and (min-width: 400px)')) {
	// 	$('body').addClass('mq-phone_wide-sm_tab');
	// } else {
	// 	$('body').addClass('mq-phone');
	// }

			$('#nav-toggle').click(function(e) {
				e.preventDefault();
				$('ul#nav').toggleClass('open');
				$('body').toggleClass('nav-open');
				$(this).find('span').toggleClass('icon-reorder icon-remove-sign');

			});


});

