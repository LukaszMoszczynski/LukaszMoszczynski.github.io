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
			938:{
				items:4
			}
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
			$(".counter").each(function() {
				const element = $(this);
				const endVal = parseInt(element.text());

				element.countup(endVal);
			});

			countUpFinished = true;
		}
	});
	
});

