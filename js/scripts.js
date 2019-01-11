
$(window).on('load', function() {

	$('.loader .inner').fadeOut(500, function() {
		$('.loader').fadeOut(500);
	});

	$('.items').isotope({
		filter: '*',
		animationOptions: {
			duration: 1500,
			easing: 'linear',
			queue: false
		}
	});
});


$(document).ready(function() {

	$('#slides').superslides({
		animation: 'fade',
		play: 5000
	});

	const typed = new Typed('.typed', {
		strings: ["Front-end Developer.", "Web designer."],
		typeSpeed: 70,
		loop: true,
		backSpeed: 20,
		startDelay: 1000,
		autoInsertCss: true,
		cursorChar: '|'
	});

	$('.owl-carousel').owlCarousel({
		loop:true,
	    margin:10,
	    nav:true,
	    autoplay:true,
		autoplayTimeout:3000,
		autoplayHoverPause:true,
		responsive:{
			0:{
				items:1
			},
			480:{
				items:2
			},
			768:{
				items:3
			},
		}
	});

	const date1 = new Date("10/01/2017");
	const date2 = new Date();
	const timeDiff = Math.abs(date2.getTime() - date1.getTime());
	const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
	$(".days").html(diffDays);

	const skillsTopOffset = $('.skillSection').offset().top;
	const statsTopOffset = $('.statSection').offset().top;
	let countUpFinished = false;

	$(window).scroll(function() {
		if(window.pageYOffset > skillsTopOffset - $(window).height() + 400) {
			$('.chart').easyPieChart({
				easing: 'easeInOut',
				barColor: "#FFF",
				trackColor: false,
				scaleColor: false,
				lineWidth: 4,
				size: 152,
				onStep: function(from, to, percent) {
					$(this.el).find('.percent').text(Math.round(percent));
				}
			});
		}


		if(!countUpFinished && window.pageYOffset > statsTopOffset - $(window).height() + 400) {
			$('.counter').each(function() {
				let element = $(this);
				const endVal = parseInt(element.text());

				element.countup(endVal);
			});

			countUpFinished = true;
		}
	});	

	$('#filters a').click(function() {
		$('#filters .current').removeClass('current');
		$(this).addClass('current');

		const selector = $(this).attr('data-filter');
		$('.items').isotope({
			filter: selector,
			animationOptions: {
				duration: 1500,
				easing: 'linear',
				queue: false
			}
		});

		return false;
	});


	$('#navigation a').click(function(e) {
		e.preventDefault();

		let targetElement = $(this).attr('href');
		var targetPosition = $(targetElement).offset().top;
		$('html, body').animate({scrollTop: targetPosition -50}, 'slow');
	});


	const nav = $('#navigation');
	const navTop = nav.offset().top;

	$(window).on('scroll', stickyNavigation);

	function stickyNavigation() {
		let body = $('body');

		if($(window).scrollTop() >= navTop) {
			body.css('padding-top', nav.outerHeight() + 'px');
			body.addClass('fixedNav');
		} else {
			body.css('padding-top', 0);
			body.removeClass('fixedNav');
		}
	}

});

