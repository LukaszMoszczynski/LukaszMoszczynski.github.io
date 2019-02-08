
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

	const nodes = $(".overlay-head");

	for(let i = 0; i < nodes.length; i++){
		const words = nodes[i].innerText;
		let html = "";
		for(let j=0; j < words.length; j++) {
			if(words[j] == " ") {
				html += words[j];
			} else {
				html += "<span>" + words[j] + "</span>";
			}
		}
		nodes[i].innerHTML = html;
	} 

});


$(document).ready(function() {

	$('#slides').superslides({
		animation: 'fade',
		play: 5000
	});

	const typed = new Typed('.typed', {
		strings: ["Front-end Developer.", "Developer for hire."],
		typeSpeed: 70,
		loop: true,
		backSpeed: 20,
		startDelay: 1000,
		autoInsertCss: true,
		cursorChar: '|'
	});

	$('.owl-carousel').owlCarousel({
		loop:true,
	    margin:20,
	    nav:true,
	    autoplay:true,
		autoplayTimeout:5000,
		autoplayHoverPause:true,
		responsive:{
			0:{
				items:1
			},
			480:{
				items:1
			},
			768:{
				items:2
			},
			1024:{
				items:3
			},
			1600:{
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


		if(!countUpFinished && window.pageYOffset > statsTopOffset - $(window).height() + 200) {
			$('.counter').each(function() {
				let element = $(this);
				const endVal = parseInt(element.text());

				element.countup(endVal);
			});

			countUpFinished = true;
		}
	});	

	const aboutTopOffset = $('#about').offset().top;

	$(window).resize(function(){
		animateAbout();
	});

	function animateAbout(){
		if($(window).width() >= 991) {
			$(window).scroll(function() {
				if(window.pageYOffset > aboutTopOffset - $(window).height() + 400) {		  				
					setTimeout(function(){
						$('.slide1').animate({'margin-left':'0', 'opacity': '1'}, 1000);
					}, 500);

					setTimeout(function(){
						$('.hide1').animate({'opacity': '1'}, 1000);
					}, 1000);

					setTimeout(function(){
						$('.slide2').animate({'margin-left':'0', 'opacity': '1'}, 1000);
					}, 1500);

					setTimeout(function(){
						$('.hide2').animate({'opacity': '1'}, 1000);
					}, 2000);

					setTimeout(function(){
						$('.slide3').animate({'margin-left':'0', 'opacity': '1'}, 1000);
					}, 2500);

					setTimeout(function(){
						$('.hide3').animate({'opacity': '1'}, 1000);
					}, 3000);
				}

			});	
		}
	}
	animateAbout();

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

		const targetElement = $(this).attr('href');
		const targetPosition = $(targetElement).offset().top;
		$('html, body').animate({scrollTop: targetPosition -50}, 'slow');
	});


	$('.head-button a').click(function(e) {
		e.preventDefault();

		const targetElement = $(this).attr('href');
		const targetPosition = $(targetElement).offset().top;
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


	$(document)
    .one('focus.autoExpand', 'textarea.autoExpand', function(){
        const savedValue = this.value;
        this.value = '';
        this.baseScrollHeight = this.scrollHeight;
        this.value = savedValue;
    })
    .on('input.autoExpand', 'textarea.autoExpand', function(){
        let minRows = this.getAttribute('data-min-rows')|0, rows;
        this.rows = minRows;
        rows = Math.ceil((this.scrollHeight - this.baseScrollHeight) / 16);
        this.rows = minRows + rows;
    });


    if($(window).width() < 992) {
	 $(".navbar-nav li").click(function(){ 
	   $(".navbar-toggler").click();
	  });
	}

});

